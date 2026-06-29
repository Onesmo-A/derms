<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\Identity\Models\User;
use App\Domains\School\Models\School;
use App\Http\Requests\Api\School\DistrictIndexRequest;
use App\Http\Requests\Api\School\SchoolIndexRequest;
use App\Http\Requests\Api\School\SchoolStoreRequest;
use App\Http\Requests\Api\School\SchoolUpdateRequest;
use App\Services\AuditLogger;

class SchoolController extends Controller
{
    /**
     * Display a listing of the schools (paginated and filtered).
     */
    public function index(SchoolIndexRequest $request)
    {
        $this->authorize('viewAny', School::class);

        $user = $request->user();
        $query = School::with('district.region');

        $this->applyAccessScope($query, $user);

        if ($request->filled('district_id')) {
            $query->where('district_id', $request->validated('district_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->validated('type'));
        }

        if ($request->filled('level')) {
            $query->where('level', $request->validated('level'));
        }

        if ($request->filled('search')) {
            $search = $request->validated('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Store a newly created school in the database.
     */
    public function store(SchoolStoreRequest $request, AuditLogger $auditLogger)
    {
        $this->authorize('create', School::class);

        $school = School::create($request->validated());

        $auditLogger->log(
            action: 'school.created',
            description: 'School created.',
            user: $request->user(),
            newValues: $school->toArray(),
            request: $request
        );

        return response()->json([
            'school' => $school->load('district.region'),
            'message' => 'School registered successfully.'
        ], 201);
    }

    /**
     * Display the specified school.
     */
    public function show(string $id)
    {
        $school = School::with(['district.region', 'users'])->findOrFail($id);
        $this->authorize('view', $school);

        return response()->json($school);
    }

    /**
     * Update the specified school in the database.
     */
    public function update(SchoolUpdateRequest $request, string $id, AuditLogger $auditLogger)
    {
        $school = School::findOrFail($id);
        $this->authorize('update', $school);

        $oldValues = $school->toArray();
        $school->update($request->validated());

        $auditLogger->log(
            action: 'school.updated',
            description: 'School updated.',
            user: $request->user(),
            oldValues: $oldValues,
            newValues: $school->fresh()->toArray(),
            request: $request
        );

        return response()->json([
            'school' => $school->load('district.region'),
            'message' => 'School updated successfully.'
        ]);
    }

    /**
     * Remove the specified school (Soft Delete).
     */
    public function destroy(string $id, AuditLogger $auditLogger)
    {
        $school = School::findOrFail($id);
        $this->authorize('delete', $school);
        $oldValues = $school->toArray();
        $school->delete();

        $auditLogger->log(
            action: 'school.deleted',
            description: 'School deleted.',
            user: auth()->user(),
            oldValues: $oldValues
        );

        return response()->json([
            'message' => 'School deleted successfully.'
        ]);
    }

    /**
     * Display a listing of all regions.
     */
    public function regions()
    {
        return response()->json(\App\Domains\School\Models\Region::orderBy('name')->get());
    }

    /**
     * Display a listing of districts, optionally filtered by region.
     */
    public function districts(DistrictIndexRequest $request)
    {
        $query = \App\Domains\School\Models\District::query();

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->validated('region_id'));
        }

        return response()->json($query->orderBy('name')->get());
    }

    /**
     * Apply data access scope based on the authenticated user's role.
     */
    protected function applyAccessScope($query, User $user): void
    {
        if ($user->hasRole('District Officer') && $user->district_id) {
            $query->where('district_id', $user->district_id);
            return;
        }

        if ($user->hasAnyRole(['School Administrator', 'Teacher']) && $user->school_id) {
            $query->where('id', $user->school_id);
        }
    }
}
