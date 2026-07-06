<?php

namespace App\Domains\Examination\Services;

use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Examination\Models\GradingSystem;
use App\Domains\Examination\Models\ExaminationType;
use App\Domains\Examination\Models\Subject;
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

        $query = ExaminationRegistration::with(['student.school'])
            ->where('examination_id', $examId);

        if (!empty($filters['school_id'])) {
            $query->whereHas('student', function ($q) use ($filters) {
                $q->where('school_id', $filters['school_id']);
            });
        }

        if (!empty($classLevelId)) {
            $query->where('class_level_id', $classLevelId);
        }

        return $query->get()->map(function ($reg) {
            return [
                'id' => $reg->id,
                'examination_registration_id' => $reg->id,
                'student_id' => $reg->student_id,
                'exam_number' => $reg->exam_number,
                'first_name' => $reg->student->first_name,
                'last_name' => $reg->student->last_name,
                'school_name' => $reg->student->school->name ?? 'Unknown',
            ];
        });
    }

    public function getEligibleStudents(string $examId, array $filters = []): Collection
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

        $registeredStudentIds = ExaminationRegistration::where('examination_id', $examId)
            ->pluck('student_id')
            ->all();

        if (!empty($registeredStudentIds)) {
            $query->whereNotIn('id', $registeredStudentIds);
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

        return $query->orderBy('registration_number')->get()->map(function (Student $student) {
            return [
                'id' => $student->id,
                'registration_number' => $student->registration_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'gender' => $student->gender,
                'school_name' => $student->school?->name ?? 'Unknown',
                'school_id' => $student->school_id,
                'class_level_id' => $student->current_class_level_id,
            ];
        });
    }
}
