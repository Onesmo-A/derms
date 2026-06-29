<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\School\Models\GradingSystem;
use App\Domains\School\Models\GradingSystemDetail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class GradingSystemController extends Controller
{
    /** List all grading system details (flat list for the UI) */
    public function index(): JsonResponse
    {
        $details = GradingSystemDetail::with('gradingSystem')
            ->orderBy('min_score', 'desc')
            ->get()
            ->map(fn ($d) => [
                'id'          => $d->id,
                'label'       => $d->grade,
                'min_percent' => $d->min_score,
                'max_percent' => $d->max_score,
                'points'      => $d->points,
                'description' => $d->description,
                'system_name' => $d->gradingSystem?->name,
            ]);

        return response()->json($details);
    }

    /**
     * Store a grading system detail.
     * Auto-creates a default GradingSystem if none exists.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'label'       => 'required|string|max:5',
            'min_percent' => 'required|numeric|min:0|max:100',
            'max_percent' => 'required|numeric|gte:min_percent|max:100',
            'points'      => 'required|integer|min:1',
            'description' => 'nullable|string',
        ]);

        // Use or create a default system
        $system = GradingSystem::firstOrCreate(
            ['name' => 'NECTA Standard', 'type' => 'subject'],
            ['id' => (string) Str::uuid()]
        );

        $detail = GradingSystemDetail::create([
            'id'                => (string) Str::uuid(),
            'grading_system_id' => $system->id,
            'grade'             => $data['label'],
            'min_score'         => $data['min_percent'],
            'max_score'         => $data['max_percent'],
            'points'            => $data['points'],
            'description'       => $data['description'] ?? null,
        ]);

        return response()->json([
            'id'          => $detail->id,
            'label'       => $detail->grade,
            'min_percent' => $detail->min_score,
            'max_percent' => $detail->max_score,
            'points'      => $detail->points,
        ], 201);
    }

    public function destroy($id): JsonResponse
    {
        GradingSystemDetail::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
