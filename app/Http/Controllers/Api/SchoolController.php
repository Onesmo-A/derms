<?php

namespace App\Http\Controllers\Api;

use App\Domains\School\Models\School;
use App\Domains\School\Services\SchoolManagementService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\School\DistrictIndexRequest;
use App\Http\Requests\Api\School\SchoolIndexRequest;
use App\Http\Requests\Api\School\SchoolStoreRequest;
use App\Http\Requests\Api\School\SchoolUpdateRequest;
use App\Services\AuditLogger;

class SchoolController extends Controller
{
    public function __construct(
        private SchoolManagementService $schools,
    ) {}

    public function index(SchoolIndexRequest $request)
    {
        $this->authorize('viewAny', School::class);

        return response()->json(
            $this->schools->buildIndexQuery($request->validated(), $request->user())->get()
        );
    }

    public function store(SchoolStoreRequest $request, AuditLogger $auditLogger)
    {
        $this->authorize('create', School::class);

        $school = $this->schools->createSchool($request->validated());

        $auditLogger->log(
            action: 'school.created',
            description: 'School created.',
            user: $request->user(),
            newValues: $school->toArray(),
            request: $request
        );

        return response()->json([
            'school' => $school->load('district.region')->loadCount('students'),
            'message' => 'School registered successfully.',
        ], 201);
    }

    public function show(string $id)
    {
        $school = School::with([
            'district.region',
            'users',
            'students.classLevel',
            'students.class_level',
        ])->withCount('students')->findOrFail($id);
        $this->authorize('view', $school);

        return response()->json($school);
    }

    public function update(SchoolUpdateRequest $request, string $id, AuditLogger $auditLogger)
    {
        $school = School::findOrFail($id);
        $this->authorize('update', $school);

        $oldValues = $school->toArray();
        $school = $this->schools->updateSchool($school, $request->validated());

        $auditLogger->log(
            action: 'school.updated',
            description: 'School updated.',
            user: $request->user(),
            oldValues: $oldValues,
            newValues: $school->fresh()->toArray(),
            request: $request
        );

        return response()->json([
            'school' => $school->load('district.region')->loadCount('students'),
            'message' => 'School updated successfully.',
        ]);
    }

    public function destroy(string $id, AuditLogger $auditLogger)
    {
        $school = School::findOrFail($id);
        $this->authorize('delete', $school);

        $oldValues = $school->toArray();
        $this->schools->deleteSchool($school);

        $auditLogger->log(
            action: 'school.deleted',
            description: 'School deleted.',
            user: auth()->user(),
            oldValues: $oldValues
        );

        return response()->json(['message' => 'School deleted successfully.']);
    }

    public function regions()
    {
        $query = \App\Domains\School\Models\Region::query();
        app(\App\Services\AccessScopeService::class)->applyRegionScope($query, auth()->user());

        return response()->json($query->orderBy('name')->get(['id', 'name', 'code']));
    }

    public function districts(DistrictIndexRequest $request)
    {
        $query = \App\Domains\School\Models\District::with('region');
        app(\App\Services\AccessScopeService::class)->applyDistrictScope($query, auth()->user());

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->validated('region_id'));
        }

        return response()->json($query->orderBy('name')->get(['id', 'name', 'code', 'region_id']));
    }
}
