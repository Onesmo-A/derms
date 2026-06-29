<?php

namespace App\Domains\AI\Agents;

use App\Domains\Examination\Models\Examination;
use App\Domains\Results\Models\StudentExamSummary;
use App\Domains\Results\Models\SchoolExamSummary;
use App\Domains\Results\Models\SubjectExamSummary;
use OpenAI\Laravel\Facades\OpenAI;

/**
 * Analyzes trends across multiple examinations.
 * Identifies improvements or declines in GPA, pass rates, and subject-level performance over time.
 *
 * READ-ONLY — no data modifications.
 */
class TrendAnalysisAgent
{
    public function analyze(array $examIds, string $classLevelId, ?string $schoolId = null): array
    {
        $data = $this->gatherData($examIds, $classLevelId, $schoolId);

        if (! config('openai.api_key')) {
            return [
                'source'   => 'statistical',
                'analysis' => $data,
            ];
        }

        $prompt = $this->buildPrompt($data);

        $response = OpenAI::chat()->create([
            'model'    => 'gpt-4o',
            'messages' => [
                ['role' => 'system', 'content' => 'You are an educational systems analyst specializing in performance trends in secondary schools. Focus on multi-year/multi-exam trends, identifying growth trajectory, regressions, and recommending policy or systemic shifts.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens'  => 1500,
            'temperature' => 0.3,
        ]);

        return [
            'source'   => 'ai',
            'analysis' => $data,
            'insights' => $response->choices[0]->message->content,
        ];
    }

    private function gatherData(array $examIds, string $classLevelId, ?string $schoolId): array
    {
        $exams = Examination::with('academicYear')
            ->whereIn('id', $examIds)
            ->get()
            ->sortBy('start_date');

        $trends = [];

        foreach ($exams as $exam) {
            // General performance stats
            if ($schoolId) {
                $summary = SchoolExamSummary::where('examination_id', $exam->id)
                    ->where('school_id', $schoolId)
                    ->where('class_level_id', $classLevelId)
                    ->first();

                $totalStudents = $summary->sat_candidates ?? 0;
                $passRate = $summary->pass_rate ?? 0;
                $avgGpa = $summary->total_gpa ?? 0;
                $divisions = [
                    'I'   => $summary->division_i_count ?? 0,
                    'II'  => $summary->division_ii_count ?? 0,
                    'III' => $summary->division_iii_count ?? 0,
                    'IV'  => $summary->division_iv_count ?? 0,
                    '0'   => $summary->division_zero_count ?? 0,
                ];
            } else {
                // District level aggregation from StudentExamSummary
                $studentsQuery = StudentExamSummary::join('examination_registrations', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
                    ->join('students', 'examination_registrations.student_id', '=', 'students.id')
                    ->where('examination_registrations.examination_id', $exam->id)
                    ->where('examination_registrations.class_level_id', $classLevelId);

                $summaries = $studentsQuery->get();
                $totalStudents = $summaries->count();
                $passRate = $totalStudents > 0
                    ? round($summaries->whereIn('division', ['I', 'II', 'III', 'IV'])->count() / $totalStudents * 100, 2)
                    : 0;
                $avgGpa = $totalStudents > 0 ? round($summaries->avg('gpa'), 4) : 0;
                $divisionsRaw = $summaries->groupBy('division')->map->count();
                $divisions = [
                    'I'   => $divisionsRaw->get('I', 0),
                    'II'  => $divisionsRaw->get('II', 0),
                    'III' => $divisionsRaw->get('III', 0),
                    'IV'  => $divisionsRaw->get('IV', 0),
                    '0'   => $divisionsRaw->get('0', 0),
                ];
            }

            // Subject performance for this exam
            $subjectQuery = SubjectExamSummary::with('subject')
                ->where('examination_id', $exam->id)
                ->where('class_level_id', $classLevelId);

            if ($schoolId) {
                $subjectQuery->where('school_id', $schoolId);
            } else {
                $subjectQuery->whereNull('school_id');
            }

            $subjects = $subjectQuery->get()->map(fn ($sp) => [
                'subject_name' => $sp->subject->name ?? 'N/A',
                'avg_score'    => round($sp->average_score, 2),
                'gpa'          => round($sp->gpa, 2),
            ])->values()->toArray();

            $trends[] = [
                'exam_id'        => $exam->id,
                'exam_name'      => $exam->name,
                'academic_year'  => $exam->academicYear->name ?? 'N/A',
                'start_date'     => $exam->start_date->format('Y-m-d'),
                'total_students' => $totalStudents,
                'pass_rate'      => $passRate,
                'average_gpa'    => $avgGpa,
                'divisions'      => $divisions,
                'subjects'       => $subjects,
            ];
        }

        return [
            'scope'  => $schoolId ? 'school' : 'district',
            'trends' => $trends,
        ];
    }

    private function buildPrompt(array $data): string
    {
        $json = json_encode($data, JSON_PRETTY_PRINT);
        return <<<PROMPT
Analyze the following multi-examination academic trends and provide:

1. **Overall Performance Trajectory**: Are the results generally improving, declining, or stagnating over time?
2. **Subject Trajectories**: Which subjects show positive growth trends? Which subjects show consistent decline or volatility?
3. **Division Shifts**: Analyze the shifting proportions of Divisions (e.g., from Division 0 to Division IV/III or from lower divisions to Division I/II).
4. **Key Driver Analysis**: What might be driving these trends (based on subject-specific or student-count variations)?
5. **Systemic Policy Recommendations**: Actionable long-term recommendations for school/district policy to sustain improvement.

Data:
{$json}
PROMPT;
    }
}
