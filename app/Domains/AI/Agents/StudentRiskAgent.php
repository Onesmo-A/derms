<?php

namespace App\Domains\AI\Agents;

use App\Domains\Results\Models\StudentExamSummary;
use App\Domains\Results\Models\Mark;
use OpenAI\Laravel\Facades\OpenAI;

/**
 * Identifies students at risk of academic failure.
 * Detects failing patterns across subjects and flags students needing intervention.
 *
 * READ-ONLY — no data modifications.
 */
class StudentRiskAgent
{
    public function analyze(string $examId, string $classLevelId, ?string $schoolId = null): array
    {
        $data = $this->gatherData($examId, $classLevelId, $schoolId);

        if (! config('openai.api_key')) {
            return [
                'source'       => 'statistical',
                'at_risk'      => $data['at_risk_students'],
                'risk_summary' => $data['summary'],
            ];
        }

        $prompt = $this->buildPrompt($data);

        $response = OpenAI::chat()->create([
            'model'    => 'gpt-4o',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a student counseling analyst for Tanzanian secondary schools. Identify risk patterns and suggest interventions. Be specific and compassionate.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens'  => 1500,
            'temperature' => 0.3,
        ]);

        return [
            'source'       => 'ai',
            'at_risk'      => $data['at_risk_students'],
            'risk_summary' => $data['summary'],
            'insights'     => $response->choices[0]->message->content,
        ];
    }

    private function gatherData(string $examId, string $classLevelId, ?string $schoolId): array
    {
        $query = StudentExamSummary::join('examination_registrations', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
            ->join('students', 'examination_registrations.student_id', '=', 'students.id')
            ->join('schools', 'students.school_id', '=', 'schools.id')
            ->where('examination_registrations.examination_id', $examId)
            ->where('examination_registrations.class_level_id', $classLevelId)
            ->select(
                'student_exam_summaries.*',
                'students.first_name',
                'students.last_name',
                'students.gender',
                'students.id as student_id',
                'examination_registrations.exam_number',
                'schools.name as school_name'
            );

        if ($schoolId) {
            $query->where('students.school_id', $schoolId);
        }

        $allStudents = $query->get();

        // At-risk: Division 0, or Division IV with very high GPA
        $atRisk = $allStudents->filter(function ($s) {
            return $s->division === '0' || ($s->division === 'IV' && $s->gpa >= 4.0);
        })->map(function ($s) {
            // Count failed subjects for this student
            $failedSubjects = Mark::where('marks.examination_registration_id', $s->examination_registration_id)
                ->where(function ($q) {
                    $q->where('points', '>=', 5)->orWhere('is_absent', true);
                })
                ->count();

            return [
                'student_name'    => $s->first_name . ' ' . $s->last_name,
                'exam_number'     => $s->exam_number,
                'school'          => $s->school_name,
                'gender'          => $s->gender,
                'gpa'             => $s->gpa,
                'division'        => $s->division,
                'total_marks'     => $s->total_marks,
                'failed_subjects' => $failedSubjects,
                'risk_level'      => $s->division === '0' ? 'HIGH' : 'MEDIUM',
            ];
        })->sortByDesc('gpa')->values();

        return [
            'at_risk_students' => $atRisk,
            'summary' => [
                'total_students'   => $allStudents->count(),
                'at_risk_count'    => $atRisk->count(),
                'high_risk_count'  => $atRisk->where('risk_level', 'HIGH')->count(),
                'medium_risk_count' => $atRisk->where('risk_level', 'MEDIUM')->count(),
                'risk_percentage'  => $allStudents->count() > 0
                    ? round($atRisk->count() / $allStudents->count() * 100, 1)
                    : 0,
            ],
        ];
    }

    private function buildPrompt(array $data): string
    {
        $json = json_encode($data, JSON_PRETTY_PRINT);
        return <<<PROMPT
Analyze the following at-risk student data and provide:

1. **Risk Overview**: Summary of the risk landscape
2. **Common Patterns**: What patterns do at-risk students share?
3. **Gender Analysis**: Any gender-based trends in risk?
4. **School-Level Issues**: Are certain schools producing more at-risk students?
5. **Intervention Recommendations**: Specific, actionable steps to help these students

Data:
{$json}
PROMPT;
    }
}
