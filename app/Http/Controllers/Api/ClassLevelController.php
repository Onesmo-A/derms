<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;

use App\Domains\School\Models\ClassLevel;
use App\Http\Requests\Api\School\ClassLevelStoreRequest;
use App\Http\Requests\Api\School\ClassLevelUpdateRequest;
use Illuminate\Http\JsonResponse;

class ClassLevelController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', ClassLevel::class);
        $levels = ClassLevel::all();
        return response()->json($levels);
    }

    public function store(ClassLevelStoreRequest $request): JsonResponse
    {
        $this->authorize('create', ClassLevel::class);
        $level = ClassLevel::create($request->validated());
        return response()->json($level, 201);
    }

    public function show($id): JsonResponse
    {
        $level = ClassLevel::findOrFail($id);
        $this->authorize('view', $level);
        return response()->json($level);
    }

    public function update(ClassLevelUpdateRequest $request, $id): JsonResponse
    {
        $level = ClassLevel::findOrFail($id);
        $this->authorize('update', $level);
        $level->update($request->validated());
        return response()->json($level);
    }

    public function destroy($id): JsonResponse
    {
        $level = ClassLevel::findOrFail($id);
        $this->authorize('delete', $level);
        $level->delete();
        return response()->json(null, 204);
    }
}
?>
