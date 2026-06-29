<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;

use App\Domains\School\Models\AcademicYear;
use App\Http\Requests\Api\School\AcademicYearStoreRequest;
use App\Http\Requests\Api\School\AcademicYearUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AcademicYearController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', AcademicYear::class);
        $years = AcademicYear::all();
        return response()->json($years);
    }

    public function store(AcademicYearStoreRequest $request): JsonResponse
    {
        $this->authorize('create', AcademicYear::class);
        $year = AcademicYear::create($request->validated());
        return response()->json($year, 201);
    }

    public function show($id): JsonResponse
    {
        $year = AcademicYear::findOrFail($id);
        $this->authorize('view', $year);
        return response()->json($year);
    }

    public function update(AcademicYearUpdateRequest $request, $id): JsonResponse
    {
        $year = AcademicYear::findOrFail($id);
        $this->authorize('update', $year);
        $year->update($request->validated());
        return response()->json($year);
    }

    public function destroy($id): JsonResponse
    {
        $year = AcademicYear::findOrFail($id);
        $this->authorize('delete', $year);
        $year->delete();
        return response()->json(null, 204);
    }
}
?>
