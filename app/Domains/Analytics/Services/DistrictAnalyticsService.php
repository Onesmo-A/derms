<?php

namespace App\Domains\Analytics\Services;

use App\Domains\Results\Models\StudentExamSummary;
use App\Domains\Results\Models\SchoolExamSummary;
use App\Domains\Results\Models\SubjectExamSummary;
use App\Domains\School\Models\School;
use Illuminate\Support\Facades\DB;

class DistrictAnalyticsService
{
    /**
     * Get comprehensive district analytics for an examination and class level.
     */
    public function getDistrictOverview(string $examId, string $classLevelId): array
    {
        // 1. Overall stats
        $studentsQuery = StudentExamSummary::join('examination_registrations', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
            ->join('students', 'examination_registrations.student_id', '=', 'students.id')
            ->where('examination_registrations.examination_id', $examId)
            ->where('examination_registrations.class_level_id', $classLevelId)
            ->select('student_exam_summaries.*', 'students.gender');

        $totalRegistered = $studentsQuery->count();
        $totalAbsent = StudentExamSummary::join('examination_registrations', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
            ->where('examination_registrations.examination_id', $examId)
            ->where('examination_registrations.class_level_id', $classLevelId)
            ->where('examination_registrations.status', 'absent')
            ->count(); // basic count

        $summaries = $studentsQuery->get();
        $satStudents = $summaries->count();
        
        $passRate = $satStudents > 0
            ? round($summaries->whereIn('division', ['I', 'II', 'III', 'IV'])->count() / $satStudents * 100, 2)
            : 0;
        $avgGpa = $satStudents > 0 ? round($summaries->avg('gpa'), 4) : 0;

        $divisionsRaw = $summaries->groupBy('division')->map->count();
        $divisionDistribution = [
            'I'   => $divisionsRaw->get('I', 0),
            'II'  => $divisionsRaw->get('II', 0),
            'III' => $divisionsRaw->get('III', 0),
            'IV'  => $divisionsRaw->get('IV', 0),
            '0'   => $divisionsRaw->get('0', 0),
        ];

        // 2. Gender analysis
        $genderStats = $summaries->groupBy('gender')->map(function ($group) {
            $total = $group->count();
            $passed = $group->whereIn('division', ['I', 'II', 'III', 'IV'])->count();
            return [
                'sat'       => $total,
                'passed'    => $passed,
                'pass_rate' => $total > 0 ? round($passed / $total * 100, 2) : 0,
                'gpa'       => $total > 0 ? round($group->avg('gpa'), 4) : 0,
                'divisions' => [
                    'I'   => $group->where('division', 'I')->count(),
                    'II'  => $group->where('division', 'II')->count(),
                    'III' => $group->where('division', 'III')->count(),
                    'IV'  => $group->where('division', 'IV')->count(),
                    '0'   => $group->where('division', '0')->count(),
                ]
            ];
        });

        // 3. School type performance (Government vs Private)
        $schoolTypeStats = StudentExamSummary::join('examination_registrations', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
            ->join('students', 'examination_registrations.student_id', '=', 'students.id')
            ->join('schools', 'students.school_id', '=', 'schools.id')
            ->where('examination_registrations.examination_id', $examId)
            ->where('examination_registrations.class_level_id', $classLevelId)
            ->select('schools.type', 'student_exam_summaries.division', 'student_exam_summaries.gpa')
            ->get()
            ->groupBy('type')
            ->map(function ($group) {
                $total = $group->count();
                $passed = $group->whereIn('division', ['I', 'II', 'III', 'IV'])->count();
                return [
                    'sat'       => $total,
                    'passed'    => $passed,
                    'pass_rate' => $total > 0 ? round($passed / $total * 100, 2) : 0,
                    'gpa'       => $total > 0 ? round($group->avg('gpa'), 4) : 0,
                ];
            });

        // 4. School rankings
        $schoolRankings = SchoolExamSummary::with('school')
            ->where('examination_id', $examId)
            ->where('class_level_id', $classLevelId)
            ->orderBy('total_gpa', 'asc')
            ->get()
            ->map(fn ($s) => [
                'school_id'     => $s->school_id,
                'school_name'   => $s->school->name ?? 'N/A',
                'reg_number'    => $s->school->registration_number ?? 'N/A',
                'type'          => $s->school->type ?? 'N/A',
                'registered'    => $s->registered_candidates,
                'sat'           => $s->sat_candidates,
                'pass_rate'     => round($s->pass_rate, 2),
                'gpa'           => round($s->total_gpa, 2),
                'rank'          => $s->school_position_district,
                'divisions'     => [
                    'I'   => $s->division_i_count,
                    'II'  => $s->division_ii_count,
                    'III' => $s->division_iii_count,
                    'IV'  => $s->division_iv_count,
                    '0'   => $s->division_zero_count,
                ]
            ]);

        // 5. Subject performance
        $subjectPerformance = SubjectExamSummary::with('subject')
            ->where('examination_id', $examId)
            ->where('class_level_id', $classLevelId)
            ->whereNull('school_id')
            ->orderBy('average_score', 'desc')
            ->get()
            ->map(fn ($sp) => [
                'subject_id'   => $sp->subject_id,
                'subject_name' => $sp->subject->name ?? 'N/A',
                'sat'          => $sp->sat_candidates,
                'avg_score'    => round($sp->average_score, 2),
                'gpa'          => round($sp->gpa, 2),
                'rank'         => $sp->subject_position_district,
                'grades'       => [
                    'A' => $sp->grade_a_count,
                    'B' => $sp->grade_b_count,
                    'C' => $sp->grade_c_count,
                    'D' => $sp->grade_d_count,
                    'F' => $sp->grade_f_count,
                ]
            ]);

        return [
            'exam_id'               => $examId,
            'class_level_id'        => $classLevelId,
            'summary' => [
                'total_registered'  => $totalRegistered,
                'total_sat'         => $satStudents,
                'total_absent'      => $totalAbsent,
                'pass_rate'         => $passRate,
                'average_gpa'       => $avgGpa,
                'divisions'         => $divisionDistribution,
            ],
            'gender_analysis'       => $genderStats,
            'school_type_analysis'  => $schoolTypeStats,
            'school_rankings'       => $schoolRankings,
            'subject_performance'   => $subjectPerformance,
        ];
    }
}
