<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\ClassLevel;
use App\Domains\School\Services\AcademicCatalogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClassLevelController extends Controller
{
    public function index(AcademicCatalogService $catalogService): JsonResponse
    {
        return response()->json($catalogService->listClassLevels());
    }

    public function store(Request $request, AcademicCatalogService $catalogService): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'numeric_level' => 'nullable|integer',
        ]);

        $level = $catalogService->storeClassLevel($data);
        return response()->json($level, 201);
    }

    public function show($id): JsonResponse
    {
        return response()->json(ClassLevel::findOrFail($id));
    }

    public function update(Request $request, $id, AcademicCatalogService $catalogService): JsonResponse
    {
        $level = ClassLevel::findOrFail($id);
        $data = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'numeric_level' => 'nullable|integer',
        ]);
        return response()->json($catalogService->updateClassLevel($level, $data));
    }

    public function destroy($id): JsonResponse
    {
        ClassLevel::findOrFail($id)->delete();
        return response()->json(null, 204);
    }

    public function import(Request $request, AcademicCatalogService $catalogService): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt']);
        $created = $catalogService->importClassLevels($request->file('file'));
        return response()->json(['message' => "$created records imported."]);
    }

    public function template(AcademicCatalogService $catalogService): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        return $catalogService->classLevelTemplate();
    }
}
