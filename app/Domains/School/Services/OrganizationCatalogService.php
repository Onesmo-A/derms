<?php

namespace App\Domains\School\Services;

use App\Domains\School\Models\District;
use App\Domains\School\Models\Region;
use Illuminate\Support\Facades\DB;

class OrganizationCatalogService
{
    public function listRegions()
    {
        return Region::withCount(['districts', 'schools'])->orderBy('name')->get();
    }

    public function storeRegion(array $data): Region
    {
        return Region::create($data);
    }

    public function updateRegion(Region $region, array $data): Region
    {
        $region->update($data);
        return $region->fresh();
    }

    public function deleteRegion(Region $region): void
    {
        if ($region->districts()->exists()) {
            throw new \RuntimeException('Cannot delete region that has districts. Remove districts first.');
        }

        $region->delete();
    }

    public function listDistricts(?string $regionId = null)
    {
        return District::with('region')
            ->withCount('schools')
            ->when($regionId, fn ($query) => $query->where('region_id', $regionId))
            ->orderBy('name')
            ->get();
    }

    public function storeDistrict(array $data): District
    {
        return DB::transaction(function () use ($data): District {
            $district = District::create($data);
            return $district->fresh(['region']);
        });
    }

    public function updateDistrict(District $district, array $data): District
    {
        $district->update($data);
        return $district->fresh(['region']);
    }

    public function deleteDistrict(District $district): void
    {
        if ($district->schools()->exists()) {
            throw new \RuntimeException('Cannot delete district that has schools. Reassign schools first.');
        }

        $district->delete();
    }
}
