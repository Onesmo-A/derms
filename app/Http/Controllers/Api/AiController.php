<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\AI\Services\AiOrchestrationService;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function __construct(
        protected AiOrchestrationService $aiOrchestrationService
    ) {}

    /**
     * Get overall performance analysis.
     */
    public function analyzePerformance(Request $request)
    {
        $request->validate([
            'examination_id' => 'required|uuid|exists:examinations,id',
            'class_level_id' => 'required|uuid|exists:class_levels,id',
            'school_id'      => 'nullable|uuid|exists:schools,id',
        ]);

        $result = $this->aiOrchestrationService->analyzePerformance(
            $request->examination_id,
            $request->class_level_id,
            $request->school_id
        );

        return response()->json($result);
    }

    /**
     * Identify at-risk students.
     */
    public function identifyAtRiskStudents(Request $request)
    {
        $request->validate([
            'examination_id' => 'required|uuid|exists:examinations,id',
            'class_level_id' => 'required|uuid|exists:class_levels,id',
            'school_id'      => 'nullable|uuid|exists:schools,id',
        ]);

        $result = $this->aiOrchestrationService->identifyAtRiskStudents(
            $request->examination_id,
            $request->class_level_id,
            $request->school_id
        );

        return response()->json($result);
    }

    /**
     * Get school recommendations.
     */
    public function getSchoolRecommendations(Request $request)
    {
        $request->validate([
            'examination_id' => 'required|uuid|exists:examinations,id',
            'school_id'      => 'required|uuid|exists:schools,id',
            'class_level_id' => 'required|uuid|exists:class_levels,id',
        ]);

        $result = $this->aiOrchestrationService->getSchoolRecommendations(
            $request->examination_id,
            $request->school_id,
            $request->class_level_id
        );

        return response()->json($result);
    }

    /**
     * Analyze trends across multiple examinations.
     */
    public function analyzeTrends(Request $request)
    {
        $request->validate([
            'examination_ids'   => 'required|array|min:2',
            'examination_ids.*' => 'required|uuid|exists:examinations,id',
            'class_level_id'    => 'required|uuid|exists:class_levels,id',
            'school_id'         => 'nullable|uuid|exists:schools,id',
        ]);

        $result = $this->aiOrchestrationService->analyzeTrends(
            $request->examination_ids,
            $request->class_level_id,
            $request->school_id
        );

        return response()->json($result);
    }

    /**
     * Generate an executive summary briefing for district officers.
     */
    public function generateExecutiveSummary(Request $request)
    {
        $request->validate([
            'examination_id' => 'required|uuid|exists:examinations,id',
            'class_level_id' => 'required|uuid|exists:class_levels,id',
        ]);

        $result = $this->aiOrchestrationService->generateExecutiveSummary(
            $request->examination_id,
            $request->class_level_id
        );

        return response()->json($result);
    }
}
