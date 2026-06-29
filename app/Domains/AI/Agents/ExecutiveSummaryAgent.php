<?php

namespace App\Domains\AI\Agents;

use App\Domains\Examination\Models\Examination;
use App\Domains\Results\Models\StudentExamSummary;
use App\Domains\Results\Models\SchoolExamSummary;
use App\Domains\Results\Models\SubjectExamSummary;
use OpenAI\Laravel\Facades\OpenAI;

/**
 * Generates an executive briefing for district educational officers.
 * Highlights high-level district rankings, key issues, and strategic summaries.
 *
 * READ-ONLY — no data modifications.
 */
class ExecutiveSummaryAgent
{
    public function analyze(string $examId, string $classLevelId): array
    {
        $data = $this->gatherData($examId, $classLevelId);

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
                ['role' => 'system', 'content' => 'You are a Chief Education Officer advising Tanzanian district leadership. Generate high-level, strategic, and professional executive briefings. Focus on policy impact, capacity challenges, and district-wide resource allocation.'],
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

    private function gatherData(string $examId, string $classLevelId): array
    {
        $examination = Examination::with('academicYear')->find($examId);

        // Get district level stats from StudentExamSummary
        $studentsQuery = StudentExamSummary::join('examination_registrations', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
            ->join('students', 'examination_registrations.student_id', '=', 'students.id')
            ->where('examination_registrations.examination_id', $examId)
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

        // School Performance Rankings
        $schoolSummaries = SchoolExamSummary::with('school')
            ->where('examination_id', $examId)
            ->where('class_level_id', $classLevelId)
            ->orderBy('total_gpa', 'asc') // Lower GPA is better in O-level GPA system
            ->get();

        $topSchools = $schoolSummaries->take(3)->map(fn ($s) => [
            'name'       => $s->school->name ?? 'N/A',
            'gpa'        => round($s->total_gpa, 2),
            'pass_rate'  => round($s->pass_rate, 2),
            'registered' => $s->registered_candidates,
            'sat'        => $s->sat_candidates,
        ])->values()->toArray();

        $bottomSchools = $schoolSummaries->reverse()->take(3)->map(fn ($s) => [
            'name'       => $s->school->name ?? 'N/A',
            'gpa'        => round($s->total_gpa, 2),
            'pass_rate'  => round($s->pass_rate, 2),
            'registered' => $s->registered_candidates,
            'sat'        => $s->sat_candidates,
        ])->values()->toArray();

        // Subject performance
        $subjectSummaries = SubjectExamSummary::with('subject')
            ->where('examination_id', $examId)
            ->where('class_level_id', $classLevelId)
            ->whereNull('school_id')
            ->orderBy('average_score', 'desc')
            ->get();

        $bestSubjects = $subjectSummaries->take(3)->map(fn ($sp) => [
            'subject_name' => $sp->subject->name ?? 'N/A',
            'avg_score'    => round($sp->average_score, 2),
            'gpa'          => round($sp->gpa, 2),
        ])->values()->toArray();

        $worstSubjects = $subjectSummaries->reverse()->take(3)->map(fn ($sp) => [
            'subject_name' => $sp->subject->name ?? 'N/A',
            'avg_score'    => round($sp->average_score, 2),
            'gpa'          => round($sp->gpa, 2),
        ])->values()->toArray();

        return [
            'exam_name'      => $examination->name ?? 'N/A',
            'academic_year'  => $examination->academicYear->name ?? 'N/A',
            'total_schools'  => $schoolSummaries->count(),
            'total_students' => $totalStudents,
            'pass_rate'      => $passRate,
            'average_gpa'    => $avgGpa,
            'divisions'      => $divisions,
            'top_schools'    => $topSchools,
            'bottom_schools' => $bottomSchools,
            'best_subjects'  => $bestSubjects,
            'worst_subjects' => $worstSubjects,
        ];
    }

    private function buildPrompt(array $data): string
    {
        $json = json_encode($data, JSON_PRETTY_PRINT);
        return <<<PROMPT
Generate a high-level executive briefing for the Tanzanian District Education Officer (DEO) based on this district examination performance:

1. **Executive Briefing Summary**: A 1-paragraph summary of the district's overall standing.
2. **Key Strengths**: Highlight the top-performing schools and subjects, and what this implies about district resources.
3. **Critical Red Flags**: Highlight bottom-performing schools and critical subjects that need urgent intervention.
4. **Policy & Resource Recommendations**: 3-4 strategic policy steps for the district (e.g., teaching staff relocations, district-wide mock examinations, lab resource reallocation, teacher training focus).

Data:
{$json}
PROMPT;
    }
}
