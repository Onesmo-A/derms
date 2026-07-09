<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Results\Models\Mark;
use App\Domains\Results\Models\SchoolExamSummary;
use App\Domains\Results\Models\StudentExamSummary;
use App\Domains\Results\Models\SubjectExamSummary;
use App\Domains\School\Models\School;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ReportingDataService
{
    public function getMeritList(
        Examination $exam,
        string $classLevelId,
        ?string $schoolId = null,
        ?string $districtId = null,
        ?string $regionId = null
    ): Collection
    {
        return $this->meritListQuery($exam->id, $classLevelId, $schoolId, $districtId, $regionId)
            ->get();
    }

    public function getStudentSlip(string $examId, string $registrationId): array
    {
        $registration = ExaminationRegistration::with([
            'student.school.district.region',
            'classLevel',
            'examination',
        ])->where('examination_id', $examId)->findOrFail($registrationId);

        $marks = Mark::join('examination_subjects', 'marks.examination_subject_id', '=', 'examination_subjects.id')
            ->join('subjects', 'examination_subjects.subject_id', '=', 'subjects.id')
            ->where('marks.examination_registration_id', $registration->id)
            ->select(
                'marks.*',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
            )
            ->get();

        $summary = StudentExamSummary::where('examination_registration_id', $registration->id)->first();

        // Hierarchical candidate total counts
        $schoolId = $registration->student->school_id;
        $classLevelId = $registration->class_level_id;
        $districtId = $registration->student->school->district_id ?? null;
        $regionId = $registration->student->school->district->region_id ?? null;

        $schoolCandidatesCount = ExaminationRegistration::where('examination_id', $examId)
            ->where('class_level_id', $classLevelId)
            ->whereHas('student', function($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            })->count();

        $districtCandidatesCount = $districtId ? ExaminationRegistration::where('examination_id', $examId)
            ->where('class_level_id', $classLevelId)
            ->whereHas('student.school', function($q) use ($districtId) {
                $q->where('district_id', $districtId);
            })->count() : 0;

        $regionCandidatesCount = $regionId ? ExaminationRegistration::where('examination_id', $examId)
            ->where('class_level_id', $classLevelId)
            ->whereHas('student.school.district', function($q) use ($regionId) {
                $q->where('region_id', $regionId);
            })->count() : 0;

        $regionPosition = ($regionId && $summary) ? StudentExamSummary::join('examination_registrations', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
            ->join('students', 'examination_registrations.student_id', '=', 'students.id')
            ->join('schools', 'students.school_id', '=', 'schools.id')
            ->join('districts', 'schools.district_id', '=', 'districts.id')
            ->where('examination_registrations.examination_id', $examId)
            ->where('districts.region_id', $regionId)
            ->where('student_exam_summaries.gpa', '<', $summary->gpa)
            ->count() + 1 : 1;

        // Subject rankings
        $marksWithRanks = [];
        foreach ($marks as $mark) {
            $examSubId = $mark->examination_subject_id;

            // School Subject statistics
            $schoolRank = Mark::join('examination_registrations', 'marks.examination_registration_id', '=', 'examination_registrations.id')
                ->join('students', 'examination_registrations.student_id', '=', 'students.id')
                ->where('marks.examination_subject_id', $examSubId)
                ->where('students.school_id', $schoolId)
                ->where('marks.final_score', '>', $mark->final_score)
                ->count() + 1;

            $schoolSatCount = Mark::join('examination_registrations', 'marks.examination_registration_id', '=', 'examination_registrations.id')
                ->join('students', 'examination_registrations.student_id', '=', 'students.id')
                ->where('marks.examination_subject_id', $examSubId)
                ->where('students.school_id', $schoolId)
                ->count();

            // District Subject statistics
            $districtRank = $districtId ? Mark::join('examination_registrations', 'marks.examination_registration_id', '=', 'examination_registrations.id')
                ->join('students', 'examination_registrations.student_id', '=', 'students.id')
                ->join('schools', 'students.school_id', '=', 'schools.id')
                ->where('marks.examination_subject_id', $examSubId)
                ->where('schools.district_id', $districtId)
                ->where('marks.final_score', '>', $mark->final_score)
                ->count() + 1 : 1;

            $districtSatCount = $districtId ? Mark::join('examination_registrations', 'marks.examination_registration_id', '=', 'examination_registrations.id')
                ->join('students', 'examination_registrations.student_id', '=', 'students.id')
                ->join('schools', 'students.school_id', '=', 'schools.id')
                ->where('marks.examination_subject_id', $examSubId)
                ->where('schools.district_id', $districtId)
                ->count() : 0;

            // Region Subject statistics
            $regionRank = $regionId ? Mark::join('examination_registrations', 'marks.examination_registration_id', '=', 'examination_registrations.id')
                ->join('students', 'examination_registrations.student_id', '=', 'students.id')
                ->join('schools', 'students.school_id', '=', 'schools.id')
                ->join('districts', 'schools.district_id', '=', 'districts.id')
                ->where('marks.examination_subject_id', $examSubId)
                ->where('districts.region_id', $regionId)
                ->where('marks.final_score', '>', $mark->final_score)
                ->count() + 1 : 1;

            $regionSatCount = $regionId ? Mark::join('examination_registrations', 'marks.examination_registration_id', '=', 'examination_registrations.id')
                ->join('students', 'examination_registrations.student_id', '=', 'students.id')
                ->join('schools', 'students.school_id', '=', 'schools.id')
                ->join('districts', 'schools.district_id', '=', 'districts.id')
                ->where('marks.examination_subject_id', $examSubId)
                ->where('districts.region_id', $regionId)
                ->count() : 0;

            $marksWithRanks[] = array_merge($mark->toArray(), [
                'subject_name' => $mark->subject_name,
                'subject_code' => $mark->subject_code,
                'school_rank' => $schoolRank,
                'school_sat_count' => $schoolSatCount,
                'district_rank' => $districtRank,
                'district_sat_count' => $districtSatCount,
                'region_rank' => $regionRank,
                'region_sat_count' => $regionSatCount,
            ]);
        }

        return [
            'registration' => $registration,
            'marks' => $marksWithRanks,
            'summary' => $summary,
            'school_candidates_count' => $schoolCandidatesCount,
            'district_candidates_count' => $districtCandidatesCount,
            'region_candidates_count' => $regionCandidatesCount,
            'region_position' => $regionPosition,
            'candidate' => [
                'name' => $registration->student->first_name . ' ' . $registration->student->last_name,
                'exam_number' => $registration->exam_number,
                'registration_display' => $registration->student->registration_display ?? $registration->student->registration_number,
                'gender' => $registration->student->gender,
                'school' => $registration->student->school->name,
                'class_level' => $registration->classLevel->name,
                'region' => $registration->student->school->district->region->name ?? 'Dar es Salaam',
                'school_code' => $registration->student->school?->candidateRegistrationPrefix() ?? 'S0101',
            ],
        ];
    }

    public function getSchoolSummary(Examination $exam, string $schoolId, string $classLevelId): array
    {
        $school = School::with('district.region')->findOrFail($schoolId);
        $summary = SchoolExamSummary::where('examination_id', $exam->id)
            ->where('school_id', $schoolId)
            ->where('class_level_id', $classLevelId)
            ->firstOrFail();

        $schoolCandidatesCount = ExaminationRegistration::where('examination_id', $exam->id)
            ->where('class_level_id', $classLevelId)
            ->whereHas('student', function ($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            })
            ->count();

        $districtCandidatesCount = $school->district_id
            ? ExaminationRegistration::where('examination_id', $exam->id)
                ->where('class_level_id', $classLevelId)
                ->whereHas('student.school', function ($q) use ($school) {
                    $q->where('district_id', $school->district_id);
                })
                ->count()
            : 0;

        $regionCandidatesCount = $school->district?->region_id
            ? ExaminationRegistration::where('examination_id', $exam->id)
                ->where('class_level_id', $classLevelId)
                ->whereHas('student.school.district', function ($q) use ($school) {
                    $q->where('region_id', $school->district->region_id);
                })
                ->count()
            : 0;

        $regionSchoolIds = School::whereHas('district', function($q) use ($school) {
            $q->where('region_id', $school->district->region_id);
        })->pluck('id');

        $regionRank = SchoolExamSummary::where('examination_id', $exam->id)
            ->where('class_level_id', $classLevelId)
            ->whereIn('school_id', $regionSchoolIds)
            ->where('total_gpa', '<', $summary->total_gpa)
            ->count() + 1;

        $summary->school_position_region = $regionRank;

        $subjectPerformance = SubjectExamSummary::with('subject')
            ->where('examination_id', $exam->id)
            ->where('class_level_id', $classLevelId)
            ->where('school_id', $schoolId)
            ->get();

        // Candidates list with subject scores detail
        $candidates = ExaminationRegistration::with(['student'])
            ->where('examination_id', $exam->id)
            ->where('class_level_id', $classLevelId)
            ->whereHas('student', function($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            })->get();

        $candidatePerformance = [];
        foreach ($candidates as $cand) {
            $candSummary = StudentExamSummary::where('examination_registration_id', $cand->id)->first();
            if (!$candSummary) continue;

            $candMarks = Mark::join('examination_subjects', 'marks.examination_subject_id', '=', 'examination_subjects.id')
                ->join('subjects', 'examination_subjects.subject_id', '=', 'subjects.id')
                ->where('marks.examination_registration_id', $cand->id)
                ->select('marks.final_score', 'marks.grade', 'subjects.code as subject_code')
                ->get();

            $subjectMap = [];
            foreach ($candMarks as $cm) {
                $subjectMap[$cm->subject_code] = ($cm->final_score !== null) ? round($cm->final_score) : 'ABS';
            }

            $candidatePerformance[] = [
                'exam_number' => $cand->exam_number,
                'registration_display' => $cand->student->registration_display ?? $cand->student->registration_number,
                'student_name' => $cand->student->first_name . ' ' . $cand->student->last_name,
                'gender' => $cand->student->gender,
                'gpa' => $candSummary->gpa,
                'division' => $candSummary->division,
                'division_points' => $candSummary->division_points,
                'total_marks' => $candSummary->total_marks,
                'average_marks' => $candSummary->average_marks,
                'school_position' => $candSummary->school_position ?? 1,
                'school_position_total' => $schoolCandidatesCount,
                'district_position' => $candSummary->district_position ?? null,
                'district_position_total' => $districtCandidatesCount,
                'region_position' => $candSummary->region_position ?? null,
                'region_position_total' => $regionCandidatesCount,
                'subjects' => $subjectMap
            ];
        }

        // Sort by GPA / division points rank
        usort($candidatePerformance, function($a, $b) {
            if ($a['gpa'] != $b['gpa']) {
                return $a['gpa'] <=> $b['gpa'];
            }
            if ($a['division_points'] != $b['division_points']) {
                return $a['division_points'] <=> $b['division_points'];
            }
            return $b['average_marks'] <=> $a['average_marks'];
        });

        return [
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
            'summary' => $summary,
            'subjectPerformance' => $subjectPerformance,
            'candidatePerformance' => $candidatePerformance,
        ];
    }

    public function getDistrictSummary(Examination $exam, string $classLevelId): Collection
    {
        return SchoolExamSummary::with('school')
            ->where('examination_id', $exam->id)
            ->where('class_level_id', $classLevelId)
            ->orderBy('school_position_district', 'asc')
            ->get();
    }

    public function getMeritListQuery(
        string $examId,
        string $classLevelId,
        ?string $schoolId = null,
        ?string $districtId = null,
        ?string $regionId = null
    ): Builder
    {
        return $this->meritListQuery($examId, $classLevelId, $schoolId, $districtId, $regionId);
    }

    protected function meritListQuery(
        string $examId,
        string $classLevelId,
        ?string $schoolId = null,
        ?string $districtId = null,
        ?string $regionId = null
    ): Builder
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
                'examination_registrations.exam_number',
                'examination_registrations.status as registration_status',
                'schools.name as school_name'
            );

        if ($schoolId) {
            $query->where('students.school_id', $schoolId);
        } elseif ($districtId) {
            $query->where('schools.district_id', $districtId);
        } elseif ($regionId) {
            $query->join('districts', 'schools.district_id', '=', 'districts.id')
                ->where('districts.region_id', $regionId);
        }

        return $query->orderBy('gpa', 'asc')
            ->orderBy('division_points', 'asc')
            ->orderBy('average_marks', 'desc');
    }
}
