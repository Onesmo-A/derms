<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\Subject;
use App\Http\Requests\Api\School\SubjectStoreRequest;
use App\Http\Requests\Api\School\SubjectUpdateRequest;
use App\Http\Requests\Api\School\SubjectImportRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubjectController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Subject::class);
        $subjects = Subject::with('classLevel')->get();
        return response()->json($subjects);
    }

    public function store(SubjectStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Subject::class);
        $subject = Subject::create($request->validated());
        return response()->json($subject, 201);
    }

    public function show($id): JsonResponse
    {
        $subject = Subject::with('classLevel')->findOrFail($id);
        $this->authorize('view', $subject);
        return response()->json($subject);
    }

    public function update(SubjectUpdateRequest $request, $id): JsonResponse
    {
        $subject = Subject::findOrFail($id);
        $this->authorize('update', $subject);
        $subject->update($request->validated());
        return response()->json($subject);
    }

    public function destroy($id): JsonResponse
    {
        $subject = Subject::findOrFail($id);
        $this->authorize('delete', $subject);
        $subject->delete();
        return response()->json(null, 204);
    }

    // Import CSV/Excel (simple CSV implementation)
    public function import(SubjectImportRequest $request): JsonResponse
    {
        $this->authorize('create', Subject::class);
        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);
        $created = 0;
        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($header, $row);
            // Basic validation, ensure required fields exist
            if (empty($data['name']) || empty($data['code'])) {
                continue;
            }
            Subject::updateOrCreate([
                'code' => $data['code'],
            ], [
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'class_level_id' => $data['class_level_id'] ?? null,
                'is_active' => isset($data['is_active']) ? filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN) : true,
            ]);
            $created++;
        }
        fclose($handle);
        return response()->json(['message' => "$created records imported."]);
    }

    // Provide a CSV template for subjects
    public function template(): StreamedResponse
    {
        $this->authorize('viewAny', Subject::class);
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="subject_template.csv"',
        ];
        $callback = function () {
            $output = fopen('php://output', 'w');
            // Header row
            fputcsv($output, ['name', 'code', 'description', 'class_level_id', 'is_active']);
            // Example row
            fputcsv($output, ['Mathematics', 'MATH101', 'Core math subject', '1', 'true']);
            fclose($output);
        };
        return new StreamedResponse($callback, Response::HTTP_OK, $headers);
    }
}
?>
