<?php

namespace App\Domains\Reporting\Repositories;

use App\Domains\Examination\Models\Examination;
use App\Domains\Identity\Models\User;

interface ReportingRepositoryInterface
{
    public function getMenu(User $user): array;

    public function resolveExam(?string $examId = null): Examination;

    public function getOverview(User $user, ?string $examId = null, ?string $classLevelId = null): array;

    public function getNational(User $user, ?string $examId = null, ?string $classLevelId = null): array;

    public function getNationalDetails(User $user, ?string $examId = null, ?string $classLevelId = null): array;

    public function getRegions(User $user, ?string $examId = null, ?string $classLevelId = null): array;

    public function getRegion(User $user, string $regionId, ?string $examId = null, ?string $classLevelId = null): array;

    public function getDistricts(User $user, ?string $regionId = null, ?string $examId = null, ?string $classLevelId = null): array;

    public function getDistrict(User $user, string $districtId, ?string $examId = null, ?string $classLevelId = null): array;

    public function getSchools(User $user, ?string $districtId = null, ?string $examId = null, ?string $classLevelId = null): array;

    public function getSchool(User $user, string $schoolId, ?string $examId = null, ?string $classLevelId = null): array;

    public function getStudents(User $user, ?string $schoolId = null, ?string $examId = null, ?string $classLevelId = null): array;

    public function getStudent(User $user, string $studentId, ?string $examId = null, ?string $classLevelId = null): array;

    public function getInsights(User $user, ?string $examId = null, ?string $classLevelId = null): array;
}
