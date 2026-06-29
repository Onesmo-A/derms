<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\District;
use Illuminate\Http\Request;
use App\Services\AuditLogger;

class DistrictController extends Controller
{
    /** List all districts, optionally filtered by region. */
    public function index(Request $request)
    {
        $query = District::with('region')
            ->withCount('schools');

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->region_id);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        return response()->json($query->orderBy('name')->get());
    }

    /** Create a new district. */
    public function store(Request $request, AuditLogger $auditLogger)
    {
        $validated = $request->validate([
            'region_id' => 'required|uuid|exists:regions,id',
            'name'      => 'required|string|max:255',
            'code'      => 'required|string|max:10|unique:districts,code',
        ]);

        $district = District::create($validated);
        $district->load('region');

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
    public function update(Request $request, string $id, AuditLogger $auditLogger)
    {
        $district = District::findOrFail($id);

        $validated = $request->validate([
            'region_id' => 'required|uuid|exists:regions,id',
            'name'      => 'required|string|max:255',
            'code'      => 'required|string|max:10|unique:districts,code,' . $id,
        ]);

        $old = $district->toArray();
        $district->update($validated);
        $district->load('region');

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
    public function destroy(string $id, AuditLogger $auditLogger)
    {
        $district = District::withCount('schools')->findOrFail($id);

        if ($district->schools_count > 0) {
            return response()->json(['message' => 'Cannot delete district that has schools. Reassign schools first.'], 422);
        }

        $old = $district->toArray();
        $district->delete();

        $auditLogger->log(
            action: 'district.deleted',
            description: 'District deleted: ' . $district->name,
            user: auth()->user(),
            oldValues: $old
        );

        return response()->json(['message' => 'District deleted successfully.']);
    }
}
