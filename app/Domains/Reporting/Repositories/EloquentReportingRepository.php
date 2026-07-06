<?php

namespace App\Domains\Reporting\Repositories;

use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\ExaminationType;
use App\Domains\Identity\Models\User;
use App\Domains\Results\Models\Mark;
use App\Domains\Results\Models\SchoolExamSummary;
use App\Domains\Results\Models\StudentExamSummary;
use App\Domains\Results\Models\SubjectExamSummary;
use App\Domains\School\Models\District;
use App\Domains\School\Models\Region;
use App\Domains\School\Models\School;
use App\Domains\Student\Models\Student;
use Illuminate\Support\Collection;

class EloquentReportingRepository implements ReportingRepositoryInterface
{
    public function getMenu(User $user): array
    {
        $role = $user->getRoleNames()->first() ?? 'Subject Teacher';

        $base = [
            ['label' => 'Dashboard', 'path' => '/reports', 'scope' => 'all'],
            ['label' => 'AI Insights', 'path' => '/reports/ai-insights', 'scope' => 'all'],
        ];

        $roleMenus = [
            'Super Administrator' => [
                ['label' => 'National', 'path' => '/reports/national', 'scope' => 'national'],
                ['label' => 'Regions', 'path' => '/reports/regions', 'scope' => 'regions'],
                ['label' => 'Districts', 'path' => '/reports/districts', 'scope' => 'districts'],
                ['label' => 'Schools', 'path' => '/reports/schools', 'scope' => 'schools'],
                ['label' => 'Students', 'path' => '/reports/students', 'scope' => 'students'],
            ],
            'Regional Education Officer (REO)' => [
                ['label' => 'Region', 'path' => '/reports/national', 'scope' => 'region'],
                ['label' => 'Regions', 'path' => '/reports/regions', 'scope' => 'regions'],
                ['label' => 'Districts', 'path' => '/reports/districts', 'scope' => 'districts'],
                ['label' => 'Schools', 'path' => '/reports/schools', 'scope' => 'schools'],
                ['label' => 'Students', 'path' => '/reports/students', 'scope' => 'students'],
            ],
            'District Education Officer (DEO)' => [
                ['label' => 'District', 'path' => '/reports/national', 'scope' => 'district'],
                ['label' => 'Districts', 'path' => '/reports/districts', 'scope' => 'districts'],
                ['label' => 'Schools', 'path' => '/reports/schools', 'scope' => 'schools'],
                ['label' => 'Students', 'path' => '/reports/students', 'scope' => 'students'],
            ],
            'District Academic Officer' => [
                ['label' => 'District', 'path' => '/reports/national', 'scope' => 'district'],
                ['label' => 'Districts', 'path' => '/reports/districts', 'scope' => 'districts'],
                ['label' => 'Schools', 'path' => '/reports/schools', 'scope' => 'schools'],
                ['label' => 'Students', 'path' => '/reports/students', 'scope' => 'students'],
            ],
            'Head of School' => [
                ['label' => 'School', 'path' => '/reports/national', 'scope' => 'school'],
                ['label' => 'Schools', 'path' => '/reports/schools', 'scope' => 'school'],
                ['label' => 'Students', 'path' => '/reports/students', 'scope' => 'students'],
            ],
            'Academic Master/Mistress' => [
                ['label' => 'School', 'path' => '/reports/national', 'scope' => 'school'],
                ['label' => 'Schools', 'path' => '/reports/schools', 'scope' => 'school'],
                ['label' => 'Students', 'path' => '/reports/students', 'scope' => 'students'],
            ],
            'Subject Teacher' => [
                ['label' => 'Subject Reports', 'path' => '/reports/students', 'scope' => 'student'],
                ['label' => 'Students', 'path' => '/reports/students', 'scope' => 'students'],
            ],
            'Student' => [
                ['label' => 'My Results', 'path' => '/reports/students', 'scope' => 'student'],
            ],
            'Parent' => [
                ['label' => 'Child Results', 'path' => '/reports/students', 'scope' => 'student'],
            ],
        ];

        return array_values(array_merge($base, $roleMenus[$role] ?? $roleMenus['Subject Teacher']));
    }

    public function resolveExam(?string $examId = null): Examination
    {
        if ($examId) {
            return Examination::with(['academicYear', 'examinationType'])->findOrFail($examId);
        }

        return Examination::with(['academicYear', 'examinationType'])
            ->orderByDesc('start_date')
            ->orderByDesc('created_at')
            ->firstOrFail();
    }

    public function getOverview(User $user, ?string $examId = null, ?string $classLevelId = null): array
    {
        $exam = $this->resolveExam($examId);
        $studentSummaries = $this->filterStudentSummaries($this->studentSummaries($exam), $classLevelId);

        return [
            'menu' => $this->getMenu($user),
            'exam' => $this->examMeta($exam),
            'kpis' => $this->getNationalKpis($user, $exam, $studentSummaries),
            'quick_links' => [
                ['label' => 'National', 'path' => '/reports/national'],
                ['label' => 'Regions', 'path' => '/reports/regions'],
                ['label' => 'Districts', 'path' => '/reports/districts'],
                ['label' => 'Schools', 'path' => '/reports/schools'],
                ['label' => 'Students', 'path' => '/reports/students'],
                ['label' => 'AI Insights', 'path' => '/reports/ai-insights'],
            ],
        ];
    }

    public function getNational(User $user, ?string $examId = null, ?string $classLevelId = null): array
    {
        $exam = $this->resolveExam($examId);
        $studentSummaries = $this->filterStudentSummaries($this->studentSummaries($exam), $classLevelId);
        $schoolSummaries = $this->schoolSummaries($exam);
        $regions = $this->regionRows($user, $studentSummaries, $exam);

        return [
            'exam' => $this->examMeta($exam),
            'kpis' => $this->getNationalKpis($user, $exam, $studentSummaries),
            'charts' => [
                'region_ranking' => $regions->take(10)->values(),
                'top_regions' => $regions->take(5)->values(),
                'lowest_regions' => $regions->sortBy('gpa')->take(5)->values(),
                'gpa_distribution' => $this->bucketDistribution($regions->pluck('gpa')->all(), 'gpa'),
                'pass_rate_comparison' => $regions->map(fn ($row) => [
                    'label' => $row['name'],
                    'value' => round($row['pass_rate'], 2),
                ])->values(),
                'gender_performance' => $this->genderPerformance($studentSummaries),
                'subject_performance' => $this->subjectPerformance($exam, null, null, null, $classLevelId),
                'historical_trends' => $this->historicalTrends(),
            ],
            'ranking' => $regions->values(),
            'school_mix' => [
                'government' => School::where('type', 'government')->count(),
                'private' => School::where('type', 'private')->count(),
            ],
            'summary' => $this->summaryStats($studentSummaries),
        ];
    }

    public function getNationalDetails(User $user, ?string $examId = null, ?string $classLevelId = null): array
    {
        $exam = $this->resolveExam($examId);
        $studentSummaries = $this->filterStudentSummaries($this->studentSummaries($exam), $classLevelId);
        $regions = $this->regionRows($user, $studentSummaries, $exam)->values();
        $subjectPerformance = collect($this->subjectPerformance($exam, null, null, null, $classLevelId))->sortByDesc('gpa')->values();

        $regionRankingRows = $regions->map(function (array $row, int $index) {
            return [
                'no' => $index + 1,
                'name' => $row['name'],
                'rank' => $index + 1,
                'districts' => $row['districts'],
                'schools' => $row['schools'],
                'government_schools' => $row['government_schools'],
                'private_schools' => $row['private_schools'],
                'candidates' => $row['candidates'],
                'average' => $row['average'],
                'gpa' => $row['gpa'],
                'pass_rate' => $row['pass_rate'],
                'performance' => $row['performance'],
            ];
        })->all();

        $divisionAnalysisRows = $regions->map(function (array $row, int $index) use ($studentSummaries) {
            $regionSummaries = $studentSummaries->where('region_id', $row['id']);
            $total = $regionSummaries->count();

            $male = $regionSummaries->where('gender', 'M');
            $female = $regionSummaries->where('gender', 'F');

            $divisionStats = fn (string $division) => [
                'male' => $male->where('division', $division)->count(),
                'female' => $female->where('division', $division)->count(),
                'total' => $regionSummaries->where('division', $division)->count(),
            ];

            $divisionI = $divisionStats('I');
            $divisionII = $divisionStats('II');
            $divisionIII = $divisionStats('III');
            $divisionIV = $divisionStats('IV');
            $division0 = $divisionStats('0');

            $iToIiiTotal = $divisionI['total'] + $divisionII['total'] + $divisionIII['total'];
            $iToIiiPercent = $total > 0 ? round(($iToIiiTotal / $total) * 100, 2) : 0.0;
            $kpiScore = round(($iToIiiPercent / 100) * 50, 2);

            return [
                'no' => $index + 1,
                'name' => $row['name'],
                'rank' => $index + 1,
                'candidates_male' => $male->count(),
                'candidates_female' => $female->count(),
                'candidates_total' => $total,
                'division_i_male' => $divisionI['male'],
                'division_i_female' => $divisionI['female'],
                'division_i_total' => $divisionI['total'],
                'division_ii_male' => $divisionII['male'],
                'division_ii_female' => $divisionII['female'],
                'division_ii_total' => $divisionII['total'],
                'division_iii_male' => $divisionIII['male'],
                'division_iii_female' => $divisionIII['female'],
                'division_iii_total' => $divisionIII['total'],
                'division_i_to_iii_total' => $iToIiiTotal,
                'kpi_i_to_iii_score' => $kpiScore,
                'kpi_gap' => round($kpiScore - 50, 2),
                'division_iv_male' => $divisionIV['male'],
                'division_iv_female' => $divisionIV['female'],
                'division_iv_total' => $divisionIV['total'],
                'division_iv_percent' => $total > 0 ? round(($divisionIV['total'] / $total) * 100, 2) : 0.0,
                'division_0_male' => $division0['male'],
                'division_0_female' => $division0['female'],
                'division_0_total' => $division0['total'],
                'division_0_percent' => $total > 0 ? round(($division0['total'] / $total) * 100, 2) : 0.0,
            ];
        })->all();

        $studentAnalysisRows = $this->nationalStudentAnalysisRows($studentSummaries);

        $subjectAnalysisRows = $subjectPerformance->map(function (array $row, int $index) {
            return [
                'no' => $index + 1,
                'subject_code' => $row['subject_code'] ?? $row['subject']['code'] ?? 'N/A',
                'subject_name' => $row['subject_name'] ?? $row['subject']['name'] ?? 'N/A',
                'average' => $row['average'],
                'grade' => $row['grade'] ?? 'N/A',
                'gpa' => $row['gpa'],
                'candidates' => $row['candidates'] ?? 0,
                'registered_candidates' => $row['registered_candidates'] ?? 0,
                'sat_candidates' => $row['sat_candidates'] ?? 0,
                'female_count' => $row['female_count'] ?? 0,
                'male_count' => $row['male_count'] ?? 0,
                'pass_rate' => $row['pass_rate'],
                'grade_a_count' => $row['grade_a_count'] ?? 0,
                'grade_b_count' => $row['grade_b_count'] ?? 0,
                'grade_c_count' => $row['grade_c_count'] ?? 0,
                'grade_d_count' => $row['grade_d_count'] ?? 0,
                'grade_f_count' => $row['grade_f_count'] ?? 0,
                'best_region_pass_rate' => $row['best_region_pass_rate'] ?? 0,
                'worst_region_pass_rate' => $row['worst_region_pass_rate'] ?? 0,
                'best_region_display' => $row['best_region_display'] ?? ($row['best_region'] ?? 'N/A'),
                'worst_region_display' => $row['worst_region_display'] ?? ($row['worst_region'] ?? 'N/A'),
            ];
        })->all();

        return [
            'exam' => $this->examMeta($exam),
            'title' => 'National Executive Report',
            'subtitle' => 'Detailed national performance tables across all regions, divisions, candidates and subjects.',
            'region_ranking' => $regionRankingRows,
            'division_analysis' => $divisionAnalysisRows,
            'student_analysis' => $studentAnalysisRows,
            'subject_analysis' => $subjectAnalysisRows,
            'historical_trends' => $this->historicalTrends(),
            'summary' => $this->summaryStats($studentSummaries),
        ];
    }

    public function getRegions(User $user, ?string $examId = null, ?string $classLevelId = null): array
    {
        $exam = $this->resolveExam($examId);
        $studentSummaries = $this->filterStudentSummaries($this->studentSummaries($exam), $classLevelId);
        $regions = $this->regionRows($user, $studentSummaries, $exam);

        return [
            'exam' => $this->examMeta($exam),
            'regions' => $regions->values(),
        ];
    }

    public function getRegion(User $user, string $regionId, ?string $examId = null, ?string $classLevelId = null): array
    {
        $exam = $this->resolveExam($examId);
        $region = Region::with(['districts.schools'])->findOrFail($regionId);
        $this->assertRegionAccess($user, $regionId);

        $studentSummaries = $this->filterStudentSummaries($this->studentSummaries($exam), $classLevelId)
            ->filter(fn ($row) => (string) $row['region_id'] === (string) $regionId)
            ->values();
        $districtRows = $this->districtRowsFromStudents($studentSummaries, $exam);

        return [
            'exam' => $this->examMeta($exam),
            'region' => [
                'id' => $region->id,
                'name' => $region->name,
                'code' => $region->code,
            ],
            'top_cards' => $this->regionTopCards($region, $studentSummaries),
            'performance_summary' => $this->regionPerformanceSummary($region, $studentSummaries),
            'districts' => $districtRows->values(),
            'best_districts' => $districtRows->take(10)->values(),
            'lowest_districts' => $districtRows->sortBy('gpa')->take(10)->values(),
            'school_statistics' => $this->regionSchoolStats($region),
            'candidate_statistics' => $this->candidateStats($studentSummaries),
            'gender_performance' => $this->genderPerformance($studentSummaries),
            'student_analysis' => $this->nationalStudentAnalysisRows($studentSummaries),
            'grade_distribution' => $this->gradeDistribution($studentSummaries),
            'division_distribution' => $this->divisionDistribution($studentSummaries),
            'subject_performance' => $this->subjectPerformance($exam, $regionId, null, null, $classLevelId),
            'examination_comparison' => $this->historicalTrends(),
        ];
    }

    public function getDistricts(User $user, ?string $regionId = null, ?string $examId = null, ?string $classLevelId = null): array
    {
        $exam = $this->resolveExam($examId);
        $studentSummaries = $this->filterStudentSummaries($this->studentSummaries($exam), $classLevelId);
        $districts = $this->districtRows($user, $studentSummaries, $exam, $regionId);

        return [
            'exam' => $this->examMeta($exam),
            'districts' => $districts->values(),
        ];
    }

    public function getDistrict(User $user, string $districtId, ?string $examId = null, ?string $classLevelId = null): array
    {
        $exam = $this->resolveExam($examId);
        $district = District::with(['region', 'schools'])->findOrFail($districtId);
        $this->assertDistrictAccess($user, $districtId);

        $studentSummaries = $this->filterStudentSummaries($this->studentSummaries($exam), $classLevelId)
            ->filter(fn ($row) => (string) $row['district_id'] === (string) $districtId)
            ->values();
        $schools = $this->schoolRowsFromStudents($studentSummaries, $exam);

        return [
            'exam' => $this->examMeta($exam),
            'district' => [
                'id' => $district->id,
                'name' => $district->name,
                'code' => $district->code,
                'region' => $district->region?->name,
            ],
            'top_cards' => $this->districtTopCards($district, $studentSummaries),
            'performance_summary' => $this->districtPerformanceSummary($district, $studentSummaries),
            'schools' => $schools->values(),
            'best_schools' => $schools->take(10)->values(),
            'lowest_schools' => $schools->sortBy('gpa')->take(10)->values(),
            'school_statistics' => $this->districtSchoolStats($district),
            'candidate_statistics' => $this->candidateStats($studentSummaries),
            'gender_performance' => $this->genderPerformance($studentSummaries),
            'grade_distribution' => $this->gradeDistribution($studentSummaries),
            'division_distribution' => $this->divisionDistribution($studentSummaries),
            'subject_performance' => $this->subjectPerformance($exam, null, $districtId, null, $classLevelId),
            'examination_comparison' => $this->historicalTrends(),
        ];
    }

    public function getSchools(User $user, ?string $districtId = null, ?string $examId = null, ?string $classLevelId = null): array
    {
        $exam = $this->resolveExam($examId);
        $studentSummaries = $this->filterStudentSummaries($this->studentSummaries($exam), $classLevelId);
        $schools = $this->schoolRows($user, $studentSummaries, $exam, $districtId);

        return [
            'exam' => $this->examMeta($exam),
            'schools' => $schools->values(),
        ];
    }

    public function getSchool(User $user, string $schoolId, ?string $examId = null, ?string $classLevelId = null): array
    {
        $exam = $this->resolveExam($examId);
        $school = School::with(['district.region'])->findOrFail($schoolId);
        $this->assertSchoolAccess($user, $schoolId);

        $studentSummaries = $this->filterStudentSummaries($this->studentSummaries($exam), $classLevelId)
            ->filter(fn ($row) => (string) $row['school_id'] === (string) $schoolId)
            ->values();
        $students = $this->studentRowsFromSummaries($studentSummaries);
        $subjectPerformance = $this->subjectPerformance($exam, null, null, $schoolId, $classLevelId);
        $examSubjectsQuery = $exam->examinationSubjects()->with('subject');
        if ($classLevelId) {
            $examSubjectsQuery->where('class_level_id', $classLevelId);
        }
        $examSubjects = $examSubjectsQuery
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'code' => $item->subject?->short_name ?? $item->subject?->code ?? 'N/A',
                'short_name' => $item->subject?->short_name ?? $item->subject?->code ?? 'N/A',
                'name' => $item->subject?->name ?? 'N/A',
                'label' => $item->subject?->short_name ?? $item->subject?->code ?? $item->subject?->name ?? 'N/A',
            ])
            ->values();

        $candidateMarks = Mark::join('examination_registrations', 'marks.examination_registration_id', '=', 'examination_registrations.id')
            ->join('students', 'examination_registrations.student_id', '=', 'students.id')
            ->join('examination_subjects', 'marks.examination_subject_id', '=', 'examination_subjects.id')
            ->join('subjects', 'examination_subjects.subject_id', '=', 'subjects.id')
            ->where('examination_registrations.examination_id', $exam->id)
            ->where('students.school_id', $schoolId)
            ->selectRaw('examination_registrations.id as registration_id, COALESCE(subjects.short_name, subjects.code) as subject_code, marks.final_score')
            ->get()
            ->groupBy('registration_id');

        $students = $students->map(function (array $student) use ($candidateMarks, $examSubjects) {
            $marks = $candidateMarks->get($student['registration_id'] ?? null, collect());
            $subjectScores = [];

            foreach ($examSubjects as $subject) {
                $score = $marks->firstWhere('subject_code', $subject['short_name'] ?? $subject['code']);
                $subjectScores[$subject['label']] = $score ? (is_null($score->final_score) ? 'ABS' : round((float) $score->final_score)) : 'ABS';
            }

            $student['subject_scores'] = $subjectScores;

            return $student;
        });

        return [
            'exam' => $this->examMeta($exam),
            'school' => [
                'id' => $school->id,
                'name' => $school->name,
                'registration_number' => $school->registration_number,
                'type' => $school->type,
                'student_count' => (int) ($school->student_count_cache ?? $school->students()->count()),
                'enrolment_category' => $school->enrolment_category ?? ((int) ($school->student_count_cache ?? $school->students()->count()) < 40 ? School::ENROLMENT_CATEGORY_BELOW_40 : School::ENROLMENT_CATEGORY_40_AND_ABOVE),
                'enrolment_category_label' => $school->enrolment_category_label,
                'district' => $school->district?->name,
                'region' => $school->district?->region?->name,
            ],
            'exam_subjects' => $examSubjects,
            'top_cards' => $this->schoolTopCards($school, $studentSummaries),
            'performance_summary' => $this->schoolPerformanceSummary($school, $studentSummaries),
            'students' => $students->values(),
            'subject_performance' => $subjectPerformance,
            'gender_performance' => $this->genderPerformance($studentSummaries),
            'grade_distribution' => $this->gradeDistribution($studentSummaries),
            'division_distribution' => $this->divisionDistribution($studentSummaries),
        ];
    }

    public function getStudents(User $user, ?string $schoolId = null, ?string $examId = null, ?string $classLevelId = null): array
    {
        $exam = $this->resolveExam($examId);
        $students = $this->studentRows($user, $exam, $schoolId, $classLevelId);

        return [
            'exam' => $this->examMeta($exam),
            'students' => $students->values(),
        ];
    }

    public function getStudent(User $user, string $studentId, ?string $examId = null, ?string $classLevelId = null): array
    {
        $exam = $this->resolveExam($examId);
        $student = Student::with(['school.district.region', 'classLevel'])->findOrFail($studentId);
        $this->assertStudentAccess($user, $studentId);

        $summary = StudentExamSummary::join('examination_registrations', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
            ->where('examination_registrations.examination_id', $exam->id)
            ->where('examination_registrations.student_id', $student->id)
            ->when($classLevelId, fn ($query) => $query->where('examination_registrations.class_level_id', $classLevelId))
            ->select('student_exam_summaries.*')
            ->first();

        return [
            'exam' => $this->examMeta($exam),
            'student' => [
                'id' => $student->id,
                'name' => trim($student->first_name . ' ' . $student->last_name),
                'gender' => $student->gender,
                'registration_number' => $student->registration_number,
                'registration_display' => $student->registration_display,
                'school' => $student->school?->name,
                'district' => $student->school?->district?->name,
                'region' => $student->school?->district?->region?->name,
                'class_level' => $student->classLevel?->name,
            ],
            'summary' => $summary ? [
                'total_marks' => (float) $summary->total_marks,
                'average_marks' => (float) $summary->average_marks,
                'gpa' => (float) $summary->gpa,
                'division' => $summary->division,
                'division_points' => $summary->division_points,
                'passed_subjects_count' => $summary->passed_subjects_count,
                'failed_subjects_count' => $summary->failed_subjects_count,
                'school_position' => $summary->school_position,
                'district_position' => $summary->district_position,
            ] : null,
        ];
    }

    public function getInsights(User $user, ?string $examId = null, ?string $classLevelId = null): array
    {
        $exam = $this->resolveExam($examId);
        $studentSummaries = $this->filterStudentSummaries($this->studentSummaries($exam), $classLevelId);
        $regions = $this->regionRows($user, $studentSummaries, $exam);
        $districts = $this->districtRows($user, $studentSummaries, $exam);
        $schools = $this->schoolRows($user, $studentSummaries, $exam);

        $weakRegions = $regions->sortBy('gpa')->take(3)->values();
        $strongRegions = $regions->sortByDesc('gpa')->take(3)->values();
        $weakDistricts = $districts->sortBy('gpa')->take(5)->values();
        $weakSchools = $schools->sortBy('gpa')->take(5)->values();

        return [
            'exam' => $this->examMeta($exam),
            'executive_summary' => [
                'title' => 'Executive Summary',
                'body' => sprintf(
                    '%s exam shows %d regions, %d districts and %d schools with %d candidates in scope.',
                    $exam->name,
                    Region::count(),
                    District::count(),
                    School::count(),
                    $studentSummaries->count()
                ),
            ],
            'strong_regions' => $strongRegions,
            'weak_regions' => $weakRegions,
            'weak_districts' => $weakDistricts,
            'weak_schools' => $weakSchools,
            'recommendations' => [
                'Prioritize moderation and follow-up in the lowest performing districts.',
                'Monitor schools with low pass rates and high division zero counts.',
                'Use subject-level performance to target revision and support.'
            ],
        ];
    }

    protected function examMeta(Examination $exam): array
    {
        return [
            'id' => $exam->id,
            'name' => $exam->name,
            'academic_year' => $exam->academicYear?->name,
            'type' => $exam->examinationType?->name,
            'start_date' => $exam->start_date?->toDateString(),
            'end_date' => $exam->end_date?->toDateString(),
            'status' => is_string($exam->status) ? $exam->status : $exam->status?->value,
        ];
    }

    protected function getNationalKpis(User $user, Examination $exam, ?Collection $studentSummaries = null): array
    {
        $studentSummaries ??= $this->studentSummaries($exam);

        return [
            ['label' => 'Total Regions', 'value' => Region::count()],
            ['label' => 'Total Districts', 'value' => District::count()],
            ['label' => 'Total Schools', 'value' => School::count()],
            ['label' => 'Government Schools', 'value' => School::where('type', 'government')->count()],
            ['label' => 'Private Schools', 'value' => School::where('type', 'private')->count()],
            ['label' => 'Total Candidates', 'value' => $studentSummaries->count()],
            ['label' => 'Overall GPA', 'value' => number_format((float) $studentSummaries->avg('gpa'), 2)],
            ['label' => 'Overall Average', 'value' => number_format((float) $studentSummaries->avg('average_marks'), 2)],
            ['label' => 'Overall Pass Rate', 'value' => number_format($this->passRate($studentSummaries), 2) . '%'],
            ['label' => 'Overall Fail Rate', 'value' => number_format(100 - $this->passRate($studentSummaries), 2) . '%'],
        ];
    }

    protected function studentSummaries(Examination $exam): Collection
    {
        return StudentExamSummary::join('examination_registrations', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
            ->join('students', 'examination_registrations.student_id', '=', 'students.id')
            ->join('class_levels', 'students.current_class_level_id', '=', 'class_levels.id')
            ->join('academic_years', 'students.academic_year_id', '=', 'academic_years.id')
            ->join('schools', 'students.school_id', '=', 'schools.id')
            ->join('districts', 'schools.district_id', '=', 'districts.id')
            ->join('regions', 'districts.region_id', '=', 'regions.id')
            ->where('examination_registrations.examination_id', $exam->id)
            ->select(
                'student_exam_summaries.*',
                'students.id as student_id',
                'students.first_name',
                'students.last_name',
                'students.gender',
                'students.registration_number as student_registration_number',
                'class_levels.name as class_level_name',
                'academic_years.name as academic_year_name',
                'examination_registrations.id as examination_registration_id',
                'examination_registrations.class_level_id',
                'schools.id as school_id',
                'schools.name as school_name',
                'schools.registration_number as school_registration_number',
                'schools.type as school_type',
                'districts.id as district_id',
                'districts.name as district_name',
                'regions.id as region_id',
                'regions.name as region_name'
            )
            ->orderBy('student_exam_summaries.gpa')
            ->get();
    }

    protected function schoolSummaries(Examination $exam): Collection
    {
        return SchoolExamSummary::with(['school.district.region'])
            ->where('examination_id', $exam->id)
            ->get();
    }

    protected function regionRows(User $user, Collection $studentSummaries, Examination $exam): Collection
    {
        $rows = Region::withCount(['districts', 'schools'])
            ->get()
            ->map(function (Region $region) use ($studentSummaries) {
                $rows = $studentSummaries->filter(fn ($row) => (string) $row['region_id'] === (string) $region->id);

                return [
                    'id' => $region->id,
                    'name' => $region->name,
                    'districts' => $region->districts_count ?? $region->districts()->count(),
                    'schools' => $region->schools_count ?? $region->schools()->count(),
                    'government_schools' => $region->schools()->where('type', 'government')->count(),
                    'private_schools' => $region->schools()->where('type', 'private')->count(),
                    'candidates' => $rows->count(),
                    'average' => round((float) $rows->avg('average_marks'), 2),
                    'gpa' => round((float) $rows->avg('gpa'), 2),
                    'pass_rate' => round($this->passRate($rows), 2),
                    'performance' => $this->performanceLabel((float) $rows->avg('gpa')),
                ];
            });

        return $this->applyRegionScopeToRows($rows, $user);
    }

    protected function districtRows(User $user, Collection $studentSummaries, Examination $exam, ?string $regionId = null): Collection
    {
        $query = District::with('region')->withCount('schools');
        if ($regionId) {
            $query->where('region_id', $regionId);
        }

        $rows = $query->get()->map(function (District $district) use ($studentSummaries) {
            $rows = $studentSummaries->filter(fn ($row) => (string) $row['district_id'] === (string) $district->id);

            return [
                'id' => $district->id,
                'name' => $district->name,
                'region_name' => $district->region?->name,
                'government_schools' => $district->schools()->where('type', 'government')->count(),
                'private_schools' => $district->schools()->where('type', 'private')->count(),
                'schools' => $district->schools_count ?? $district->schools()->count(),
                'candidates' => $rows->count(),
                'average' => round((float) $rows->avg('average_marks'), 2),
                'gpa' => round((float) $rows->avg('gpa'), 2),
                'pass_rate' => round($this->passRate($rows), 2),
                'performance' => $this->performanceLabel((float) $rows->avg('gpa')),
            ];
        });

        return $this->applyDistrictScopeToRows($rows, $user, $regionId);
    }

    protected function schoolRows(User $user, Collection $studentSummaries, Examination $exam, ?string $districtId = null): Collection
    {
        $query = School::with('district.region');
        if ($districtId) {
            $query->where('district_id', $districtId);
        }

        $rows = $query->get()->map(function (School $school) use ($studentSummaries) {
            $rows = $studentSummaries->filter(fn ($row) => (string) $row['school_id'] === (string) $school->id);
            $studentCount = (int) ($school->student_count_cache ?? $school->students()->count());

            return [
                'id' => $school->id,
                'name' => $school->name,
                'registration_number' => $school->registration_number,
                'type' => $school->type,
                'student_count' => $studentCount,
                'enrolment_category' => $school->enrolment_category ?? ($studentCount < 40 ? School::ENROLMENT_CATEGORY_BELOW_40 : School::ENROLMENT_CATEGORY_40_AND_ABOVE),
                'enrolment_category_label' => $school->enrolment_category_label,
                'district_name' => $school->district?->name,
                'region_name' => $school->district?->region?->name,
                'candidates' => $rows->count(),
                'average' => round((float) $rows->avg('average_marks'), 2),
                'gpa' => round((float) $rows->avg('gpa'), 2),
                'pass_rate' => round($this->passRate($rows), 2),
                'performance' => $this->performanceLabel((float) $rows->avg('gpa')),
            ];
        });

        return $this->applySchoolScopeToRows($rows, $user, $districtId);
    }

    protected function filterStudentSummaries(Collection $studentSummaries, ?string $classLevelId = null): Collection
    {
        if (!$classLevelId) {
            return $studentSummaries->values();
        }

        return $studentSummaries
            ->filter(fn ($row) => (string) ($row['class_level_id'] ?? '') === (string) $classLevelId)
            ->values();
    }

    protected function studentRows(User $user, Examination $exam, ?string $schoolId = null, ?string $classLevelId = null): Collection
    {
        $query = $this->filterStudentSummaries($this->studentSummaries($exam), $classLevelId);
        if ($schoolId) {
            $query = $query->where('school_id', $schoolId);
        }

        $rows = $query->map(function ($row) {
            return [
                'id' => $row['student_id'],
                'name' => trim($row['first_name'] . ' ' . $row['last_name']),
                'registration_number' => $row['student_registration_number'],
                'registration_display' => trim($row['student_registration_number'] . ' | ' . ($row['class_level_name'] ?? 'Unassigned class') . ' | ' . ($row['academic_year_name'] ?? 'Unassigned year')),
                'gender' => $row['gender'],
                'school_name' => $row['school_name'],
                'district_name' => $row['district_name'],
                'region_name' => $row['region_name'],
                'average' => round((float) $row['average_marks'], 2),
                'gpa' => round((float) $row['gpa'], 2),
                'division' => $row['division'],
                'division_points' => $row['division_points'],
                'status' => $row['status'] ?? null,
            ];
        });

        return $this->applyStudentScopeToRows($rows, $user, $schoolId);
    }

    protected function regionRowsFromStudents(Collection $studentSummaries, Examination $exam): Collection
    {
        return $this->regionRows(auth()->user(), $studentSummaries, $exam);
    }

    protected function districtRowsFromStudents(Collection $studentSummaries, Examination $exam): Collection
    {
        $districtIds = $studentSummaries->pluck('district_id')->unique()->values();
        $rows = District::with('region')->whereIn('id', $districtIds)->get()->map(function (District $district) use ($studentSummaries) {
            $rows = $studentSummaries->filter(fn ($row) => (string) $row['district_id'] === (string) $district->id);
            $schools = $district->schools;
            $male = $rows->where('gender', 'M');
            $female = $rows->where('gender', 'F');
            $divisionStats = fn (string $division) => [
                'male' => $male->where('division', $division)->count(),
                'female' => $female->where('division', $division)->count(),
                'total' => $rows->where('division', $division)->count(),
            ];
            $divisionI = $divisionStats('I');
            $divisionII = $divisionStats('II');
            $divisionIII = $divisionStats('III');
            $divisionIV = $divisionStats('IV');
            $division0 = $divisionStats('0');

            return [
                'id' => $district->id,
                'name' => $district->name,
                'region_name' => $district->region?->name,
                'schools' => $schools->count(),
                'government_schools' => $schools->where('type', 'government')->count(),
                'private_schools' => $schools->where('type', 'private')->count(),
                'candidates' => $rows->count(),
                'candidates_male' => $male->count(),
                'candidates_female' => $female->count(),
                'candidates_total' => $rows->count(),
                'division_i_male' => $divisionI['male'],
                'division_i_female' => $divisionI['female'],
                'division_i_total' => $divisionI['total'],
                'division_ii_male' => $divisionII['male'],
                'division_ii_female' => $divisionII['female'],
                'division_ii_total' => $divisionII['total'],
                'division_iii_male' => $divisionIII['male'],
                'division_iii_female' => $divisionIII['female'],
                'division_iii_total' => $divisionIII['total'],
                'division_iv_male' => $divisionIV['male'],
                'division_iv_female' => $divisionIV['female'],
                'division_iv_total' => $divisionIV['total'],
                'division_0_male' => $division0['male'],
                'division_0_female' => $division0['female'],
                'division_0_total' => $division0['total'],
                'average' => round((float) $rows->avg('average_marks'), 2),
                'gpa' => round((float) $rows->avg('gpa'), 2),
                'pass_rate' => round($this->passRate($rows), 2),
                'performance' => $this->performanceLabel((float) $rows->avg('gpa')),
            ];
        });

        return $rows->sortByDesc('gpa')->values();
    }

    protected function schoolRowsFromStudents(Collection $studentSummaries, Examination $exam): Collection
    {
        $schoolIds = $studentSummaries->pluck('school_id')->unique()->values();
        $rows = School::with('district.region')->whereIn('id', $schoolIds)->get()->map(function (School $school) use ($studentSummaries) {
            $rows = $studentSummaries->filter(fn ($row) => (string) $row['school_id'] === (string) $school->id);
            $studentCount = (int) ($school->student_count_cache ?? $school->students()->count());

            return [
                'id' => $school->id,
                'name' => $school->name,
                'registration_number' => $school->registration_number,
                'type' => $school->type,
                'student_count' => $studentCount,
                'enrolment_category' => $school->enrolment_category ?? ($studentCount < 40 ? School::ENROLMENT_CATEGORY_BELOW_40 : School::ENROLMENT_CATEGORY_40_AND_ABOVE),
                'enrolment_category_label' => $school->enrolment_category_label,
                'district_name' => $school->district?->name,
                'region_name' => $school->district?->region?->name,
                'candidates' => $rows->count(),
                'average' => round((float) $rows->avg('average_marks'), 2),
                'gpa' => round((float) $rows->avg('gpa'), 2),
                'pass_rate' => round($this->passRate($rows), 2),
                'performance' => $this->performanceLabel((float) $rows->avg('gpa')),
            ];
        });

        return $rows->sortByDesc('gpa')->values();
    }

    protected function studentRowsFromSummaries(Collection $studentSummaries): Collection
    {
        return $studentSummaries->map(function ($row) {
            $passedSubjects = (int) ($row['passed_subjects_count'] ?? 0);
            $failedSubjects = (int) ($row['failed_subjects_count'] ?? 0);

            return [
                'id' => $row['student_id'],
                'registration_id' => $row['examination_registration_id'] ?? null,
                'name' => trim($row['first_name'] . ' ' . $row['last_name']),
                'registration_number' => $row['student_registration_number'],
                'registration_display' => trim($row['student_registration_number'] . ' | ' . ($row['class_level_name'] ?? 'Unassigned class') . ' | ' . ($row['academic_year_name'] ?? 'Unassigned year')),
                'gender' => $row['gender'],
                'subjects_total' => $passedSubjects + $failedSubjects,
                'school_name' => $row['school_name'],
                'district_name' => $row['district_name'],
                'region_name' => $row['region_name'],
                'class_level_id' => $row['class_level_id'] ?? null,
                'average' => round((float) $row['average_marks'], 2),
                'gpa' => round((float) $row['gpa'], 2),
                'region_position' => $row['region_position'] ?? null,
                'district_position' => $row['district_position'] ?? null,
                'school_position' => $row['school_position'] ?? null,
                'division' => $row['division'],
                'division_points' => $row['division_points'],
            ];
        })->sortBy('gpa')->values();
    }

    protected function regionPerformanceSummary(Region $region, Collection $studentSummaries): array
    {
        return [
            'overall_region_performance' => round((float) $studentSummaries->avg('gpa'), 2),
            'overall_remarks' => $this->performanceLabel((float) $studentSummaries->avg('gpa')),
            'ai_executive_summary' => sprintf('%s has %d candidates with an average GPA of %s.', $region->name, $studentSummaries->count(), number_format((float) $studentSummaries->avg('gpa'), 2)),
        ];
    }

    protected function districtPerformanceSummary(District $district, Collection $studentSummaries): array
    {
        return [
            'overall_district_performance' => round((float) $studentSummaries->avg('gpa'), 2),
            'overall_remarks' => $this->performanceLabel((float) $studentSummaries->avg('gpa')),
            'ai_executive_summary' => sprintf('%s district has %d candidates and %s pass rate.', $district->name, $studentSummaries->count(), number_format($this->passRate($studentSummaries), 2) . '%'),
        ];
    }

    protected function schoolPerformanceSummary(School $school, Collection $studentSummaries): array
    {
        return [
            'overall_school_performance' => round((float) $studentSummaries->avg('gpa'), 2),
            'overall_remarks' => $this->performanceLabel((float) $studentSummaries->avg('gpa')),
            'ai_executive_summary' => sprintf('%s school has %d candidates with %s pass rate.', $school->name, $studentSummaries->count(), number_format($this->passRate($studentSummaries), 2) . '%'),
        ];
    }

    protected function regionTopCards(Region $region, Collection $studentSummaries): array
    {
        return [
            ['label' => 'Region Name', 'value' => $region->name],
            ['label' => 'Region Rank', 'value' => $this->performanceLabel((float) $studentSummaries->avg('gpa'))],
            ['label' => 'Total Districts', 'value' => $region->districts()->count()],
            ['label' => 'Total Schools', 'value' => $region->schools()->count()],
            ['label' => 'Total Candidates', 'value' => $studentSummaries->count()],
            ['label' => 'Overall GPA', 'value' => number_format((float) $studentSummaries->avg('gpa'), 2)],
            ['label' => 'Overall Average', 'value' => number_format((float) $studentSummaries->avg('average_marks'), 2)],
            ['label' => 'Pass Rate', 'value' => number_format($this->passRate($studentSummaries), 2) . '%'],
        ];
    }

    protected function districtTopCards(District $district, Collection $studentSummaries): array
    {
        return [
            ['label' => 'District Name', 'value' => $district->name],
            ['label' => 'Region', 'value' => $district->region?->name ?? '—'],
            ['label' => 'Total Schools', 'value' => $district->schools()->count()],
            ['label' => 'Total Candidates', 'value' => $studentSummaries->count()],
            ['label' => 'Overall GPA', 'value' => number_format((float) $studentSummaries->avg('gpa'), 2)],
            ['label' => 'Overall Average', 'value' => number_format((float) $studentSummaries->avg('average_marks'), 2)],
            ['label' => 'Pass Rate', 'value' => number_format($this->passRate($studentSummaries), 2) . '%'],
        ];
    }

    protected function schoolTopCards(School $school, Collection $studentSummaries): array
    {
        $studentCount = (int) ($school->student_count_cache ?? $school->students()->count());
        $category = $school->enrolment_category ?? ($studentCount < 40 ? School::ENROLMENT_CATEGORY_BELOW_40 : School::ENROLMENT_CATEGORY_40_AND_ABOVE);

        return [
            ['label' => 'School Name', 'value' => $school->name],
            ['label' => 'District', 'value' => $school->district?->name ?? '—'],
            ['label' => 'Region', 'value' => $school->district?->region?->name ?? '—'],
            ['label' => 'Enrollment Band', 'value' => $category === School::ENROLMENT_CATEGORY_40_AND_ABOVE ? '40 and above' : 'Below 40'],
            ['label' => 'Student Count', 'value' => $studentCount],
            ['label' => 'Total Candidates', 'value' => $studentSummaries->count()],
            ['label' => 'Overall GPA', 'value' => number_format((float) $studentSummaries->avg('gpa'), 2)],
            ['label' => 'Overall Average', 'value' => number_format((float) $studentSummaries->avg('average_marks'), 2)],
            ['label' => 'Pass Rate', 'value' => number_format($this->passRate($studentSummaries), 2) . '%'],
        ];
    }

    protected function regionSchoolStats(Region $region): array
    {
        $schools = $region->schools;

        return [
            ['label' => 'Total Schools', 'value' => $schools->count()],
            ['label' => 'Government Schools', 'value' => $schools->where('type', 'government')->count()],
            ['label' => 'Private Schools', 'value' => $schools->where('type', 'private')->count()],
            ['label' => 'Active Schools', 'value' => $schools->count()],
            ['label' => 'Inactive Schools', 'value' => $schools->filter(fn ($school) => $school->deleted_at !== null)->count()],
        ];
    }

    protected function districtSchoolStats(District $district): array
    {
        $schools = $district->schools;

        return [
            ['label' => 'Total Schools', 'value' => $schools->count()],
            ['label' => 'Government Schools', 'value' => $schools->where('type', 'government')->count()],
            ['label' => 'Private Schools', 'value' => $schools->where('type', 'private')->count()],
            ['label' => 'Active Schools', 'value' => $schools->count()],
            ['label' => 'Inactive Schools', 'value' => $schools->filter(fn ($school) => $school->deleted_at !== null)->count()],
        ];
    }

    protected function candidateStats(Collection $studentSummaries): array
    {
        return [
            ['label' => 'Registered Candidates', 'value' => $studentSummaries->count()],
            ['label' => 'Present', 'value' => $studentSummaries->count()],
            ['label' => 'Absent', 'value' => 0],
            ['label' => 'Incomplete', 'value' => $studentSummaries->where('division', '0')->count()],
            ['label' => 'Results Published', 'value' => $studentSummaries->count()],
        ];
    }

    protected function gradeDistribution(Collection $studentSummaries): array
    {
        return [
            ['label' => 'Grade A', 'value' => $studentSummaries->where('division', 'I')->count()],
            ['label' => 'Grade B', 'value' => $studentSummaries->where('division', 'II')->count()],
            ['label' => 'Grade C', 'value' => $studentSummaries->where('division', 'III')->count()],
            ['label' => 'Grade D', 'value' => $studentSummaries->where('division', 'IV')->count()],
            ['label' => 'Grade E', 'value' => 0],
            ['label' => 'Grade F', 'value' => $studentSummaries->where('division', '0')->count()],
        ];
    }

    protected function divisionDistribution(Collection $studentSummaries): array
    {
        return [
            ['label' => 'Division I', 'value' => $studentSummaries->where('division', 'I')->count()],
            ['label' => 'Division II', 'value' => $studentSummaries->where('division', 'II')->count()],
            ['label' => 'Division III', 'value' => $studentSummaries->where('division', 'III')->count()],
            ['label' => 'Division IV', 'value' => $studentSummaries->where('division', 'IV')->count()],
            ['label' => 'Division 0', 'value' => $studentSummaries->where('division', '0')->count()],
        ];
    }

    protected function subjectPerformance(Examination $exam, ?string $regionId = null, ?string $districtId = null, ?string $schoolId = null, ?string $classLevelId = null): array
    {
        $query = SubjectExamSummary::with(['subject', 'school.district.region'])
            ->where('examination_id', $exam->id)
            ->whereNotNull('school_id');

        if ($classLevelId) {
            $query->where('class_level_id', $classLevelId);
        }

        if ($schoolId) {
            $query->where('school_id', $schoolId);
        } elseif ($districtId) {
            $schoolIds = School::where('district_id', $districtId)->pluck('id');
            $query->whereIn('school_id', $schoolIds);
        } elseif ($regionId) {
            $schoolIds = School::whereHas('district', fn ($q) => $q->where('region_id', $regionId))->pluck('id');
            $query->whereIn('school_id', $schoolIds);
        }

        $genderQuery = Mark::join('examination_subjects', 'marks.examination_subject_id', '=', 'examination_subjects.id')
            ->join('examination_registrations', 'marks.examination_registration_id', '=', 'examination_registrations.id')
            ->join('students', 'examination_registrations.student_id', '=', 'students.id')
            ->join('schools', 'students.school_id', '=', 'schools.id')
            ->where('examination_subjects.examination_id', $exam->id)
            ->whereNotNull('examination_registrations.student_id');

        if ($classLevelId) {
            $genderQuery->where('examination_registrations.class_level_id', $classLevelId);
        }

        if ($schoolId) {
            $genderQuery->where('students.school_id', $schoolId);
        } elseif ($districtId) {
            $genderQuery->where('schools.district_id', $districtId);
        } elseif ($regionId) {
            $genderQuery->join('districts', 'schools.district_id', '=', 'districts.id')
                ->where('districts.region_id', $regionId);
        }

        $genderCounts = $genderQuery
            ->selectRaw('examination_subjects.subject_id, students.gender, COUNT(*) as total')
            ->groupBy('examination_subjects.subject_id', 'students.gender')
            ->get()
            ->groupBy('subject_id')
            ->map(function (Collection $rows) {
                return [
                    'M' => (int) ($rows->firstWhere('gender', 'M')->total ?? 0),
                    'F' => (int) ($rows->firstWhere('gender', 'F')->total ?? 0),
                ];
            });

        $buildLocationStats = function (Collection $rows, callable $resolver): Collection {
            return $rows
                ->groupBy(function (SubjectExamSummary $row) use ($resolver) {
                    return $resolver($row)['key'];
                })
                ->map(function (Collection $group) use ($resolver) {
                    $first = $group->first();
                    $meta = $resolver($first);
                    $sat = (int) $group->sum('sat_candidates');
                    $passed = (int) (
                        $group->sum('grade_a_count')
                        + $group->sum('grade_b_count')
                        + $group->sum('grade_c_count')
                        + $group->sum('grade_d_count')
                    );
                    $passRate = $sat > 0 ? ($passed / $sat) * 100 : 0.0;

                    return [
                        'name' => $meta['name'] ?? 'N/A',
                        'pass_rate' => $passRate,
                        'average_score' => $sat > 0 ? ((float) $group->sum('total_score') / $sat) : 0.0,
                        'gpa' => $sat > 0
                            ? $group->sum(fn (SubjectExamSummary $row) => ((float) $row->gpa) * ((int) $row->sat_candidates)) / $sat
                            : 0.0,
                    ];
                })
                ->sortByDesc('pass_rate')
                ->values();
        };

        return $query->get()
            ->groupBy('subject_id')
            ->map(function (Collection $rows) use ($buildLocationStats, $genderCounts) {
                $first = $rows->first();
                $satCandidates = (int) $rows->sum('sat_candidates');
                $totalScore = (float) $rows->sum('total_score');
                $averageScore = $satCandidates > 0 ? ($totalScore / $satCandidates) : 0.0;
                $weightedGpa = $satCandidates > 0
                    ? $rows->sum(fn (SubjectExamSummary $row) => ((float) $row->gpa) * ((int) $row->sat_candidates)) / $satCandidates
                    : 0.0;
                $regionRows = $buildLocationStats($rows, function (SubjectExamSummary $row) {
                    return [
                        'key' => 'region:' . ($row->school?->district?->region?->id ?? 'unknown'),
                        'name' => $row->school?->district?->region?->name ?? 'N/A',
                    ];
                });
                $districtRows = $buildLocationStats($rows, function (SubjectExamSummary $row) {
                    return [
                        'key' => 'district:' . ($row->school?->district?->id ?? 'unknown'),
                        'name' => $row->school?->district?->name ?? 'N/A',
                    ];
                });
                $schoolRows = $buildLocationStats($rows, function (SubjectExamSummary $row) {
                    return [
                        'key' => 'school:' . ($row->school?->id ?? 'unknown'),
                        'name' => $row->school?->name ?? 'N/A',
                    ];
                });
                $bestRegion = $regionRows->first();
                $worstRegion = $regionRows->sortBy('pass_rate')->first();
                $bestDistrict = $districtRows->first();
                $worstDistrict = $districtRows->sortBy('pass_rate')->first();
                $bestSchool = $schoolRows->first();
                $worstSchool = $schoolRows->sortBy('pass_rate')->first();
                $subjectGenderCounts = $genderCounts->get($first?->subject_id, ['M' => 0, 'F' => 0]);

                return [
                    'subject' => [
                        'id' => $first?->subject?->id,
                        'name' => $first?->subject?->name,
                        'code' => $first?->subject?->short_name ?? $first?->subject?->code,
                        'short_name' => $first?->subject?->short_name ?? $first?->subject?->code,
                    ],
                    'subject_code' => $first?->subject?->short_name ?? $first?->subject?->code ?? 'N/A',
                    'subject_name' => $first?->subject?->name ?? 'N/A',
                    'average' => round($averageScore, 2),
                    'grade' => $this->subjectGradeLabel($averageScore),
                    'gpa' => round($weightedGpa, 2),
                    'candidates' => $satCandidates,
                    'registered_candidates' => (int) $rows->sum('registered_candidates'),
                    'sat_candidates' => $satCandidates,
                    'female_count' => (int) ($subjectGenderCounts['F'] ?? 0),
                    'male_count' => (int) ($subjectGenderCounts['M'] ?? 0),
                    'grade_a_count' => (int) $rows->sum('grade_a_count'),
                    'grade_b_count' => (int) $rows->sum('grade_b_count'),
                    'grade_c_count' => (int) $rows->sum('grade_c_count'),
                    'grade_d_count' => (int) $rows->sum('grade_d_count'),
                    'grade_f_count' => (int) $rows->sum('grade_f_count'),
                    'pass_rate' => $satCandidates > 0
                        ? round((
                            $rows->sum('grade_a_count')
                            + $rows->sum('grade_b_count')
                            + $rows->sum('grade_c_count')
                            + $rows->sum('grade_d_count')
                        ) / $satCandidates * 100, 2)
                        : 0.0,
                    'best_region' => $bestRegion['name'] ?? 'N/A',
                    'worst_region' => $worstRegion['name'] ?? 'N/A',
                    'best_region_pass_rate' => round($bestRegion['pass_rate'] ?? 0.0, 2),
                    'worst_region_pass_rate' => round($worstRegion['pass_rate'] ?? 0.0, 2),
                    'best_region_display' => isset($bestRegion['name'])
                        ? sprintf('%s (%.1f%%)', $bestRegion['name'], $bestRegion['pass_rate'])
                        : 'N/A',
                    'worst_region_display' => isset($worstRegion['name'])
                        ? sprintf('%s (%.1f%%)', $worstRegion['name'], $worstRegion['pass_rate'])
                        : 'N/A',
                    'best_district' => $bestDistrict['name'] ?? 'N/A',
                    'worst_district' => $worstDistrict['name'] ?? 'N/A',
                    'best_district_pass_rate' => round($bestDistrict['pass_rate'] ?? 0.0, 2),
                    'worst_district_pass_rate' => round($worstDistrict['pass_rate'] ?? 0.0, 2),
                    'best_district_display' => isset($bestDistrict['name'])
                        ? sprintf('%s (%.1f%%)', $bestDistrict['name'], $bestDistrict['pass_rate'])
                        : 'N/A',
                    'worst_district_display' => isset($worstDistrict['name'])
                        ? sprintf('%s (%.1f%%)', $worstDistrict['name'], $worstDistrict['pass_rate'])
                        : 'N/A',
                    'best_school' => $bestSchool['name'] ?? 'N/A',
                    'worst_school' => $worstSchool['name'] ?? 'N/A',
                    'best_school_display' => isset($bestSchool['name'])
                        ? sprintf('%s (%.1f%%)', $bestSchool['name'], $bestSchool['pass_rate'])
                        : 'N/A',
                    'worst_school_display' => isset($worstSchool['name'])
                        ? sprintf('%s (%.1f%%)', $worstSchool['name'], $worstSchool['pass_rate'])
                        : 'N/A',
                ];
            })
            ->sortByDesc('gpa')
            ->values()
            ->all();
    }

    protected function nationalStudentAnalysisRows(Collection $studentSummaries): array
    {
        $total = $studentSummaries->count();
        $groups = [
            'BOYS' => $studentSummaries->where('gender', 'M'),
            'GIRLS' => $studentSummaries->where('gender', 'F'),
            'TOTAL' => $studentSummaries,
        ];

        $rows = [];

        foreach ($groups as $label => $rowsSet) {
            $rows[] = $this->buildStudentAnalysisRow($label, $rowsSet, $total, false);
        }

        $rows[] = $this->buildStudentAnalysisRow('TOTAL %', $studentSummaries, $total, true);

        return $rows;
    }

    protected function buildStudentAnalysisRow(string $label, Collection $rows, int $grandTotal, bool $asPercentages): array
    {
        $count = $rows->count();
        $band = function (float $averageMarks, string $band): bool {
            return match ($band) {
                'A' => $averageMarks >= 75,
                'B' => $averageMarks >= 65 && $averageMarks < 75,
                'C' => $averageMarks >= 45 && $averageMarks < 65,
                'D' => $averageMarks >= 30 && $averageMarks < 45,
                default => $averageMarks < 30,
            };
        };

        $value = function (int $columnCount) use ($count, $grandTotal, $asPercentages) {
            if ($asPercentages) {
                return $grandTotal > 0 ? round(($columnCount / $grandTotal) * 100, 2) . '%' : '0.00%';
            }

            return $columnCount;
        };

        $gradeCount = function (string $grade) use ($rows, $band, $asPercentages, $grandTotal, $value) {
            $count = $rows->filter(function ($row) use ($band, $grade) {
                $average = (float) ($row['average_marks'] ?? 0);

                return $band($average, $grade);
            })->count();

            return $value($count);
        };

        $divisionCount = function (string $division) use ($rows, $asPercentages, $grandTotal, $value) {
            $count = $rows->where('division', $division)->count();

            return $value($count);
        };

        $incompleteCount = $rows->filter(fn ($row) => strtolower((string) ($row['status'] ?? '')) === 'incomplete')->count();
        $absentCount = $rows->filter(fn ($row) => strtolower((string) ($row['status'] ?? '')) === 'absent')->count();

        return [
            'label' => $label,
            'candidates' => $asPercentages ? ($grandTotal > 0 ? '100.00%' : '0.00%') : $count,
            'average' => $asPercentages ? '100.00%' : round((float) $rows->avg('average_marks'), 2),
            'grade_a' => $gradeCount('A'),
            'grade_b' => $gradeCount('B'),
            'grade_c' => $gradeCount('C'),
            'grade_d' => $gradeCount('D'),
            'grade_f' => $gradeCount('F'),
            'division_i' => $divisionCount('I'),
            'division_ii' => $divisionCount('II'),
            'division_iii' => $divisionCount('III'),
            'division_iv' => $divisionCount('IV'),
            'division_0' => $divisionCount('0'),
            'incomplete' => $asPercentages ? ($grandTotal > 0 ? round(($incompleteCount / $grandTotal) * 100, 2) . '%' : '0.00%') : $incompleteCount,
            'absent' => $asPercentages ? ($grandTotal > 0 ? round(($absentCount / $grandTotal) * 100, 2) . '%' : '0.00%') : $absentCount,
        ];
    }

    protected function historicalTrends(): array
    {
        return Examination::orderBy('start_date')
            ->limit(8)
            ->get()
            ->map(function (Examination $exam) {
                $summaries = StudentExamSummary::join('examination_registrations', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
                    ->where('examination_registrations.examination_id', $exam->id)
                    ->select('student_exam_summaries.gpa', 'student_exam_summaries.average_marks')
                    ->get();

                return [
                    'label' => $exam->name,
                    'average' => round((float) $summaries->avg('average_marks'), 2),
                    'gpa' => round((float) $summaries->avg('gpa'), 2),
                    'pass_rate' => round($this->passRate($summaries), 2),
                ];
            })->values()->all();
    }

    protected function genderPerformance(Collection $studentSummaries): array
    {
        return [
            [
                'label' => 'Male',
                'gpa' => round((float) $studentSummaries->where('gender', 'M')->avg('gpa'), 2),
                'average' => round((float) $studentSummaries->where('gender', 'M')->avg('average_marks'), 2),
                'pass_rate' => round($this->passRate($studentSummaries->where('gender', 'M')), 2),
            ],
            [
                'label' => 'Female',
                'gpa' => round((float) $studentSummaries->where('gender', 'F')->avg('gpa'), 2),
                'average' => round((float) $studentSummaries->where('gender', 'F')->avg('average_marks'), 2),
                'pass_rate' => round($this->passRate($studentSummaries->where('gender', 'F')), 2),
            ],
        ];
    }

    protected function summaryStats(Collection $studentSummaries): array
    {
        return [
            'candidates' => $studentSummaries->count(),
            'gpa' => round((float) $studentSummaries->avg('gpa'), 2),
            'average' => round((float) $studentSummaries->avg('average_marks'), 2),
            'pass_rate' => round($this->passRate($studentSummaries), 2),
            'fail_rate' => round(100 - $this->passRate($studentSummaries), 2),
        ];
    }

    protected function bucketDistribution(array $values, string $type): array
    {
        $values = array_filter($values, fn ($value) => $value !== null && $value !== '');
        $buckets = [
            '0-1.9' => 0,
            '2.0-2.9' => 0,
            '3.0-3.4' => 0,
            '3.5-4.0' => 0,
        ];

        foreach ($values as $value) {
            $value = (float) $value;
            if ($value < 2.0) {
                $buckets['0-1.9']++;
            } elseif ($value < 3.0) {
                $buckets['2.0-2.9']++;
            } elseif ($value < 3.5) {
                $buckets['3.0-3.4']++;
            } else {
                $buckets['3.5-4.0']++;
            }
        }

        return collect($buckets)->map(fn ($value, $label) => ['label' => $label, 'value' => $value])->values()->all();
    }

    protected function passRate(Collection $rows): float
    {
        $total = $rows->count();
        if ($total === 0) {
            return 0.0;
        }

        $passed = $rows->filter(fn ($row) => (string) ($row['division'] ?? '') !== '0')->count();

        return ($passed / $total) * 100;
    }

    protected function performanceLabel(?float $gpa): string
    {
        $gpa ??= 0.0;

        return match (true) {
            $gpa >= 3.5 => 'Excellent',
            $gpa >= 3.0 => 'Good',
            $gpa >= 2.5 => 'Average',
            $gpa >= 2.0 => 'Poor',
            default => 'Critical',
        };
    }

    protected function subjectGradeLabel(float $averageScore): string
    {
        return match (true) {
            $averageScore >= 75 => 'A',
            $averageScore >= 65 => 'B',
            $averageScore >= 45 => 'C',
            $averageScore >= 30 => 'D',
            default => 'F',
        };
    }

    protected function applyRegionScopeToRows(Collection $rows, User $user): Collection
    {
        if ($user->hasRole('Super Administrator') || ! $user->region_id) {
            return $rows->sortByDesc('gpa')->values();
        }

        if ($user->hasRole('Regional Education Officer (REO)')) {
            return $rows->where('id', $user->region_id)->values();
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer']) && $user->district_id) {
            return $rows->filter(fn ($row) => District::where('id', $user->district_id)->where('region_id', $row['id'])->exists())->values();
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher']) && $user->school_id) {
            $regionId = School::where('id', $user->school_id)->value('district_id');
            return $rows->filter(fn ($row) => District::where('id', $regionId)->where('region_id', $row['id'])->exists())->values();
        }

        return collect();
    }

    protected function applyDistrictScopeToRows(Collection $rows, User $user, ?string $regionId = null): Collection
    {
        if ($user->hasRole('Super Administrator')) {
            return $rows->sortByDesc('gpa')->values();
        }

        if ($user->hasRole('Regional Education Officer (REO)') && $user->region_id) {
            return $rows->where('region_name', Region::find($user->region_id)?->name)->values();
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer']) && $user->district_id) {
            return $rows->where('id', $user->district_id)->values();
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher']) && $user->district_id) {
            return $rows->where('id', $user->district_id)->values();
        }

        return $rows;
    }

    protected function applySchoolScopeToRows(Collection $rows, User $user, ?string $districtId = null): Collection
    {
        if ($user->hasRole('Super Administrator')) {
            return $rows->sortByDesc('gpa')->values();
        }

        if ($user->hasRole('Regional Education Officer (REO)') && $user->region_id) {
            return $rows->filter(fn ($row) => Region::where('name', $row['region_name'])->where('id', $user->region_id)->exists())->values();
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer']) && $user->district_id) {
            return $rows->where('district_name', District::find($user->district_id)?->name)->values();
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher']) && $user->school_id) {
            return $rows->where('id', $user->school_id)->values();
        }

        return $rows;
    }

    protected function applyStudentScopeToRows(Collection $rows, User $user, ?string $schoolId = null): Collection
    {
        if ($user->hasRole('Super Administrator')) {
            return $rows->values();
        }

        if ($user->hasRole('Regional Education Officer (REO)') && $user->region_id) {
            return $rows->filter(fn ($row) => $row['region_name'] === Region::find($user->region_id)?->name)->values();
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer']) && $user->district_id) {
            return $rows->filter(fn ($row) => $row['district_name'] === District::find($user->district_id)?->name)->values();
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher']) && $user->school_id) {
            return $rows->filter(fn ($row) => (string) $row['school_name'] === (string) School::find($user->school_id)?->name)->values();
        }

        return $rows;
    }

    protected function assertRegionAccess(User $user, string $regionId): void
    {
        if ($user->hasRole('Super Administrator')) {
            return;
        }

        if ($user->hasRole('Regional Education Officer (REO)')) {
            abort_unless((string) $user->region_id === (string) $regionId, 403);
            return;
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer'])) {
            abort_unless(District::where('id', $user->district_id)->where('region_id', $regionId)->exists(), 403);
            return;
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher'])) {
            abort_unless(School::where('id', $user->school_id)->whereHas('district', fn ($q) => $q->where('region_id', $regionId))->exists(), 403);
        }
    }

    protected function assertDistrictAccess(User $user, string $districtId): void
    {
        if ($user->hasRole('Super Administrator')) {
            return;
        }

        if ($user->hasRole('Regional Education Officer (REO)')) {
            abort_unless(District::where('id', $districtId)->where('region_id', $user->region_id)->exists(), 403);
            return;
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer'])) {
            abort_unless((string) $user->district_id === (string) $districtId, 403);
            return;
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher'])) {
            abort_unless(School::where('district_id', $districtId)->where('id', $user->school_id)->exists(), 403);
        }
    }

    protected function assertSchoolAccess(User $user, string $schoolId): void
    {
        if ($user->hasRole('Super Administrator')) {
            return;
        }

        if ($user->hasRole('Regional Education Officer (REO)')) {
            abort_unless(School::where('id', $schoolId)->whereHas('district', fn ($q) => $q->where('region_id', $user->region_id))->exists(), 403);
            return;
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer'])) {
            abort_unless(School::where('id', $schoolId)->where('district_id', $user->district_id)->exists(), 403);
            return;
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher'])) {
            abort_unless((string) $user->school_id === (string) $schoolId, 403);
        }
    }

    protected function assertStudentAccess(User $user, string $studentId): void
    {
        if ($user->hasRole('Super Administrator')) {
            return;
        }

        if ($user->hasRole('Regional Education Officer (REO)')) {
            abort_unless(Student::where('id', $studentId)->whereHas('school.district', fn ($q) => $q->where('region_id', $user->region_id))->exists(), 403);
            return;
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer'])) {
            abort_unless(Student::where('id', $studentId)->whereHas('school', fn ($q) => $q->where('district_id', $user->district_id))->exists(), 403);
            return;
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher', 'Student'])) {
            abort_unless(Student::where('id', $studentId)->where('school_id', $user->school_id)->exists(), 403);
        }
    }
}
