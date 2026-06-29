<?php

namespace App\Domains\AI\Agents;

use App\Domains\Results\Models\StudentExamSummary;
use App\Domains\Results\Models\SchoolExamSummary;
use App\Domains\Results\Models\SubjectExamSummary;
use OpenAI\Laravel\Facades\OpenAI;

/**
 * Analyzes overall examination performance.
 * Identifies top performers, bottom performers, and key patterns.
 *
 * READ-ONLY — no data modifications.
 */
class PerformanceAnalysisAgent
{
    public function analyze(string $examId, string $classLevelId, ?string $schoolId = null): array
    {
        $data = $this->gatherData($examId, $classLevelId, $schoolId);

        // If OpenAI key not configured, return raw statistics only
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
                ['role' => 'system', 'content' => 'You are an educational data analyst specializing in Tanzanian secondary school examinations. Provide analysis in English. Be concise and actionable.'],
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

    private function gatherData(string $examId, string $classLevelId, ?string $schoolId): array
    {
        $summaryQuery = StudentExamSummary::join('examination_registrations', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
            ->join('students', 'examination_registrations.student_id', '=', 'students.id')
            ->where('examination_registrations.examination_id', $examId)
            ->where('examination_registrations.class_level_id', $classLevelId);

        if ($schoolId) {
            $summaryQuery->where('students.school_id', $schoolId);
        }

        $summaries = $summaryQuery->get();

        $totalStudents = $summaries->count();
        $divisions = $summaries->groupBy('division')->map->count();
        $passRate = $totalStudents > 0
            ? round($summaries->whereIn('division', ['I', 'II', 'III', 'IV'])->count() / $totalStudents * 100, 2)
            : 0;

        $top5 = $summaries->sortBy('gpa')->take(5)->map(fn ($s) => [
            'registration_id' => $s->examination_registration_id,
            'gpa'             => $s->gpa,
            'division'        => $s->division,
            'total_marks'     => $s->total_marks,
        ])->values();

        $bottom5 = $summaries->sortByDesc('gpa')->take(5)->map(fn ($s) => [
            'registration_id' => $s->examination_registration_id,
            'gpa'             => $s->gpa,
            'division'        => $s->division,
            'total_marks'     => $s->total_marks,
        ])->values();

        // Subject performance
        $subjectQuery = SubjectExamSummary::with('subject')
            ->where('examination_id', $examId)
            ->where('class_level_id', $classLevelId);
        if ($schoolId) {
            $subjectQuery->where('school_id', $schoolId);
        }
        $subjects = $subjectQuery->get()->map(fn ($sp) => [
            'subject'     => $sp->subject->name ?? 'N/A',
            'avg_marks'   => round($sp->average_marks, 2),
            'pass_rate'   => $sp->total_sat > 0 ? round($sp->total_passed / $sp->total_sat * 100, 1) : 0,
            'total_sat'   => $sp->total_sat,
        ]);

        return [
            'total_students'  => $totalStudents,
            'pass_rate'       => $passRate,
            'average_gpa'     => $totalStudents > 0 ? round($summaries->avg('gpa'), 4) : 0,
            'divisions'       => $divisions,
            'top_5_students'  => $top5,
            'bottom_5_students' => $bottom5,
            'subject_performance' => $subjects,
        ];
    }

    private function buildPrompt(array $data): string
    {
        $json = json_encode($data, JSON_PRETTY_PRINT);
        return <<<PROMPT
Analyze the following examination performance data and provide:

1. **Overall Assessment**: A brief summary of performance quality
2. **Strengths**: What went well
3. **Weaknesses**: Areas of concern
4. **Subject Analysis**: Which subjects performed best/worst and why
5. **Recommendations**: 3-5 actionable recommendations for improvement

Data:
{$json}
PROMPT;
    }
}
