<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Identity\Models\User;
use App\Domains\Reporting\Repositories\ReportingRepositoryInterface;

class ExecutiveReportingService
{
    public function __construct(
        private ReportingRepositoryInterface $reports,
    ) {}

    public function menu(User $user): array
    {
        return $this->reports->getMenu($user);
    }

    public function overview(User $user, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getOverview($user, $examId, $classLevelId);
    }

    public function national(User $user, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getNational($user, $examId, $classLevelId);
    }

    public function nationalDetails(User $user, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getNationalDetails($user, $examId, $classLevelId);
    }

    public function regions(User $user, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getRegions($user, $examId, $classLevelId);
    }

    public function region(User $user, string $regionId, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getRegion($user, $regionId, $examId, $classLevelId);
    }

    public function districts(User $user, ?string $regionId = null, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getDistricts($user, $regionId, $examId, $classLevelId);
    }

    public function district(User $user, string $districtId, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getDistrict($user, $districtId, $examId, $classLevelId);
    }

    public function schools(User $user, ?string $districtId = null, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getSchools($user, $districtId, $examId, $classLevelId);
    }

    public function school(User $user, string $schoolId, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getSchool($user, $schoolId, $examId, $classLevelId);
    }

    public function schoolDetails(User $user, string $schoolId, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getSchool($user, $schoolId, $examId, $classLevelId);
    }

    public function students(User $user, ?string $schoolId = null, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getStudents($user, $schoolId, $examId, $classLevelId);
    }

    public function student(User $user, string $studentId, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getStudent($user, $studentId, $examId, $classLevelId);
    }

    public function insights(User $user, ?string $examId = null, ?string $classLevelId = null): array
    {
        return $this->reports->getInsights($user, $examId, $classLevelId);
    }
}
