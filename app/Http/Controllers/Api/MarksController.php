<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Results\Services\MarksService;
use App\Http\Requests\Api\Marks\BulkSaveMarksRequest;

class MarksController extends Controller
{
    /**
     * Get candidate grid for spreadsheet marks entry.
     */
    public function getMarksGrid(string $examId, string $classLevelId, string $subjectId, MarksService $marksService)
    {
        $examSubject = ExaminationSubject::with('examination')
            ->where('examination_id', $examId)
            ->where('class_level_id', $classLevelId)
            ->where('subject_id', $subjectId)
            ->firstOrFail();

        $this->authorize('enterMarks', $examSubject->examination);

        return response()->json($marksService->buildGrid($examId, $classLevelId, $subjectId));
    }

    /**
     * Bulk save marks grid. Handles practical weighting, grading, and validations.
     */
    public function bulkSave(BulkSaveMarksRequest $request, MarksService $marksService)
    {
        $examSubject = ExaminationSubject::with('examination')->findOrFail($request->examination_subject_id);
        $this->authorize('enterMarks', $examSubject->examination);

        try {
            $savedCount = $marksService->bulkSave(
                $examSubject->id,
                $request->marks,
                $request->user()->id,
                $request,
            );

            return response()->json([
                'message' => "Successfully saved {$savedCount} candidate marks records."
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to save marks: ' . $e->getMessage()
            ], 422);
        }
    }
}
