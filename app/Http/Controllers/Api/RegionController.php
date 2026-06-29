<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\Region;
use Illuminate\Http\Request;
use App\Services\AuditLogger;

class RegionController extends Controller
{
    /** List all regions (with district/school counts). */
    public function index(Request $request)
    {
        $query = Region::withCount(['districts', 'schools']);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        return response()->json($query->orderBy('name')->get());
    }

    /** Create a new region. */
    public function store(Request $request, AuditLogger $auditLogger)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:regions,name',
            'code' => 'required|string|max:10|unique:regions,code',
        ]);

        $region = Region::create($validated);

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
    public function update(Request $request, string $id, AuditLogger $auditLogger)
    {
        $region = Region::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:regions,name,' . $id,
            'code' => 'required|string|max:10|unique:regions,code,' . $id,
        ]);

        $old = $region->toArray();
        $region->update($validated);

        $auditLogger->log(
            action: 'region.updated',
            description: 'Region updated: ' . $region->name,
            user: $request->user(),
            oldValues: $old,
            newValues: $region->fresh()->toArray(),
            request: $request
        );

        return response()->json(['region' => $region, 'message' => 'Region updated successfully.']);
    }

    /** Soft-delete a region. */
    public function destroy(string $id, AuditLogger $auditLogger)
    {
        $region = Region::withCount('districts')->findOrFail($id);

        if ($region->districts_count > 0) {
            return response()->json(['message' => 'Cannot delete region that has districts. Remove districts first.'], 422);
        }

        $old = $region->toArray();
        $region->delete();

        $auditLogger->log(
            action: 'region.deleted',
            description: 'Region deleted: ' . $region->name,
            user: auth()->user(),
            oldValues: $old
        );

        return response()->json(['message' => 'Region deleted successfully.']);
    }
}
