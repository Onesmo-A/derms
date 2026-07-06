<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\DivisionRule;
use App\Domains\School\Services\AcademicCatalogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DivisionRuleController extends Controller
{
    public function index(AcademicCatalogService $catalogService): JsonResponse
    {
        return response()->json($catalogService->listDivisionRules());
    }

    public function store(Request $request, AcademicCatalogService $catalogService): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:50',
            'min_points' => 'required|integer|min:0',
            'max_points' => 'required|integer|gte:min_points',
            'badge'      => 'nullable|string|max:100',
        ]);

        $rule = $catalogService->storeDivisionRule($data);
        return response()->json($rule, 201);
    }

    public function show($id): JsonResponse
    {
        return response()->json(DivisionRule::findOrFail($id));
    }

    public function update(Request $request, $id, AcademicCatalogService $catalogService): JsonResponse
    {
        $rule = DivisionRule::findOrFail($id);
        $data = $request->validate([
            'name'       => 'sometimes|string|max:50',
            'min_points' => 'sometimes|integer|min:0',
            'max_points' => 'sometimes|integer',
            'badge'      => 'nullable|string|max:100',
        ]);
        return response()->json($catalogService->updateDivisionRule($rule, $data));
    }

    public function destroy($id): JsonResponse
    {
        app(AcademicCatalogService::class)->deleteDivisionRule(DivisionRule::findOrFail($id));
        return response()->json(null, 204);
    }
}
