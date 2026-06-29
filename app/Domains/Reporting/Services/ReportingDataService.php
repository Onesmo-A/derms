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
    public function getMeritList(Examination $exam, string $classLevelId, ?string $schoolId = null): Collection
    {
        return $this->meritListQuery($exam->id, $classLevelId, $schoolId)
            ->get();
    }

    public function getStudentSlip(string $examId, string $registrationId): array
    {
        $registration = ExaminationRegistration::with([
            'student.school.district',
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

        return [
            'registration' => $registration,
            'marks' => $marks,
            'summary' => $summary,
            'candidate' => [
                'name' => $registration->student->first_name . ' ' . $registration->student->last_name,
                'exam_number' => $registration->exam_number,
                'gender' => $registration->student->gender,
                'school' => $registration->student->school->name,
                'class_level' => $registration->classLevel->name,
            ],
        ];
    }

    public function getSchoolSummary(Examination $exam, string $schoolId, string $classLevelId): array
    {
        $school = School::with('district')->findOrFail($schoolId);
        $summary = SchoolExamSummary::where('examination_id', $exam->id)
            ->where('school_id', $schoolId)
            ->where('class_level_id', $classLevelId)
            ->firstOrFail();

        $subjectPerformance = SubjectExamSummary::with('subject')
            ->where('examination_id', $exam->id)
            ->where('class_level_id', $classLevelId)
            ->where('school_id', $schoolId)
            ->get();

        return compact('school', 'summary', 'subjectPerformance');
    }

    public function getDistrictSummary(Examination $exam, string $classLevelId): Collection
    {
        return SchoolExamSummary::with('school')
            ->where('examination_id', $exam->id)
            ->where('class_level_id', $classLevelId)
            ->orderBy('school_position_district', 'asc')
            ->get();
    }

    public function getMeritListQuery(string $examId, string $classLevelId, ?string $schoolId = null): Builder
    {
        return $this->meritListQuery($examId, $classLevelId, $schoolId);
    }

    protected function meritListQuery(string $examId, string $classLevelId, ?string $schoolId = null): Builder
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
        }

        return $query->orderBy('gpa', 'asc')
            ->orderBy('division_points', 'asc')
            ->orderBy('average_marks', 'desc');
    }
}
