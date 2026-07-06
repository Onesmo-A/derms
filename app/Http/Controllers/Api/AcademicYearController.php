<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\AcademicYear;
use App\Domains\School\Services\AcademicCatalogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AcademicYearController extends Controller
{
    public function index(AcademicCatalogService $catalogService): JsonResponse
    {
        return response()->json($catalogService->listAcademicYears());
    }

    public function store(Request $request, AcademicCatalogService $catalogService): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:4',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after:start_date',
            'is_active'  => 'boolean',
        ]);

        $year = $catalogService->storeAcademicYear($data);
        return response()->json($year, 201);
    }

    public function show($id): JsonResponse
    {
        return response()->json(AcademicYear::findOrFail($id));
    }

    public function update(Request $request, $id, AcademicCatalogService $catalogService): JsonResponse
    {
        $year = AcademicYear::findOrFail($id);
        $data = $request->validate([
            'name'       => 'sometimes|string|max:100',
            'start_date' => 'sometimes|date',
            'end_date'   => 'sometimes|date',
            'is_active'  => 'boolean',
        ]);

        return response()->json($catalogService->updateAcademicYear($year, $data));
    }

    public function destroy($id): JsonResponse
    {
        AcademicYear::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
