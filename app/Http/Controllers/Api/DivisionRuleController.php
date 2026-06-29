<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\DivisionRule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DivisionRuleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(DivisionRule::orderBy('min_points')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:50',
            'min_points' => 'required|integer|min:0',
            'max_points' => 'required|integer|gte:min_points',
            'badge'      => 'nullable|string|max:100',
        ]);

        $rule = DivisionRule::create($data);
        return response()->json($rule, 201);
    }

    public function show($id): JsonResponse
    {
        return response()->json(DivisionRule::findOrFail($id));
    }

    public function update(Request $request, $id): JsonResponse
    {
        $rule = DivisionRule::findOrFail($id);
        $data = $request->validate([
            'name'       => 'sometimes|string|max:50',
            'min_points' => 'sometimes|integer|min:0',
            'max_points' => 'sometimes|integer',
            'badge'      => 'nullable|string|max:100',
        ]);
        $rule->update($data);
        return response()->json($rule);
    }

    public function destroy($id): JsonResponse
    {
        DivisionRule::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
