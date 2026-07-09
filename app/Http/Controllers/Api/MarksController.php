<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Results\Services\MarksExcelImportService;
use App\Domains\Results\Services\MarksService;
use App\Http\Requests\Api\Marks\BulkSaveMarksRequest;
use App\Domains\School\Models\School;
use Illuminate\Http\Request;

class MarksController extends Controller
{
    /**
     * Get candidate grid for spreadsheet marks entry.
     */
    public function getMarksGrid(Request $request, string $examId, string $classLevelId, string $subjectId, MarksService $marksService)
    {
        $validated = $request->validate([
            'school_id' => ['nullable', 'uuid', 'exists:schools,id'],
        ]);

        $examSubject = ExaminationSubject::with('examination')
            ->where('examination_id', $examId)
            ->where('class_level_id', $classLevelId)
            ->where('subject_id', $subjectId)
            ->firstOrFail();

        $this->authorize('enterMarks', $examSubject->examination);

        return response()->json($marksService->buildGrid(
            $examId,
            $classLevelId,
            $subjectId,
            $validated['school_id'] ?? null
        ));
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

    public function downloadImportTemplate(Request $request, MarksExcelImportService $imports)
    {
        $validated = $request->validate([
            'examination_subject_id' => ['required', 'uuid', 'exists:examination_subjects,id'],
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
        ]);

        $examSubject = ExaminationSubject::with(['examination', 'classLevel', 'subject'])->findOrFail($validated['examination_subject_id']);
        $school = School::findOrFail($validated['school_id']);
        $this->authorize('enterMarks', $examSubject->examination);

        return $imports->downloadTemplate($examSubject, $school);
    }

    public function importMarks(Request $request, MarksExcelImportService $imports, MarksService $marksService)
    {
        $validated = $request->validate([
            'examination_subject_id' => ['required', 'uuid', 'exists:examination_subjects,id'],
            'school_id' => ['required', 'uuid', 'exists:schools,id'],
            'file' => ['required', 'file', 'mimes:xlsx', 'max:20480'],
            'preview' => ['sometimes', 'boolean'],
        ]);

        $examSubject = ExaminationSubject::with(['examination', 'classLevel', 'subject'])->findOrFail($validated['examination_subject_id']);
        $school = School::findOrFail($validated['school_id']);
        $this->authorize('enterMarks', $examSubject->examination);

        try {
            $parsed = $imports->parseTemplate($request->file('file'), $examSubject, $school);

            if ($request->boolean('preview')) {
                return response()->json([
                    'message' => 'Preview generated successfully.',
                    'preview_rows' => $parsed['rows'],
                    'candidate_count' => $parsed['candidate_count'],
                    'has_practical' => $parsed['has_practical'],
                ]);
            }

            $savedCount = $marksService->bulkSave(
                $examSubject->id,
                $parsed['rows'],
                $request->user()->id,
                $request,
            );

            return response()->json([
                'message' => "Successfully imported and saved {$savedCount} candidate marks records.",
                'saved' => $savedCount,
                'candidate_count' => $parsed['candidate_count'],
                'has_practical' => $parsed['has_practical'],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
