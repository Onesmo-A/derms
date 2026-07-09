<?php

namespace App\Domains\Results\Services;

use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\GradingSystem;
use App\Domains\Examination\Models\GradingSystemDetail;
use App\Domains\Results\Models\SchoolExamSummary;
use App\Domains\Results\Models\StudentExamSummary;
use App\Domains\Results\Models\SubjectExamSummary;
use App\Domains\School\Models\School;
use App\Domains\Student\Models\StudentSubject;
use App\Domains\Student\Services\StudentSubjectService;
use App\Enums\ExaminationRegistrationStatus;
use App\Repositories\Results\ResultsRepositoryInterface;
use Illuminate\Support\Facades\DB;

class ResultsProcessingService
{
    public function __construct(
        protected ResultsRepositoryInterface $resultsRepository,
    ) {
    }

    /**
     * Process results for a specific examination and class level.
     */
    public function process(string $examinationId, string $classLevelId): void
    {
        DB::transaction(function () use ($examinationId, $classLevelId): void {
            $exam = Examination::with('targetClassLevel')->findOrFail($examinationId);
            $targetClassLevelId = $exam->target_class_level_id ?? $exam->targetClassLevel?->id;

            if (empty($classLevelId)) {
                $classLevelId = $targetClassLevelId ?? $classLevelId;
            }

            if ($targetClassLevelId && $targetClassLevelId !== $classLevelId) {
                throw new \Exception('This examination can only be processed for its target class level.');
            }

            $divisionGrading = GradingSystem::where('class_level_id', $classLevelId)
                ->where('type', 'division')
                ->whereHas('details')
                ->first();

            if (! $divisionGrading) {
                $divisionGrading = GradingSystem::where('type', 'division')
                    ->whereHas('details')
                    ->first();
            }

            if (! $divisionGrading) {
                throw new \Exception('Division grading scheme not configured. Please define division points brackets first.');
            }

            $divisionRules = GradingSystemDetail::where('grading_system_id', $divisionGrading->id)->get();

            $candidates = $this->resultsRepository->getCandidates($examinationId, $classLevelId);
            $examSubjects = $this->resultsRepository->getExamSubjects($examinationId, $classLevelId);
            $candidateSubjectMap = StudentSubject::whereIn('student_id', $candidates->pluck('student_id'))
                ->where('academic_year_id', $exam->academic_year_id)
                ->where('class_level_id', $classLevelId)
                ->where('status', 'registered')
                ->get()
                ->groupBy('student_id')
                ->map(fn ($rows) => $rows->pluck('subject_id')->values());

            if ($candidates->isEmpty()) {
                throw new \Exception('No candidates were found for this examination class level.');
            }

            if ($examSubjects->isEmpty()) {
                throw new \Exception('No examination subjects were configured for this examination class level.');
            }

            StudentExamSummary::whereIn('examination_registration_id', $candidates->pluck('id'))->delete();
            SchoolExamSummary::where('examination_id', $examinationId)
                ->where('class_level_id', $classLevelId)
                ->delete();
            SubjectExamSummary::where('examination_id', $examinationId)
                ->where('class_level_id', $classLevelId)
                ->delete();

            foreach ($candidates as $candidate) {
                if ($candidate->status->value === ExaminationRegistrationStatus::Absent->value) {
                    continue;
                }

                $candidateSubjectIds = $candidateSubjectMap->get($candidate->student_id, collect());

                $candidateExamSubjectIds = $examSubjects
                    ->whereIn('subject_id', $candidateSubjectIds)
                    ->pluck('id');

                if ($candidateSubjectIds->count() < StudentSubjectService::MIN_SUBJECTS || $candidateSubjectIds->count() > StudentSubjectService::MAX_SUBJECTS) {
                    throw new \Exception("Incomplete subject registration found for registration {$candidate->exam_number}. Please complete subject registration before processing.");
                }

                if ($candidateExamSubjectIds->count() !== $candidateSubjectIds->count()) {
                    throw new \Exception("Subject registration mismatch found for registration {$candidate->exam_number}. Please complete subject setup before processing.");
                }

                $marks = $this->resultsRepository->getCandidateMarks($candidate->id, $candidateExamSubjectIds);

                if ($marks->count() !== $candidateExamSubjectIds->count()) {
                    throw new \Exception("Incomplete marks found for registration {$candidate->exam_number}. Please finish marks entry before processing.");
                }
            }

            foreach ($candidates as $candidate) {
                if ($candidate->status->value === ExaminationRegistrationStatus::Absent->value) {
                    StudentExamSummary::create([
                        'examination_registration_id' => $candidate->id,
                        'total_marks' => 0.00,
                        'average_marks' => 0.00,
                        'gpa' => 5.00,
                        'division' => '0',
                        'division_points' => 35,
                        'passed_subjects_count' => 0,
                        'failed_subjects_count' => $examSubjects->count(),
                        'status' => 'processed',
                    ]);
                    continue;
                }

                $candidateSubjectIds = $candidateSubjectMap->get($candidate->student_id, collect());

                if ($candidateSubjectIds->count() < StudentSubjectService::MIN_SUBJECTS || $candidateSubjectIds->count() > StudentSubjectService::MAX_SUBJECTS) {
                    throw new \Exception("Incomplete subject registration found for registration {$candidate->exam_number}. Please complete subject registration before processing.");
                }

                $candidateExamSubjectIds = $examSubjects
                    ->whereIn('subject_id', $candidateSubjectIds)
                    ->pluck('id');

                $marks = $this->resultsRepository->getCandidateMarks($candidate->id, $candidateExamSubjectIds);

                $totalMarks = 0;
                $passedCount = 0;
                $failedCount = 0;
                $pointsArray = [];

                foreach ($marks as $mark) {
                    $score = $mark->final_score ?? 0;
                    $totalMarks += $score;

                    $subjConfig = $examSubjects->firstWhere('id', $mark->examination_subject_id);
                    $passMark = $subjConfig ? $subjConfig->pass_marks : 30.00;

                    if ($score >= $passMark && $mark->grade !== 'F') {
                        $passedCount++;
                    } else {
                        $failedCount++;
                    }

                    $pointsArray[] = $mark->points ?? 5;
                }

                sort($pointsArray);

                $bestSevenPoints = array_slice($pointsArray, 0, 7);
                $divisionPoints = array_sum($bestSevenPoints);

                if (count($pointsArray) < 7) {
                    $divisionPoints += (7 - count($pointsArray)) * 5;
                }

                $assignedDivision = '0';
                foreach ($divisionRules as $rule) {
                    if ($divisionPoints >= $rule->min_points && $divisionPoints <= $rule->max_points) {
                        $assignedDivision = $rule->grade;
                        break;
                    }
                }

                $subjectCount = $marks->count();
                $averageMarks = $subjectCount > 0 ? ($totalMarks / $subjectCount) : 0;
                $gpa = $divisionPoints / 7;

                StudentExamSummary::create([
                    'examination_registration_id' => $candidate->id,
                    'total_marks' => $totalMarks,
                    'average_marks' => $averageMarks,
                    'gpa' => $gpa,
                    'division' => $assignedDivision,
                    'division_points' => $divisionPoints,
                    'passed_subjects_count' => $passedCount,
                    'failed_subjects_count' => $failedCount,
                    'status' => 'processed',
                ]);
            }

            $summaries = $this->resultsRepository->getSummaryRows($examinationId, $classLevelId);

            $activeSummaries = $summaries
                ->where('reg_status', '!=', ExaminationRegistrationStatus::Absent->value)
                ->sortBy([
                    ['gpa', 'asc'],
                    ['division_points', 'asc'],
                    ['average_marks', 'desc'],
                ])
                ->values();

            foreach ($activeSummaries as $index => $summary) {
                StudentExamSummary::find($summary->id)?->update(['district_position' => $index + 1]);
            }

            foreach ($activeSummaries->groupBy('region_id') as $regionSummaries) {
                $regionRankedSummaries = $regionSummaries
                    ->sortBy([
                        ['gpa', 'asc'],
                        ['division_points', 'asc'],
                        ['average_marks', 'desc'],
                    ])
                    ->values();

                foreach ($regionRankedSummaries as $index => $summary) {
                    StudentExamSummary::find($summary->id)?->update(['region_position' => $index + 1]);
                }
            }

            foreach ($summaries->groupBy('school_id') as $schoolSummaries) {
                $activeSchoolSummaries = $schoolSummaries
                    ->where('reg_status', '!=', ExaminationRegistrationStatus::Absent->value)
                    ->sortBy([
                        ['gpa', 'asc'],
                        ['division_points', 'asc'],
                        ['average_marks', 'desc'],
                    ])
                    ->values();

                foreach ($activeSchoolSummaries as $index => $summary) {
                    StudentExamSummary::find($summary->id)?->update(['school_position' => $index + 1]);
                }
            }

            $schools = School::whereIn('id', $summaries->pluck('school_id')->filter()->unique())->get();

            foreach ($schools as $school) {
                $schoolCand = $summaries->where('school_id', $school->id);
                $registered = $schoolCand->count();
                $absent = $schoolCand->where('reg_status', ExaminationRegistrationStatus::Absent->value)->count();
                $sat = $registered - $absent;

                if ($sat === 0) {
                    continue;
                }

                $divI = $schoolCand->where('division', 'I')->count();
                $divII = $schoolCand->where('division', 'II')->count();
                $divIII = $schoolCand->where('division', 'III')->count();
                $divIV = $schoolCand->where('division', 'IV')->count();
                $divZero = $schoolCand->where('division', '0')->count();
                $totalGpa = $schoolCand->where('reg_status', '!=', ExaminationRegistrationStatus::Absent->value)->avg('gpa') ?? 5.00;
                $passRate = (($sat - $divZero) / $sat) * 100;

                SchoolExamSummary::create([
                    'examination_id' => $examinationId,
                    'school_id' => $school->id,
                    'class_level_id' => $classLevelId,
                    'registered_candidates' => $registered,
                    'sat_candidates' => $sat,
                    'absent_candidates' => $absent,
                    'total_gpa' => $totalGpa,
                    'division_i_count' => $divI,
                    'division_ii_count' => $divII,
                    'division_iii_count' => $divIII,
                    'division_iv_count' => $divIV,
                    'division_zero_count' => $divZero,
                    'pass_rate' => $passRate,
                    'fail_rate' => 100 - $passRate,
                ]);
            }

            $schoolSummaries = SchoolExamSummary::where('examination_id', $examinationId)
                ->where('class_level_id', $classLevelId)
                ->orderBy('total_gpa', 'asc')
                ->get();

            foreach ($schoolSummaries as $index => $summary) {
                $summary->update(['school_position_district' => $index + 1]);
            }

            foreach ($examSubjects as $examSub) {
                $subjectMarks = $this->resultsRepository->getSubjectMarks($examSub->id);

                foreach ($subjectMarks->groupBy('school_id') as $schoolId => $marksGroup) {
                    $reg = $marksGroup->count();
                    $satC = $marksGroup->where('reg_status', '!=', ExaminationRegistrationStatus::Absent->value)->count();

                    if ($satC === 0) {
                        continue;
                    }

                    $totalScore = $marksGroup->sum('final_score');
                    $avgScore = $totalScore / $satC;
                    $subjGpa = $marksGroup->where('reg_status', '!=', ExaminationRegistrationStatus::Absent->value)->avg('points') ?? 5.00;

                    SubjectExamSummary::create([
                        'examination_id' => $examinationId,
                        'class_level_id' => $classLevelId,
                        'subject_id' => $examSub->subject_id,
                        'school_id' => $schoolId,
                        'registered_candidates' => $reg,
                        'sat_candidates' => $satC,
                        'total_score' => $totalScore,
                        'average_score' => $avgScore,
                        'gpa' => $subjGpa,
                        'grade_a_count' => $marksGroup->where('grade', 'A')->count(),
                        'grade_b_count' => $marksGroup->where('grade', 'B')->count(),
                        'grade_c_count' => $marksGroup->where('grade', 'C')->count(),
                        'grade_d_count' => $marksGroup->where('grade', 'D')->count(),
                        'grade_f_count' => $marksGroup->where('grade', 'F')->count(),
                    ]);
                }

                $subSchools = SubjectExamSummary::where('examination_id', $examinationId)
                    ->where('class_level_id', $classLevelId)
                    ->where('subject_id', $examSub->subject_id)
                    ->whereNotNull('school_id')
                    ->orderBy('gpa', 'asc')
                    ->get();

                foreach ($subSchools as $index => $summary) {
                    $summary->update(['subject_position_district' => $index + 1]);
                }

                $distReg = $subjectMarks->count();
                $distSat = $subjectMarks->where('reg_status', '!=', ExaminationRegistrationStatus::Absent->value)->count();

                if ($distSat > 0) {
                    $distTotalScore = $subjectMarks->sum('final_score');
                    $distAvg = $distTotalScore / $distSat;
                    $distGpa = $subjectMarks->where('reg_status', '!=', ExaminationRegistrationStatus::Absent->value)->avg('points') ?? 5.00;

                    SubjectExamSummary::create([
                        'examination_id' => $examinationId,
                        'class_level_id' => $classLevelId,
                        'subject_id' => $examSub->subject_id,
                        'school_id' => null,
                        'registered_candidates' => $distReg,
                        'sat_candidates' => $distSat,
                        'total_score' => $distTotalScore,
                        'average_score' => $distAvg,
                        'gpa' => $distGpa,
                        'grade_a_count' => $subjectMarks->where('grade', 'A')->count(),
                        'grade_b_count' => $subjectMarks->where('grade', 'B')->count(),
                        'grade_c_count' => $subjectMarks->where('grade', 'C')->count(),
                        'grade_d_count' => $subjectMarks->where('grade', 'D')->count(),
                        'grade_f_count' => $subjectMarks->where('grade', 'F')->count(),
                    ]);
                }
            }
        });
    }
}
