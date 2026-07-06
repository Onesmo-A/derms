<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\Subject;
use App\Domains\School\Services\AcademicCatalogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubjectController extends Controller
{
    public function index(AcademicCatalogService $catalogService): JsonResponse
    {
        return response()->json($catalogService->listSubjects());
    }

    public function store(Request $request, AcademicCatalogService $catalogService): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:150',
            'short_name'     => 'nullable|string|max:20',
            'code'           => 'required|string|max:20|unique:subjects,code',
            'has_practical'  => 'boolean',
            'class_level_id' => 'nullable|uuid|exists:class_levels,id',
            'description'    => 'nullable|string',
            'is_active'      => 'boolean',
        ]);

        $subject = $catalogService->storeSubject($data);
        return response()->json($subject->load('classLevel'), 201);
    }

    public function show($id): JsonResponse
    {
        $subject = Subject::findOrFail($id);
        return response()->json(app(AcademicCatalogService::class)->showSubject($subject));
    }

    public function update(Request $request, $id, AcademicCatalogService $catalogService): JsonResponse
    {
        $subject = Subject::findOrFail($id);
        $data = $request->validate([
            'name'           => 'sometimes|string|max:150',
            'short_name'     => 'nullable|string|max:20',
            'code'           => "sometimes|string|max:20|unique:subjects,code,{$id}",
            'has_practical'  => 'boolean',
            'class_level_id' => 'nullable|uuid|exists:class_levels,id',
            'description'    => 'nullable|string',
            'is_active'      => 'boolean',
        ]);
        return response()->json($catalogService->updateSubject($subject, $data));
    }

    public function destroy($id): JsonResponse
    {
        app(AcademicCatalogService::class)->deleteSubject(Subject::findOrFail($id));
        return response()->json(null, 204);
    }

    public function import(Request $request, AcademicCatalogService $catalogService): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt']);
        $created = $catalogService->importSubjects($request->file('file'));
        return response()->json(['message' => "$created records imported."]);
    }

    public function template(AcademicCatalogService $catalogService): StreamedResponse
    {
        return $catalogService->subjectTemplate();
    }
}
