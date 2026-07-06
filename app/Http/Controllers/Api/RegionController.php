<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\Region;
use App\Domains\School\Services\OrganizationCatalogService;
use Illuminate\Http\Request;
use App\Services\AccessScopeService;
use App\Services\AuditLogger;

class RegionController extends Controller
{
    /** List all regions (with district/school counts). */
    public function index(Request $request, OrganizationCatalogService $catalogService, AccessScopeService $scopeService)
    {
        $query = Region::withCount(['districts', 'schools']);
        $scopeService->applyRegionScope($query, $request->user());

        $regions = $query->orderBy('name')->get();

        if ($request->filled('search')) {
            $search = $request->search;
            $regions = $regions->filter(fn ($region) => str_contains(strtolower($region->name . ' ' . $region->code), strtolower($search)))->values();
        }

        return response()->json($regions);
    }

    /** Create a new region. */
    public function store(Request $request, AuditLogger $auditLogger, OrganizationCatalogService $catalogService)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:regions,name',
            'code' => 'required|string|max:10|unique:regions,code',
        ]);

        $region = $catalogService->storeRegion($validated);

        $auditLogger->log(
            action: 'region.created',
            description: 'Region created: ' . $region->name,
            user: $request->user(),
            newValues: $region->toArray(),
            request: $request
        );

        return response()->json(['region' => $region, 'message' => 'Region created successfully.'], 201);
    }

    /** Show a single region with its districts and school counts. */
    public function show(string $id)
    {
        $region = Region::with(['districts' => function ($q) {
            $q->withCount('schools')->orderBy('name');
        }])->withCount('districts')->findOrFail($id);

        return response()->json($region);
    }

    /** Update an existing region. */
    public function update(Request $request, string $id, AuditLogger $auditLogger, OrganizationCatalogService $catalogService)
    {
        $region = Region::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:regions,name,' . $id,
            'code' => 'required|string|max:10|unique:regions,code,' . $id,
        ]);

        $old = $region->toArray();
        $region = $catalogService->updateRegion($region, $validated);

        $auditLogger->log(
            action: 'region.updated',
            description: 'Region updated: ' . $region->name,
            user: $request->user(),
            oldValues: $old,
            newValues: $region->toArray(),
            request: $request
        );

        return response()->json(['region' => $region, 'message' => 'Region updated successfully.']);
    }

    /** Soft-delete a region. */
    public function destroy(string $id, AuditLogger $auditLogger, OrganizationCatalogService $catalogService)
    {
        $region = Region::withCount('districts')->findOrFail($id);

        $old = $region->toArray();
        try {
            $catalogService->deleteRegion($region);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $auditLogger->log(
            action: 'region.deleted',
            description: 'Region deleted: ' . $region->name,
            user: auth()->user(),
            oldValues: $old
        );

        return response()->json(['message' => 'Region deleted successfully.']);
    }
}
