<?php

namespace Database\Seeders\Modules;

use App\Actions\Examination\TransitionExaminationStatusAction;
use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Examination\Models\ExaminationType;
use App\Domains\Results\Models\Mark;
use App\Domains\Results\Services\ResultsProcessingService;
use App\Domains\School\Models\School;
use App\Domains\Student\Models\AcademicYear;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\Student\Services\StudentSubjectBackfillService;
use App\Domains\Student\Services\StudentSubjectService;
use App\Enums\ExaminationRegistrationStatus;
use App\Enums\ExaminationStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoExamCycleSeeder extends Seeder
{
    public function run(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('TRUNCATE TABLE sms_logs, marks, examination_registrations, student_exam_summaries, school_exam_summaries, subject_exam_summaries, examination_subjects, examination_class_levels, examinations RESTART IDENTITY CASCADE');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            foreach ([
                'sms_logs',
                'marks',
                'examination_registrations',
                'student_exam_summaries',
                'school_exam_summaries',
                'subject_exam_summaries',
                'examination_subjects',
                'examination_class_levels',
                'examinations',
            ] as $table) {
                DB::table($table)->truncate();
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        $academicYear = AcademicYear::where('name', '2026')->firstOrFail();
        $formFour = ClassLevel::where('name', 'Form Four')->firstOrFail();
        $examType = ExaminationType::where('code', 'MOCK')->firstOrFail();
        $admin = \App\Domains\Identity\Models\User::where('email', 'admin@idems.go.tz')->firstOrFail();

        $schools = School::orderBy('registration_number')->get();
        $students = \App\Domains\Student\Models\Student::with('school')
            ->where('current_class_level_id', $formFour->id)
            ->orderBy('registration_number')
            ->get();

        $subjectResolver = app(StudentSubjectBackfillService::class);
        $studentSubjectService = app(StudentSubjectService::class);
        $subjects = $students->isNotEmpty()
            ? $subjectResolver->resolveDefaultSubjects($students->first())
            : collect();

        if ($subjects->count() < StudentSubjectService::MIN_SUBJECTS) {
            throw new \RuntimeException('Demo exam cycle requires at least ' . StudentSubjectService::MIN_SUBJECTS . ' default subjects.');
        }

        $exam = Examination::firstOrCreate(
            ['name' => 'Form Four District Mock Exam 2026'],
            [
                'id' => (string) Str::uuid(),
                'academic_year_id' => $academicYear->id,
                'examination_type_id' => $examType->id,
                'target_class_level_id' => $formFour->id,
                'code' => 'F4-DMC-2026',
                'start_date' => '2026-06-01',
                'end_date' => '2026-06-15',
                'status' => ExaminationStatus::MarksEntryOpen->value,
                'created_by' => $admin->id,
            ]
        );

        if (empty($exam->code)) {
            $exam->code = 'F4-DMC-2026';
            $exam->target_class_level_id = $formFour->id;
            $exam->save();
        }

        DB::table('examination_class_levels')->updateOrInsert(
            [
                'examination_id' => $exam->id,
                'class_level_id' => $formFour->id,
            ],
            [
                'id' => (string) Str::uuid(),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $examSubjects = [];
        foreach ($subjects as $subject) {
            $examSubjects[] = ExaminationSubject::firstOrCreate(
                [
                    'examination_id' => $exam->id,
                    'class_level_id' => $formFour->id,
                    'subject_id' => $subject->id,
                ],
                [
                    'id' => (string) Str::uuid(),
                    'max_marks' => 100.00,
                    'pass_marks' => 30.00,
                    'paper_one_weight' => $subject->has_practical ? 70.00 : 100.00,
                    'paper_two_weight' => $subject->has_practical ? 30.00 : 0.00,
                    'paper_one_max_marks' => 100.00,
                    'paper_two_max_marks' => $subject->has_practical ? 50.00 : 0.00,
                ]
            );
        }

        $schoolCounters = [];
        $subjectIds = $subjects->pluck('id')->all();

        foreach ($students as $student) {
            $studentSubjectService->syncRegistrations(
                $student,
                $subjectIds,
                $academicYear->id,
                $admin->id
            );
        }

        foreach ($students as $student) {
            $schoolCounters[$student->school_id] = ($schoolCounters[$student->school_id] ?? 0) + 1;
            $candidateIndex = $schoolCounters[$student->school_id];
            $examNumber = $student->school->candidateRegistrationPrefix() . '/' . str_pad((string) $candidateIndex, 4, '0', STR_PAD_LEFT);

            $registration = ExaminationRegistration::firstOrCreate(
                [
                    'examination_id' => $exam->id,
                    'student_id' => $student->id,
                ],
                [
                    'id' => (string) Str::uuid(),
                    'class_level_id' => $formFour->id,
                    'exam_number' => $examNumber,
                    'status' => ExaminationRegistrationStatus::Registered->value,
                ]
            );

            foreach ($examSubjects as $subjectIndex => $examSubject) {
                $performanceProfile = $candidateIndex % 4;

                if ($performanceProfile === 0) {
                    $score1 = rand(70, 90);
                    $score2 = $examSubject->paper_two_weight > 0 ? rand(35, 50) : 0;
                } elseif ($performanceProfile === 1) {
                    $score1 = rand(45, 69);
                    $score2 = $examSubject->paper_two_weight > 0 ? rand(25, 34) : 0;
                } elseif ($performanceProfile === 2) {
                    $score1 = rand(25, 44);
                    $score2 = $examSubject->paper_two_weight > 0 ? rand(15, 24) : 0;
                } else {
                    $score1 = rand(10, 29);
                    $score2 = $examSubject->paper_two_weight > 0 ? rand(5, 14) : 0;
                }

                $finalScore = $examSubject->paper_two_weight > 0
                    ? (($score1 + $score2) / 150) * 100
                    : $score1;

                $grade = 'F';
                $points = 5;
                foreach ([
                    ['grade' => 'A', 'min' => 75.00, 'max' => 100.00, 'points' => 1],
                    ['grade' => 'B', 'min' => 65.00, 'max' => 74.99, 'points' => 2],
                    ['grade' => 'C', 'min' => 45.00, 'max' => 64.99, 'points' => 3],
                    ['grade' => 'D', 'min' => 30.00, 'max' => 44.99, 'points' => 4],
                    ['grade' => 'F', 'min' => 0.00, 'max' => 29.99, 'points' => 5],
                ] as $scheme) {
                    if ($finalScore >= $scheme['min'] && $finalScore <= $scheme['max']) {
                        $grade = $scheme['grade'];
                        $points = $scheme['points'];
                        break;
                    }
                }

                Mark::firstOrCreate(
                    [
                        'examination_registration_id' => $registration->id,
                        'examination_subject_id' => $examSubject->id,
                    ],
                    [
                        'id' => (string) Str::uuid(),
                        'paper_one_score' => $score1,
                        'paper_two_score' => $examSubject->paper_two_weight > 0 ? $score2 : null,
                        'final_score' => $finalScore,
                        'grade' => $grade,
                        'points' => $points,
                        'remarks' => $finalScore >= 30 ? 'Pass' : 'Fail',
                        'entered_by' => $admin->id,
                        'is_validated' => true,
                    ]
                );
            }
        }

        $transitionAction = app(TransitionExaminationStatusAction::class);
        $processingService = app(ResultsProcessingService::class);

        $exam = $transitionAction->handle($exam, ExaminationStatus::Processing->value);
        $processingService->process($exam->id, $formFour->id);
        $exam = $transitionAction->handle($exam, ExaminationStatus::Processed->value);
        $transitionAction->handle($exam, ExaminationStatus::Published->value);
    }
}
