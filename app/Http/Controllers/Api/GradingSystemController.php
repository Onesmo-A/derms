<?php

namespace App\Http\Controllers\Api;

use App\Domains\School\Models\GradingSystemDetail;
use App\Domains\School\Services\AcademicCatalogService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GradingSystemController extends Controller
{
    public function index(AcademicCatalogService $catalogService): JsonResponse
    {
        return response()->json($catalogService->listGradingDetails());
    }

    public function store(Request $request, AcademicCatalogService $catalogService): JsonResponse
    {
        $data = $request->validate([
            'label' => 'required|string|max:5',
            'min_percent' => 'required|numeric|min:0|max:100',
            'max_percent' => 'required|numeric|gte:min_percent|max:100',
            'points' => 'required|integer|min:1',
            'description' => 'nullable|string',
        ]);

        return response()->json($catalogService->storeGradingDetail($data), 201);
    }

    public function destroy($id): JsonResponse
    {
        app(AcademicCatalogService::class)->deleteGradingDetail(GradingSystemDetail::findOrFail($id));

        return response()->json(null, 204);
    }
}
