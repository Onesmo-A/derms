<?php

namespace App\Domains\Examination\Services;

use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Examination\Models\GradingSystem;
use App\Domains\Examination\Models\GradingSystemDetail;
use App\Domains\School\Models\School;
use App\Domains\Student\Models\Student;
use App\Enums\ExaminationRegistrationStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExaminationSetupService
{
    /**
     * Replace the subject configuration for a class level within an examination.
     */
    public function configureSubjects(Examination $exam, string $classLevelId, array $subjects): void
    {
        DB::transaction(function () use ($exam, $classLevelId, $subjects): void {
            ExaminationSubject::where('examination_id', $exam->id)
                ->where('class_level_id', $classLevelId)
                ->delete();

            foreach ($subjects as $subject) {
                $paperOneWeight = (float) $subject['paper_one_weight'];
                $paperTwoWeight = (float) $subject['paper_two_weight'];

                if (($paperOneWeight + $paperTwoWeight) !== 100.0 && ($paperOneWeight + $paperTwoWeight) !== 100) {
                    throw new \RuntimeException('Paper 1 and Paper 2 weights must sum up to exactly 100%.');
                }

                ExaminationSubject::create([
                    'id' => (string) Str::uuid(),
                    'examination_id' => $exam->id,
                    'class_level_id' => $classLevelId,
                    'subject_id' => $subject['subject_id'],
                    'max_marks' => $subject['max_marks'],
                    'pass_marks' => $subject['pass_marks'],
                    'paper_one_weight' => $paperOneWeight,
                    'paper_two_weight' => $paperTwoWeight,
                ]);
            }
        });
    }

    /**
     * Register candidates for a given examination and class level.
     */
    public function registerCandidates(Examination $exam, string $classLevelId, array $schoolIds): int
    {
        return DB::transaction(function () use ($exam, $classLevelId, $schoolIds): int {
            $registeredCount = 0;

            foreach ($schoolIds as $schoolId) {
                $school = School::findOrFail($schoolId);

                $students = Student::where('school_id', $schoolId)
                    ->where('current_class_level_id', $classLevelId)
                    ->where('status', 'active')
                    ->get();

                $nextIndex = ExaminationRegistration::join('students', 'examination_registrations.student_id', '=', 'students.id')
                    ->where('examination_registrations.examination_id', $exam->id)
                    ->where('students.school_id', $schoolId)
                    ->count() + 1;

                foreach ($students as $student) {
                    $exists = ExaminationRegistration::where('examination_id', $exam->id)
                        ->where('student_id', $student->id)
                        ->exists();

                    if ($exists) {
                        continue;
                    }

                    $examNumber = sprintf('%s/%04d', $school->candidateRegistrationPrefix(), $nextIndex);
                    $nextIndex++;

                    ExaminationRegistration::create([
                        'id' => (string) Str::uuid(),
                        'examination_id' => $exam->id,
                        'student_id' => $student->id,
                        'class_level_id' => $classLevelId,
                        'exam_number' => $examNumber,
                        'status' => ExaminationRegistrationStatus::Registered->value,
                    ]);

                    $registeredCount++;
                }
            }

            return $registeredCount;
        });
    }

    public function registerSpecificCandidates(Examination $exam, string $classLevelId, array $studentIds): int
    {
        return DB::transaction(function () use ($exam, $classLevelId, $studentIds): int {
            $registeredCount = 0;

            $students = Student::with('school')
                ->whereIn('id', $studentIds)
                ->where('current_class_level_id', $classLevelId)
                ->where('status', 'active')
                ->get()
                ->groupBy('school_id');

            foreach ($students as $schoolId => $group) {
                $school = School::findOrFail($schoolId);

                $nextIndex = ExaminationRegistration::join('students', 'examination_registrations.student_id', '=', 'students.id')
                    ->where('examination_registrations.examination_id', $exam->id)
                    ->where('students.school_id', $schoolId)
                    ->count() + 1;

                foreach ($group as $student) {
                    $exists = ExaminationRegistration::where('examination_id', $exam->id)
                        ->where('student_id', $student->id)
                        ->exists();

                    if ($exists) {
                        continue;
                    }

                    $examNumber = sprintf('%s/%04d', $school->candidateRegistrationPrefix(), $nextIndex);
                    $nextIndex++;

                    ExaminationRegistration::create([
                        'id' => (string) Str::uuid(),
                        'examination_id' => $exam->id,
                        'student_id' => $student->id,
                        'class_level_id' => $classLevelId,
                        'exam_number' => $examNumber,
                        'status' => ExaminationRegistrationStatus::Registered->value,
                    ]);

                    $registeredCount++;
                }
            }

            return $registeredCount;
        });
    }

    /**
     * Create a grading system and its detail rows.
     */
    public function createGradingSystem(array $data): GradingSystem
    {
        return DB::transaction(function () use ($data): GradingSystem {
            $gradingSystem = GradingSystem::create([
                'id' => (string) Str::uuid(),
                'name' => $data['name'],
                'class_level_id' => $data['class_level_id'] ?? null,
                'type' => $data['type'],
            ]);

            foreach ($data['details'] as $detail) {
                GradingSystemDetail::create([
                    'id' => (string) Str::uuid(),
                    'grading_system_id' => $gradingSystem->id,
                    'grade' => $detail['grade'],
                    'min_score' => $detail['min_score'],
                    'max_score' => $detail['max_score'],
                    'points' => $detail['points'],
                    'min_points' => $detail['min_points'] ?? null,
                    'max_points' => $detail['max_points'] ?? null,
                    'description' => $detail['description'] ?? null,
                ]);
            }

            return $gradingSystem->load('details');
        });
    }
}
