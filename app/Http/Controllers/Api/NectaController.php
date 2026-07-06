<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\Results\Services\ExternalResultsService;
use App\Domains\Results\Services\NectaImportOrchestrationService;
use Illuminate\Http\Request;

class NectaController extends Controller
{
    public function __construct(
        protected ExternalResultsService $service,
        protected NectaImportOrchestrationService $nectaImportService,
    ) {
    }

    public function getYears(Request $request)
    {
        $request->validate([
            'source' => 'required|string',
            'exam_type' => 'required|string',
        ]);

        try {
            return response()->json($this->nectaImportService->fetchYears($request->source, $request->exam_type));
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to connect to parser service.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getCentres(Request $request)
    {
        $request->validate([
            'source' => 'required|string',
            'exam_type' => 'required|string',
            'year' => 'required|integer',
        ]);

        try {
            return response()->json($this->nectaImportService->fetchCentres(
                $request->source,
                $request->exam_type,
                (int) $request->year,
            ));
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to fetch centres index list.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function startImport(Request $request)
    {
        $request->validate([
            'source' => 'required|string',
            'exam_type' => 'required|string',
            'year' => 'required|integer',
            'mode' => 'required|string|in:all,selected_schools,selected_centres',
            'selected_centres' => 'nullable|array',
        ]);

        $result = $this->nectaImportService->startImport(
            $request->source,
            $request->exam_type,
            (int) $request->year,
            $request->mode,
            $request->selected_centres ?? [],
            auth()->id(),
        );

        return response()->json($result['payload'], $result['status']);
    }

    public function listSessions()
    {
        return response()->json($this->nectaImportService->listSessions());
    }

    public function showSession(string $id)
    {
        $result = $this->nectaImportService->showSession($id);

        return response()->json($result['payload'], $result['status']);
    }

    public function getProgress(string $id)
    {
        $result = $this->nectaImportService->getProgress($id);

        return response()->json($result['payload'], $result['status']);
    }

    public function resumeSession(string $id)
    {
        $result = $this->nectaImportService->resumeSession($id);

        return response()->json($result['payload'], $result['status']);
    }

    public function discardSession(string $id)
    {
        $result = $this->nectaImportService->discardSession($id);

        return response()->json($result['payload'], $result['status']);
    }

    public function retryCentre(Request $request, string $id)
    {
        $request->validate(['centre_number' => 'required|string']);

        $result = $this->nectaImportService->retryCentre($id, $request->centre_number);

        return response()->json($result['payload'], $result['status']);
    }

    public function approveSession(string $id)
    {
        $result = $this->nectaImportService->approveSession($id);

        return response()->json($result['payload'], $result['status']);
    }

    public function compareSession(string $id)
    {
        $result = $this->nectaImportService->compareSession($id);

        return response()->json($result['payload'], $result['status']);
    }

    public function checkHealth()
    {
        return response()->json($this->nectaImportService->checkHealth());
    }
}
