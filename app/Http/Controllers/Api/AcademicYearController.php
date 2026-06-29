<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AcademicYearController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(AcademicYear::orderBy('start_date', 'desc')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:4',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after:start_date',
            'is_active'  => 'boolean',
        ]);

        if (!empty($data['is_active'])) {
            AcademicYear::where('is_active', true)->update(['is_active' => false]);
        }

        $year = AcademicYear::create($data);
        return response()->json($year, 201);
    }

    public function show($id): JsonResponse
    {
        return response()->json(AcademicYear::findOrFail($id));
    }

    public function update(Request $request, $id): JsonResponse
    {
        $year = AcademicYear::findOrFail($id);
        $data = $request->validate([
            'name'       => 'sometimes|string|max:100',
            'start_date' => 'sometimes|date',
            'end_date'   => 'sometimes|date',
            'is_active'  => 'boolean',
        ]);

        if (!empty($data['is_active'])) {
            AcademicYear::where('id', '!=', $id)->where('is_active', true)->update(['is_active' => false]);
        }

        $year->update($data);
        return response()->json($year);
    }

    public function destroy($id): JsonResponse
    {
        AcademicYear::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
