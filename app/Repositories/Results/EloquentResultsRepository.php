<?php

namespace App\Repositories\Results;

use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Results\Models\Mark;
use App\Domains\Results\Models\StudentExamSummary;
use Illuminate\Support\Collection;

class EloquentResultsRepository implements ResultsRepositoryInterface
{
    public function getCandidates(string $examinationId, string $classLevelId): Collection
    {
        return ExaminationRegistration::where('examination_id', $examinationId)
            ->where('class_level_id', $classLevelId)
            ->get();
    }

    public function getExamSubjects(string $examinationId, string $classLevelId): Collection
    {
        return ExaminationSubject::where('examination_id', $examinationId)
            ->where('class_level_id', $classLevelId)
            ->get();
    }

    public function getCandidateMarks(string $registrationId, Collection $examSubjectIds): Collection
    {
        return Mark::where('examination_registration_id', $registrationId)
            ->whereIn('examination_subject_id', $examSubjectIds)
            ->get();
    }

    public function getSummaryRows(string $examinationId, string $classLevelId): Collection
    {
        return StudentExamSummary::join('examination_registrations', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
            ->join('students', 'examination_registrations.student_id', '=', 'students.id')
            ->where('examination_registrations.examination_id', $examinationId)
            ->where('examination_registrations.class_level_id', $classLevelId)
            ->select('student_exam_summaries.*', 'students.school_id', 'students.gender', 'examination_registrations.status as reg_status')
            ->get();
    }

    public function getSubjectMarks(string $examSubjectId): Collection
    {
        return Mark::join('examination_registrations', 'marks.examination_registration_id', '=', 'examination_registrations.id')
            ->join('students', 'examination_registrations.student_id', '=', 'students.id')
            ->where('marks.examination_subject_id', $examSubjectId)
            ->select('marks.*', 'students.school_id', 'students.gender', 'examination_registrations.status as reg_status')
            ->get();
    }
}
