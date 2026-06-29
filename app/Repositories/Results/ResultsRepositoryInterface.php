<?php

namespace App\Repositories\Results;

use Illuminate\Support\Collection;

interface ResultsRepositoryInterface
{
    public function getCandidates(string $examinationId, string $classLevelId): Collection;

    public function getExamSubjects(string $examinationId, string $classLevelId): Collection;

    public function getCandidateMarks(string $registrationId, Collection $examSubjectIds): Collection;

    public function getSummaryRows(string $examinationId, string $classLevelId): Collection;

    public function getSubjectMarks(string $examSubjectId): Collection;
}
