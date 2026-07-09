<?php

namespace App\Domains\Student\Services;

use App\Domains\School\Models\Subject;
use App\Domains\Student\Models\Student;
use App\Domains\Student\Models\StudentSubject;
use Illuminate\Support\Collection;

class StudentSubjectBackfillService
{
    public function __construct(
        private StudentSubjectService $studentSubjects,
    ) {}

    public function run(array $filters = [], bool $dryRun = false, bool $fillPartial = false): array
    {
        $query = Student::query()->with(['school', 'classLevel', 'academicYear']);

        $this->applyFilters($query, $filters);

        $students = $query->orderBy('registration_number')->get();

        $report = [
            'processed' => 0,
            'created' => 0,
            'updated' => 0,
            'dropped' => 0,
            'skipped' => 0,
            'already_registered' => 0,
            'insufficient_subjects' => 0,
            'details' => [],
        ];

        foreach ($students as $student) {
            $report['processed']++;

            $existingCount = StudentSubject::where('student_id', $student->id)
                ->where('academic_year_id', $student->academic_year_id)
                ->where('status', 'registered')
                ->count();

            if ($existingCount > 0 && ! $fillPartial) {
                $report['already_registered']++;
                $report['skipped']++;
                $report['details'][] = [
                    'student_id' => $student->id,
                    'registration_number' => $student->registration_number,
                    'status' => 'skipped_existing',
                    'subject_count' => $existingCount,
                ];
                continue;
            }

            $subjects = $this->resolveDefaultSubjects($student);

            if ($subjects->count() < StudentSubjectService::MIN_SUBJECTS) {
                $report['insufficient_subjects']++;
                $report['skipped']++;
                $report['details'][] = [
                    'student_id' => $student->id,
                    'registration_number' => $student->registration_number,
                    'status' => 'skipped_insufficient_subjects',
                    'subject_count' => $subjects->count(),
                ];
                continue;
            }

            if ($dryRun) {
                $report['details'][] = [
                    'student_id' => $student->id,
                    'registration_number' => $student->registration_number,
                    'status' => 'dry_run',
                    'subject_count' => $subjects->count(),
                ];
                continue;
            }

            $changes = $this->studentSubjects->syncRegistrations(
                $student,
                $subjects->pluck('id')->all(),
                $student->academic_year_id,
                null,
            );

            $report['created'] += $changes['created'];
            $report['updated'] += $changes['updated'];
            $report['dropped'] += $changes['dropped'];
            $report['details'][] = [
                'student_id' => $student->id,
                'registration_number' => $student->registration_number,
                'status' => 'synced',
                'subject_count' => $changes['total'],
            ];
        }

        return $report;
    }

    public function resolveDefaultSubjects(Student $student): Collection
    {
        $classLevelId = $student->current_class_level_id;

        $subjects = Subject::query()
            ->where('is_active', true)
            ->where(function ($query) use ($classLevelId) {
                $query->whereNull('class_level_id')
                    ->orWhere('class_level_id', $classLevelId);
            })
            ->get()
            ->sortBy(fn (Subject $subject) => sprintf('%d|%s', $subject->class_level_id ? 0 : 1, $subject->code))
            ->values();

        if ($subjects->count() > StudentSubjectService::MAX_SUBJECTS) {
            $subjects = $subjects->take(StudentSubjectService::MAX_SUBJECTS)->values();
        }

        if ($subjects->count() < StudentSubjectService::MIN_SUBJECTS) {
            $subjects = Subject::query()
                ->where('is_active', true)
                ->get()
                ->sortBy(fn (Subject $subject) => $subject->code)
                ->values()
                ->take(StudentSubjectService::MAX_SUBJECTS);
        }

        return $subjects->values();
    }

    private function applyFilters($query, array $filters): void
    {
        if (!empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (!empty($filters['class_level_id'])) {
            $query->where('current_class_level_id', $filters['class_level_id']);
        }

        if (!empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        } else {
            $query->where('status', 'active');
        }
    }
}
