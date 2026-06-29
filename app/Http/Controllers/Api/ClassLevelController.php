<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\ClassLevel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClassLevelController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ClassLevel::orderBy('numeric_level')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'numeric_level' => 'nullable|integer',
        ]);

        $level = ClassLevel::create($data);
        return response()->json($level, 201);
    }

    public function show($id): JsonResponse
    {
        return response()->json(ClassLevel::findOrFail($id));
    }

    public function update(Request $request, $id): JsonResponse
    {
        $level = ClassLevel::findOrFail($id);
        $data = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'numeric_level' => 'nullable|integer',
        ]);
        $level->update($data);
        return response()->json($level);
    }

    public function destroy($id): JsonResponse
    {
        ClassLevel::findOrFail($id)->delete();
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
            if (empty($data['name'])) continue;
            ClassLevel::updateOrCreate(
                ['name' => $data['name']],
                ['numeric_level' => $data['numeric_level'] ?? null]
            );
            $created++;
        }
        fclose($handle);
        return response()->json(['message' => "$created records imported."]);
    }

    public function template(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers  = ['Content-Type' => 'text/csv', 'Content-Disposition' => 'attachment; filename="class_level_template.csv"'];
        $callback = function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['name', 'numeric_level']);
            fputcsv($out, ['Form 1', '1']);
            fclose($out);
        };
        return new \Symfony\Component\HttpFoundation\StreamedResponse($callback, 200, $headers);
    }
}
