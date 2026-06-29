<?php

namespace App\Domains\Results\Services;

use App\Enums\ExaminationRegistrationStatus;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Examination\Models\GradingSystem;
use App\Domains\Examination\Models\GradingSystemDetail;
use App\Domains\Results\Models\Mark;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MarksService
{
    public function __construct(
        private AuditLogger $auditLogger,
    ) {}

    /**
     * Build the spreadsheet-style marks grid for a subject.
     *
     * @return array{subject_config: array<string, mixed>, candidates: array<int, array<string, mixed>>}
     */
    public function buildGrid(string $examId, string $classLevelId, string $subjectId): array
    {
        $examSubject = ExaminationSubject::where('examination_id', $examId)
            ->where('class_level_id', $classLevelId)
            ->where('subject_id', $subjectId)
            ->firstOrFail();

        $candidates = ExaminationRegistration::with('student')
            ->where('examination_id', $examId)
            ->where('class_level_id', $classLevelId)
            ->where('status', '!=', ExaminationRegistrationStatus::Disqualified->value)
            ->get();

        $grid = [];

        foreach ($candidates as $candidate) {
            $mark = Mark::where('examination_registration_id', $candidate->id)
                ->where('examination_subject_id', $examSubject->id)
                ->first();

            $grid[] = [
                'examination_registration_id' => $candidate->id,
                'student_name' => $candidate->student->first_name . ' ' . $candidate->student->last_name,
                'exam_number' => $candidate->exam_number,
                'registration_status' => $candidate->status->value,
                'paper_one_score' => $mark?->paper_one_score,
                'paper_two_score' => $mark?->paper_two_score,
                'final_score' => $mark?->final_score,
                'grade' => $mark?->grade,
                'points' => $mark?->points,
                'remarks' => $mark?->remarks,
                'is_validated' => (bool) ($mark?->is_validated ?? false),
            ];
        }

        return [
            'subject_config' => [
                'examination_subject_id' => $examSubject->id,
                'max_marks' => $examSubject->max_marks,
                'pass_marks' => $examSubject->pass_marks,
                'has_practical' => $examSubject->paper_two_weight > 0,
                'paper_one_weight' => $examSubject->paper_one_weight,
                'paper_two_weight' => $examSubject->paper_two_weight,
            ],
            'candidates' => $grid,
        ];
    }

    /**
     * Persist a batch of marks records.
     */
    public function bulkSave(string $examinationSubjectId, array $marksList, string $userId, ?\Illuminate\Http\Request $request = null): int
    {
        $examSubject = ExaminationSubject::findOrFail($examinationSubjectId);

        $gradingSystem = GradingSystem::where('class_level_id', $examSubject->class_level_id)
            ->where('type', 'subject')
            ->first();

        $gradingSystem ??= GradingSystem::where('type', 'subject')->first();

        if (! $gradingSystem) {
            throw new \RuntimeException('No grading scheme configured for subjects. Please create a grading scheme first.');
        }

        $gradingDetails = GradingSystemDetail::where('grading_system_id', $gradingSystem->id)->get();

        DB::beginTransaction();

        try {
            $savedCount = 0;

            foreach ($marksList as $entry) {
                $registrationId = $entry['examination_registration_id'];
                $status = $entry['registration_status'];

                $registration = ExaminationRegistration::findOrFail($registrationId);
                if ($registration->status->value !== $status) {
                    $registration->update(['status' => $status]);
                }

                if ($status === ExaminationRegistrationStatus::Absent->value || $status === ExaminationRegistrationStatus::Disqualified->value) {
                    $remarks = $status === ExaminationRegistrationStatus::Absent->value ? 'Absent' : 'Disqualified';

                    Mark::updateOrCreate(
                        [
                            'examination_registration_id' => $registrationId,
                            'examination_subject_id' => $examSubject->id,
                        ],
                        [
                            'id' => (string) Str::uuid(),
                            'paper_one_score' => null,
                            'paper_two_score' => null,
                            'final_score' => 0.00,
                            'grade' => 'F',
                            'points' => 5,
                            'remarks' => $remarks,
                            'entered_by' => $userId,
                            'is_validated' => true,
                        ]
                    );
                    $savedCount++;
                    continue;
                }

                $p1 = $entry['paper_one_score'] ?? 0;
                $p2 = $entry['paper_two_score'] ?? 0;

                if ($p1 > $examSubject->max_marks) {
                    throw new \RuntimeException("Paper 1 score ({$p1}) exceeds subject limit.");
                }

                if ($examSubject->paper_two_weight > 0) {
                    $finalScore = ($p1 * $examSubject->paper_one_weight / 100) + ($p2 * $examSubject->paper_two_weight / 100);
                } else {
                    $finalScore = $p1;
                }

                if ($finalScore > $examSubject->max_marks) {
                    $finalScore = $examSubject->max_marks;
                }

                $assignedGrade = 'F';
                $assignedPoints = 5;

                foreach ($gradingDetails as $detail) {
                    if ($finalScore >= $detail->min_score && $finalScore <= $detail->max_score) {
                        $assignedGrade = $detail->grade;
                        $assignedPoints = $detail->points;
                        break;
                    }
                }

                $remarks = ($finalScore >= $examSubject->pass_marks) ? 'Pass' : 'Fail';

                Mark::updateOrCreate(
                    [
                        'examination_registration_id' => $registrationId,
                        'examination_subject_id' => $examSubject->id,
                    ],
                    [
                        'id' => (string) Str::uuid(),
                        'paper_one_score' => $p1,
                        'paper_two_score' => $examSubject->paper_two_weight > 0 ? $p2 : null,
                        'final_score' => $finalScore,
                        'grade' => $assignedGrade,
                        'points' => $assignedPoints,
                        'remarks' => $remarks,
                        'entered_by' => $userId,
                        'is_validated' => true,
                    ]
                );

                $savedCount++;
            }

            DB::commit();

            $this->auditLogger->log(
                action: 'marks.bulk_save.service',
                description: 'Marks batch persisted successfully.',
                user: auth()->user(),
                newValues: [
                    'examination_subject_id' => $examinationSubjectId,
                    'saved_count' => $savedCount,
                ],
                request: $request
            );

            return $savedCount;
        } catch (\Throwable $e) {
            DB::rollBack();

            throw $e;
        }
    }
}
