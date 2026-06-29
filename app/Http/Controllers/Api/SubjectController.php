<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubjectController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Subject::with('classLevel')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:150',
            'code'           => 'required|string|max:20|unique:subjects,code',
            'has_practical'  => 'boolean',
            'class_level_id' => 'nullable|uuid|exists:class_levels,id',
            'description'    => 'nullable|string',
            'is_active'      => 'boolean',
        ]);

        $subject = Subject::create($data);
        return response()->json($subject->load('classLevel'), 201);
    }

    public function show($id): JsonResponse
    {
        return response()->json(Subject::with('classLevel')->findOrFail($id));
    }

    public function update(Request $request, $id): JsonResponse
    {
        $subject = Subject::findOrFail($id);
        $data = $request->validate([
            'name'           => 'sometimes|string|max:150',
            'code'           => "sometimes|string|max:20|unique:subjects,code,{$id}",
            'has_practical'  => 'boolean',
            'class_level_id' => 'nullable|uuid|exists:class_levels,id',
            'description'    => 'nullable|string',
            'is_active'      => 'boolean',
        ]);
        $subject->update($data);
        return response()->json($subject->load('classLevel'));
    }

    public function destroy($id): JsonResponse
    {
        Subject::findOrFail($id)->delete();
        return response()->json(null, 204);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt']);
        $file   = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        $header  = fgetcsv($handle);
        $created = 0;
        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($header, $row);
            if (empty($data['name']) || empty($data['code'])) continue;
            Subject::updateOrCreate(
                ['code' => $data['code']],
                [
                    'name'           => $data['name'],
                    'description'    => $data['description'] ?? null,
                    'class_level_id' => $data['class_level_id'] ?? null,
                    'is_active'      => isset($data['is_active']) ? filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN) : true,
                ]
            );
            $created++;
        }
        fclose($handle);
        return response()->json(['message' => "$created records imported."]);
    }

    public function template(): StreamedResponse
    {
        $headers  = ['Content-Type' => 'text/csv', 'Content-Disposition' => 'attachment; filename="subject_template.csv"'];
        $callback = function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['name', 'code', 'description', 'class_level_id', 'is_active']);
            fputcsv($out, ['Mathematics', 'MATH', 'Core math subject', '', 'true']);
            fclose($out);
        };
        return new StreamedResponse($callback, 200, $headers);
    }
}
