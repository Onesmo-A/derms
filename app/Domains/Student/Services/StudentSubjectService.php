<?php

namespace App\Domains\Student\Services;

use App\Domains\School\Models\Subject;
use App\Domains\Student\Models\Student;
use App\Domains\Student\Models\StudentSubject;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StudentSubjectService
{
    public const MIN_SUBJECTS = 8;
    public const MAX_SUBJECTS = 11;

    public function getRegistrations(Student $student, ?string $academicYearId = null): Collection
    {
        $academicYearId = $academicYearId ?: $student->academic_year_id;

        return StudentSubject::with(['subject', 'academicYear', 'classLevel', 'registeredBy'])
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYearId)
            ->where('status', 'registered')
            ->orderBy('registered_at')
            ->get();
    }

    public function getSubjectCount(Student $student, ?string $academicYearId = null): int
    {
        return $this->getRegistrations($student, $academicYearId)->count();
    }

    public function getRegistrationStatus(Student $student, ?string $academicYearId = null): array
    {
        $count = $this->getSubjectCount($student, $academicYearId);

        return [
            'subject_count' => $count,
            'minimum_required' => self::MIN_SUBJECTS,
            'maximum_allowed' => self::MAX_SUBJECTS,
            'status' => match (true) {
                $count < self::MIN_SUBJECTS => 'incomplete',
                $count > self::MAX_SUBJECTS => 'excess',
                default => 'complete',
            },
            'eligible' => $count >= self::MIN_SUBJECTS && $count <= self::MAX_SUBJECTS,
        ];
    }

    public function syncRegistrations(Student $student, array $subjectIds, ?string $academicYearId = null, ?string $registeredBy = null): array
    {
        $academicYearId = $academicYearId ?: $student->academic_year_id;
        $subjectIds = collect($subjectIds)
            ->filter()
            ->map(fn ($subjectId) => (string) $subjectId)
            ->unique()
            ->values();

        if ($subjectIds->count() < self::MIN_SUBJECTS) {
            throw ValidationException::withMessages([
                'subject_ids' => ['Student must register at least ' . self::MIN_SUBJECTS . ' subjects.'],
            ]);
        }

        if ($subjectIds->count() > self::MAX_SUBJECTS) {
            throw ValidationException::withMessages([
                'subject_ids' => ['Maximum allowed subjects exceeded.'],
            ]);
        }

        $validSubjectIds = Subject::whereIn('id', $subjectIds)->pluck('id')->all();
        $missingSubjectIds = $subjectIds->diff($validSubjectIds)->values()->all();

        if (!empty($missingSubjectIds)) {
            throw ValidationException::withMessages([
                'subject_ids' => ['One or more selected subjects are invalid.'],
            ]);
        }

        return DB::transaction(function () use ($student, $academicYearId, $subjectIds, $registeredBy): array {
            $registrations = StudentSubject::where('student_id', $student->id)
                ->where('academic_year_id', $academicYearId)
                ->get()
                ->keyBy('subject_id');

            $selectedIds = $subjectIds->all();
            $now = now();
            $created = 0;
            $updated = 0;
            $dropped = 0;

            foreach ($registrations as $subjectId => $registration) {
                if (!in_array($subjectId, $selectedIds, true) && $registration->status !== 'dropped') {
                    $registration->update([
                        'status' => 'dropped',
                    ]);
                    $dropped++;
                }
            }

            foreach ($selectedIds as $subjectId) {
                $payload = [
                    'student_id' => $student->id,
                    'school_id' => $student->school_id,
                    'academic_year_id' => $academicYearId,
                    'class_level_id' => $student->current_class_level_id,
                    'subject_id' => $subjectId,
                    'registered_by' => $registeredBy,
                    'status' => 'registered',
                    'registered_at' => $now,
                ];

                if (isset($registrations[$subjectId])) {
                    $registrations[$subjectId]->update($payload);
                    $updated++;
                    continue;
                }

                StudentSubject::create($payload);
                $created++;
            }

            return [
                'created' => $created,
                'updated' => $updated,
                'dropped' => $dropped,
                'total' => $subjectIds->count(),
            ];
        });
    }

    /**
     * Sync the same subject set for many students in one scope.
     */
    public function syncRegistrationsForStudents(
        iterable $students,
        array $subjectIds,
        ?string $academicYearId = null,
        ?string $registeredBy = null
    ): array {
        $subjectIds = collect($subjectIds)
            ->filter()
            ->map(fn ($subjectId) => (string) $subjectId)
            ->unique()
            ->values();

        if ($subjectIds->count() < self::MIN_SUBJECTS) {
            throw ValidationException::withMessages([
                'subject_ids' => ['Student must register at least ' . self::MIN_SUBJECTS . ' subjects.'],
            ]);
        }

        if ($subjectIds->count() > self::MAX_SUBJECTS) {
            throw ValidationException::withMessages([
                'subject_ids' => ['Maximum allowed subjects exceeded.'],
            ]);
        }

        $validSubjectIds = Subject::whereIn('id', $subjectIds)->pluck('id')->all();
        $missingSubjectIds = $subjectIds->diff($validSubjectIds)->values()->all();

        if (!empty($missingSubjectIds)) {
            throw ValidationException::withMessages([
                'subject_ids' => ['One or more selected subjects are invalid.'],
            ]);
        }

        $report = [
            'processed' => 0,
            'succeeded' => 0,
            'failed' => 0,
            'created' => 0,
            'updated' => 0,
            'dropped' => 0,
            'details' => [],
        ];

        foreach ($students as $student) {
            $report['processed']++;

            try {
                $changes = $this->syncRegistrations(
                    $student,
                    $subjectIds->all(),
                    $academicYearId,
                    $registeredBy
                );

                $report['succeeded']++;
                $report['created'] += $changes['created'];
                $report['updated'] += $changes['updated'];
                $report['dropped'] += $changes['dropped'];
                $report['details'][] = [
                    'student_id' => $student->id,
                    'registration_number' => $student->registration_number,
                    'status' => 'synced',
                    'subject_count' => $changes['total'],
                ];
            } catch (\Throwable $throwable) {
                $report['failed']++;
                $report['details'][] = [
                    'student_id' => $student->id ?? null,
                    'registration_number' => $student->registration_number ?? null,
                    'status' => 'failed',
                    'message' => $throwable->getMessage(),
                ];
            }
        }

        return $report;
    }
}
