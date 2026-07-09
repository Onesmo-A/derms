<?php

namespace App\Domains\Examination\Services;

use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Examination\Models\GradingSystem;
use App\Domains\Examination\Models\ExaminationType;
use App\Domains\Examination\Models\Subject;
use App\Domains\Student\Services\StudentSubjectService;
use App\Domains\Student\Models\StudentSubject;
use App\Domains\Student\Models\Student;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ExaminationCatalogService
{
    public function list(array $filters): Collection
    {
        $query = Examination::with(['academicYear', 'examinationType', 'targetClassLevel', 'classLevels']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    public function show(string $id): Examination
    {
        return Examination::with([
            'academicYear',
            'examinationType',
            'targetClassLevel',
            'classLevels',
            'examinationSubjects.subject',
            'examinationSubjects.classLevel',
        ])->findOrFail($id);
    }

    public function processingStatus(Examination $exam): array
    {
        return [
            'examination_id' => $exam->id,
            'status' => $exam->status->value,
        ];
    }

    public function gradingSystems()
    {
        return GradingSystem::with('details')->get();
    }

    public function examTypes()
    {
        return ExaminationType::all();
    }

    public function curriculumSubjects()
    {
        return Subject::all();
    }

    public function getTimetable(string $examId)
    {
        return ExaminationSubject::with(['subject', 'classLevel'])
            ->where('examination_id', $examId)
            ->get();
    }

    public function updateTimetable(array $schedules): void
    {
        DB::transaction(function () use ($schedules) {
            foreach ($schedules as $sched) {
                ExaminationSubject::where('id', $sched['examination_subject_id'])
                    ->update([
                        'exam_date' => $sched['exam_date'],
                        'start_time' => $sched['start_time'],
                        'end_time' => $sched['end_time'],
                    ]);
            }
        });
    }

    public function getCandidates(string $examId, array $filters = []): Collection
    {
        $exam = Examination::with('targetClassLevel')->findOrFail($examId);
        $classLevelId = $exam->target_class_level_id ?? $exam->targetClassLevel?->id;

        if (!empty($filters['class_level_id']) && !empty($classLevelId) && $filters['class_level_id'] !== $classLevelId) {
            throw new \RuntimeException('The selected class level does not match this examination target class.');
        }

        if (empty($classLevelId)) {
            $classLevelId = $filters['class_level_id'] ?? null;
        }

        $query = ExaminationRegistration::with([
            'student.school',
            'student.subjectRegistrations.subject',
        ])
            ->where('examination_id', $examId);

        if (!empty($filters['school_id'])) {
            $query->whereHas('student', function ($q) use ($filters) {
                $q->where('school_id', $filters['school_id']);
            });
        }

        if (!empty($classLevelId)) {
            $query->where('class_level_id', $classLevelId);
        }

        if (!empty($filters['subject_id'])) {
            $subjectId = $filters['subject_id'];
            $query->whereHas('student.subjectRegistrations', function ($subjectQuery) use ($exam, $classLevelId, $subjectId) {
                $subjectQuery->where('academic_year_id', $exam->academic_year_id)
                    ->where('subject_id', $subjectId)
                    ->where('status', 'registered')
                    ->when($classLevelId, fn ($q) => $q->where('class_level_id', $classLevelId));
            });
        }

        if (!empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->whereHas('student', function ($studentQuery) use ($search) {
                $studentQuery->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        return $query->get()->map(function ($reg) use ($exam) {
            $studentSubjects = $reg->student?->subjectRegistrations
                ?->filter(fn ($subject) => $subject->status === 'registered')
                ?->filter(function ($subject) use ($reg, $exam) {
                    return $subject->academic_year_id === $exam->academic_year_id
                        && $subject->class_level_id === $reg->class_level_id;
                })
                ?->values()
                ?->map(function ($subject) {
                    return [
                        'id' => $subject->subject_id,
                        'code' => $subject->subject?->code,
                        'name' => $subject->subject?->name,
                        'short_name' => $subject->subject?->short_name,
                    ];
                }) ?? collect();

            return [
                'id' => $reg->id,
                'examination_registration_id' => $reg->id,
                'student_id' => $reg->student_id,
                'exam_number' => $reg->exam_number,
                'status' => $reg->status instanceof \BackedEnum ? $reg->status->value : (string) $reg->status,
                'first_name' => $reg->student->first_name,
                'middle_name' => $reg->student->middle_name,
                'last_name' => $reg->student->last_name,
                'registration_number' => $reg->student->registration_number,
                'gender' => $reg->student->gender,
                'school_name' => $reg->student->school->name ?? 'Unknown',
                'school_code' => $reg->student->school->registration_number ?? '—',
                'school_id' => $reg->student->school_id,
                'class_level_id' => $reg->class_level_id,
                'subject_count' => $studentSubjects->count(),
                'subjects' => $studentSubjects->values()->all(),
            ];
        });
    }

    public function getEligibleStudents(string $examId, array $filters = []): array
    {
        $exam = Examination::with('targetClassLevel')->findOrFail($examId);
        $classLevelId = $exam->target_class_level_id ?? $exam->targetClassLevel?->id;

        if (!empty($filters['class_level_id']) && !empty($classLevelId) && $filters['class_level_id'] !== $classLevelId) {
            throw new \RuntimeException('The selected class level does not match this examination target class.');
        }

        if (empty($classLevelId)) {
            $classLevelId = $filters['class_level_id'] ?? null;
        }

        $query = Student::with(['school'])
            ->where('status', 'active');

        if (!empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (!empty($classLevelId)) {
            $query->where('current_class_level_id', $classLevelId);
        }

        if (!empty($filters['subject_id'])) {
            $subjectId = $filters['subject_id'];
            $query->whereHas('subjectRegistrations', function ($subjectQuery) use ($exam, $classLevelId, $subjectId) {
                $subjectQuery->where('academic_year_id', $exam->academic_year_id)
                    ->where('subject_id', $subjectId)
                    ->where('status', 'registered')
                    ->when($classLevelId, fn ($q) => $q->where('class_level_id', $classLevelId));
            });
        }

        if (!empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        $scopeCount = (clone $query)->count();

        $eligibleBeforeExclusion = (clone $query)
            ->orderBy('registration_number')
            ->get()
            ->map(function (Student $student) use ($exam) {
                $subjectCount = StudentSubject::where('student_id', $student->id)
                    ->where('academic_year_id', $exam->academic_year_id)
                    ->where('class_level_id', $student->current_class_level_id)
                    ->where('status', 'registered')
                    ->count();

                $subjectStatus = match (true) {
                    $subjectCount < StudentSubjectService::MIN_SUBJECTS => 'incomplete',
                    $subjectCount > StudentSubjectService::MAX_SUBJECTS => 'excess',
                    default => 'complete',
                };

                return [
                    'id' => $student->id,
                    'registration_number' => $student->registration_number,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'gender' => $student->gender,
                    'school_name' => $student->school?->name ?? 'Unknown',
                    'school_id' => $student->school_id,
                    'class_level_id' => $student->current_class_level_id,
                    'subject_count' => $subjectCount,
                    'subject_registration_status' => $subjectStatus,
                    'subject_registration_message' => $subjectStatus === 'complete'
                        ? 'Eligible'
                        : ($subjectStatus === 'excess'
                            ? 'Maximum allowed subjects exceeded'
                            : 'Incomplete subject registration'),
                    'eligible' => $subjectStatus === 'complete',
                ];
            });

        $registeredStudentIds = ExaminationRegistration::where('examination_id', $examId)
            ->pluck('student_id')
            ->all();

        $students = collect($eligibleBeforeExclusion)
            ->reject(fn (array $student) => in_array($student['id'], $registeredStudentIds, true))
            ->values();

        return [
            'students' => $students,
            'meta' => [
                'scope_count' => $scopeCount,
                'eligible_count' => $students->count(),
                'eligible_before_exclusion' => $eligibleBeforeExclusion->where('eligible', true)->count(),
                'registered_count' => count($registeredStudentIds),
                'excluded_as_registered' => max(0, $eligibleBeforeExclusion->where('eligible', true)->count() - $students->count()),
            ],
        ];
    }
}
