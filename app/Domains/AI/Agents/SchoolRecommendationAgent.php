<?php

namespace App\Domains\AI\Agents;

use App\Domains\Results\Models\SchoolExamSummary;
use App\Domains\Results\Models\SubjectExamSummary;
use OpenAI\Laravel\Facades\OpenAI;

/**
 * Generates school-specific improvement recommendations.
 * Compares school performance against district averages and suggests actionable steps.
 *
 * READ-ONLY — no data modifications.
 */
class SchoolRecommendationAgent
{
    public function analyze(string $examId, string $schoolId, string $classLevelId): array
    {
        $data = $this->gatherData($examId, $schoolId, $classLevelId);

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
                ['role' => 'system', 'content' => 'You are a school improvement consultant in Tanzania. Compare school performance against district benchmarks and offer clear, practical, and highly actionable pedagogical and administrative recommendations.'],
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

    private function gatherData(string $examId, string $schoolId, string $classLevelId): array
    {
        $schoolSummary = SchoolExamSummary::with('school')
            ->where('examination_id', $examId)
            ->where('school_id', $schoolId)
            ->where('class_level_id', $classLevelId)
            ->first();

        // Get school subject performance
        $schoolSubjects = SubjectExamSummary::with('subject')
            ->where('examination_id', $examId)
            ->where('school_id', $schoolId)
            ->where('class_level_id', $classLevelId)
            ->get();

        // Get district-wide subject performance for comparison
        $districtSubjects = SubjectExamSummary::where('examination_id', $examId)
            ->whereNull('school_id')
            ->where('class_level_id', $classLevelId)
            ->get()
            ->keyBy('subject_id');

        $comparativePerformance = $schoolSubjects->map(function ($ss) use ($districtSubjects) {
            $ds = $districtSubjects->get($ss->subject_id);
            $diffGpa = $ds ? ($ds->gpa - $ss->gpa) : 0; // In GPA, lower is better, so positive means school is better? Wait, standard GPA is usually 1-5 where A=1, B=2, C=3, D=4, F=5 in Tanzanian context. Let's make sure. Yes, in O-Level GPA: A=1, B=2, C=3, D=4, F=5, so lower GPA is better!
            // Let's compute average score difference instead to avoid confusion:
            $diffAvgScore = $ds ? ($ss->average_score - $ds->average_score) : 0;

            return [
                'subject_id'         => $ss->subject_id,
                'subject_name'       => $ss->subject->name ?? 'N/A',
                'school_gpa'         => round($ss->gpa, 2),
                'school_avg_score'   => round($ss->average_score, 2),
                'district_gpa'       => $ds ? round($ds->gpa, 2) : null,
                'district_avg_score' => $ds ? round($ds->average_score, 2) : null,
                'score_difference'   => round($diffAvgScore, 2),
                'grade_distribution' => [
                    'A' => $ss->grade_a_count,
                    'B' => $ss->grade_b_count,
                    'C' => $ss->grade_c_count,
                    'D' => $ss->grade_d_count,
                    'F' => $ss->grade_f_count,
                ],
            ];
        });

        return [
            'school_name' => $schoolSummary->school->name ?? 'N/A',
            'summary' => [
                'registered'       => $schoolSummary->registered_candidates ?? 0,
                'sat'              => $schoolSummary->sat_candidates ?? 0,
                'gpa'              => $schoolSummary->total_gpa ?? 0,
                'pass_rate'        => $schoolSummary->pass_rate ?? 0,
                'district_rank'    => $schoolSummary->school_position_district ?? null,
                'division_counts'  => [
                    'I'   => $schoolSummary->division_i_count ?? 0,
                    'II'  => $schoolSummary->division_ii_count ?? 0,
                    'III' => $schoolSummary->division_iii_count ?? 0,
                    'IV'  => $schoolSummary->division_iv_count ?? 0,
                    '0'   => $schoolSummary->division_zero_count ?? 0,
                ]
            ],
            'comparative_subjects' => $comparativePerformance->values()->toArray()
        ];
    }

    private function buildPrompt(array $data): string
    {
        $json = json_encode($data, JSON_PRETTY_PRINT);
        return <<<PROMPT
Analyze the following comparative school examination performance data against district benchmarks and provide:

1. **Strategic Assessment**: How is {$data['school_name']} performing compared to the district overall?
2. **Key Underperforming Subjects**: Which subjects lag behind the district average the most?
3. **Targeted Pedagogical Interventions**: Practical steps teachers can take in the classroom for the underperforming subjects.
4. **Administrative/Leadership Recommendations**: Administrative changes the headmaster/headmistress should make (e.g., resource reallocation, prep-time adjustments, teacher support).
5. **Timeline & Action Plan**: A short prioritized list of immediate, short-term, and medium-term steps.

Data:
{$json}
PROMPT;
    }
}
