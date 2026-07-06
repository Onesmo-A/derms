<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\District;
use App\Domains\School\Services\OrganizationCatalogService;
use Illuminate\Http\Request;
use App\Services\AccessScopeService;
use App\Services\AuditLogger;

class DistrictController extends Controller
{
    /** List all districts, optionally filtered by region. */
    public function index(Request $request, OrganizationCatalogService $catalogService, AccessScopeService $scopeService)
    {
        $query = District::with('region')->withCount('schools');
        $scopeService->applyDistrictScope($query, $request->user());

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->input('region_id'));
        }

        $districts = $query->orderBy('name')->get();

        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $districts = $districts->filter(fn ($district) => str_contains(strtolower($district->name . ' ' . $district->code), $search))->values();
        }

        return response()->json($districts);
    }

    /** Create a new district. */
    public function store(Request $request, AuditLogger $auditLogger, OrganizationCatalogService $catalogService)
    {
        $validated = $request->validate([
            'region_id' => 'required|uuid|exists:regions,id',
            'name'      => 'required|string|max:255',
            'code'      => 'required|string|max:10|unique:districts,code',
        ]);

        $district = $catalogService->storeDistrict($validated);

        $auditLogger->log(
            action: 'district.created',
            description: 'District created: ' . $district->name,
            user: $request->user(),
            newValues: $district->toArray(),
            request: $request
        );

        return response()->json(['district' => $district, 'message' => 'District created successfully.'], 201);
    }

    /** Show a single district with its schools. */
    public function show(string $id)
    {
        $district = District::with(['region', 'schools'])->withCount('schools')->findOrFail($id);
        return response()->json($district);
    }

    /** Update an existing district. */
    public function update(Request $request, string $id, AuditLogger $auditLogger, OrganizationCatalogService $catalogService)
    {
        $district = District::findOrFail($id);

        $validated = $request->validate([
            'region_id' => 'required|uuid|exists:regions,id',
            'name'      => 'required|string|max:255',
            'code'      => 'required|string|max:10|unique:districts,code,' . $id,
        ]);

        $old = $district->toArray();
        $district = $catalogService->updateDistrict($district, $validated);

        $auditLogger->log(
            action: 'district.updated',
            description: 'District updated: ' . $district->name,
            user: $request->user(),
            oldValues: $old,
            newValues: $district->fresh()->toArray(),
            request: $request
        );

        return response()->json(['district' => $district, 'message' => 'District updated successfully.']);
    }

    /** Soft-delete a district. */
    public function destroy(string $id, AuditLogger $auditLogger, OrganizationCatalogService $catalogService)
    {
        $district = District::withCount('schools')->findOrFail($id);

        $old = $district->toArray();
        try {
            $catalogService->deleteDistrict($district);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $auditLogger->log(
            action: 'district.deleted',
            description: 'District deleted: ' . $district->name,
            user: auth()->user(),
            oldValues: $old
        );

        return response()->json(['message' => 'District deleted successfully.']);
    }
}
