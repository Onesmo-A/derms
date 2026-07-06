<?php

namespace App\Domains\School\Services;

use App\Domains\School\Models\District;
use App\Domains\School\Models\Region;
use App\Domains\School\Models\School;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class SchoolManagementService
{
    public function buildIndexQuery(array $filters, $user): Builder
    {
        $query = School::with('district.region')
            ->withCount('students')
            ->orderBy('name');
        app(\App\Services\AccessScopeService::class)->applySchoolScope($query, $user);

        if (!empty($filters['district_id'])) {
            $query->where('district_id', $filters['district_id']);
        }

        if (!empty($filters['region_id'])) {
            $regionId = $filters['region_id'];
            $query->whereHas('district', function (Builder $districtQuery) use ($regionId) {
                $districtQuery->where('region_id', $regionId);
            });
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['level'])) {
            $query->where('level', $filters['level']);
        }

        if (!empty($filters['enrolment_category'])) {
            $query->where('enrolment_category', $filters['enrolment_category']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        return $query;
    }

    public function createSchool(array $data): School
    {
        $school = School::create($data);
        $school->refreshEnrollmentSummary();

        return $school->fresh(['district.region'])->loadCount('students');
    }

    public function updateSchool(School $school, array $data): School
    {
        $school->update($data);

        return $school->fresh(['district.region'])->loadCount('students');
    }

    public function deleteSchool(School $school): void
    {
        $school->delete();
    }

    public function regions(): Collection
    {
        return Region::orderBy('name')->get();
    }

    public function districts(?string $regionId = null): Collection
    {
        $query = District::query();

        if ($regionId) {
            $query->where('region_id', $regionId);
        }

        return $query->orderBy('name')->get();
    }
}
