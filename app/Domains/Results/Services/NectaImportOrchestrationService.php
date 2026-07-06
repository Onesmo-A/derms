<?php

namespace App\Domains\Results\Services;

use App\Domains\Results\Jobs\ScrapeCentreQueueJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class NectaImportOrchestrationService
{
    public function __construct(
        private ExternalResultsService $externalResultsService,
    ) {
    }

    public function fetchYears(string $source, string $examType): array
    {
        return $this->externalResultsService->fetchYears($source, $examType);
    }

    public function fetchCentres(string $source, string $examType, int $year): array
    {
        return $this->externalResultsService->fetchCentres($source, $examType, $year);
    }

    public function startImport(
        string $source,
        string $examType,
        int $year,
        string $mode,
        array $selectedCentres = [],
        ?string $startedById = null,
    ): array {
        $existingSession = DB::table('import_sessions')
            ->where('source_system', $source)
            ->where('exam_type', $examType)
            ->where('year', $year)
            ->where('status', 'running')
            ->first();

        if ($existingSession) {
            return [
                'status' => 409,
                'payload' => ['message' => "An import session is already running for {$source} {$examType} {$year}."],
            ];
        }

        $centresData = $this->fetchCentres($source, $examType, $year);
        $allCentres = $centresData['centres'] ?? [];

        $targetCentres = [];
        if ($mode === 'all') {
            $targetCentres = $allCentres;
        } elseif ($mode === 'selected_schools') {
            $mappedCodes = DB::table('school_mappings')
                ->where('source_system', $source)
                ->where('effective_year', $year)
                ->where('status', 'active')
                ->pluck('centre_code')
                ->toArray();

            foreach ($allCentres as $centre) {
                if (in_array($centre['centre_number'], $mappedCodes, true)) {
                    $targetCentres[] = $centre;
                }
            }
        } else {
            foreach ($allCentres as $centre) {
                if (in_array($centre['centre_number'], $selectedCentres, true)) {
                    $targetCentres[] = $centre;
                }
            }
        }

        if (empty($targetCentres)) {
            return [
                'status' => 422,
                'payload' => ['message' => 'No matching centres found to import.'],
            ];
        }

        $sessionId = Str::uuid()->toString();
        DB::table('import_sessions')->insert([
            'id' => $sessionId,
            'source_system' => $source,
            'exam_type' => $examType,
            'year' => $year,
            'status' => 'running',
            'total_centres' => count($targetCentres),
            'processed_centres' => 0,
            'failed_centres' => 0,
            'total_students' => 0,
            'parser_version' => '2.1.0',
            'scraper_version' => '1.8.4',
            'mapping_version' => '1.0.0',
            'started_by' => $startedById ?? DB::table('users')->value('id'),
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($targetCentres as $centre) {
            DB::table('import_details')->insert([
                'id' => Str::uuid()->toString(),
                'import_session_id' => $sessionId,
                'centre_number' => $centre['centre_number'],
                'school_name' => $centre['school_name'],
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            ScrapeCentreQueueJob::dispatch($sessionId, $source, $examType, $year, $centre['centre_number']);
        }

        return [
            'status' => 200,
            'payload' => [
                'message' => 'Staged import session created. Scraper pipeline running.',
                'import_session_id' => $sessionId,
            ],
        ];
    }

    public function listSessions(): array
    {
        return DB::table('import_sessions')
            ->select('import_sessions.*', DB::raw("CONCAT(users.first_name, ' ', users.last_name) as started_by_name"))
            ->leftJoin('users', 'users.id', '=', 'import_sessions.started_by')
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    public function showSession(string $id): array
    {
        $session = DB::table('import_sessions')
            ->select('import_sessions.*', DB::raw("CONCAT(users.first_name, ' ', users.last_name) as started_by_name"))
            ->leftJoin('users', 'users.id', '=', 'import_sessions.started_by')
            ->where('import_sessions.id', $id)
            ->first();

        if (! $session) {
            return ['status' => 404, 'payload' => ['message' => 'Session not found.']];
        }

        $details = DB::table('import_details')
            ->where('import_session_id', $id)
            ->get();

        $candidates = DB::table('raw_candidates')
            ->where('import_session_id', $id)
            ->get();

        $session->candidates = $candidates;

        return [
            'status' => 200,
            'payload' => [
                'session' => $session,
                'details' => $details,
            ],
        ];
    }

    public function getProgress(string $id): array
    {
        $session = DB::table('import_sessions')->where('id', $id)->first();
        if (! $session) {
            return ['status' => 404, 'payload' => ['message' => 'Session not found.']];
        }

        return [
            'status' => 200,
            'payload' => [
                'processed_centres' => $session->processed_centres,
                'failed_centres' => $session->failed_centres,
                'total_centres' => $session->total_centres,
                'total_students' => $session->total_students,
                'status' => $session->status,
            ],
        ];
    }

    public function resumeSession(string $id): array
    {
        $session = DB::table('import_sessions')->where('id', $id)->first();
        if (! $session) {
            return ['status' => 404, 'payload' => ['message' => 'Session not found.']];
        }

        $incomplete = DB::table('import_details')
            ->where('import_session_id', $id)
            ->whereIn('status', ['pending', 'failed'])
            ->get();

        if ($incomplete->isEmpty()) {
            return ['status' => 422, 'payload' => ['message' => 'All centres in this session are completed.']];
        }

        DB::table('import_sessions')->where('id', $id)->update([
            'status' => 'running',
            'updated_at' => now(),
        ]);

        foreach ($incomplete as $detail) {
            DB::table('import_details')->where('id', $detail->id)->update(['status' => 'pending']);
            ScrapeCentreQueueJob::dispatch($id, $session->source_system, $session->exam_type, $session->year, $detail->centre_number);
        }

        return ['status' => 200, 'payload' => ['message' => 'Session resumed. Queued remaining centres.']];
    }

    public function discardSession(string $id): array
    {
        $session = DB::table('import_sessions')->where('id', $id)->first();
        if (! $session) {
            return ['status' => 404, 'payload' => ['message' => 'Session not found.']];
        }

        DB::table('raw_candidates')->where('import_session_id', $id)->delete();
        DB::table('raw_summaries')->where('import_session_id', $id)->delete();
        DB::table('import_details')->where('import_session_id', $id)->delete();
        DB::table('import_sessions')->where('id', $id)->delete();

        return ['status' => 200, 'payload' => ['message' => 'Session and all staged data permanently deleted.']];
    }

    public function retryCentre(string $sessionId, string $centreNumber): array
    {
        $session = DB::table('import_sessions')->where('id', $sessionId)->first();
        if (! $session) {
            return ['status' => 404, 'payload' => ['message' => 'Session not found.']];
        }

        $detail = DB::table('import_details')
            ->where('import_session_id', $sessionId)
            ->where('centre_number', $centreNumber)
            ->first();

        if (! $detail) {
            return ['status' => 404, 'payload' => ['message' => 'Centre details not found in session.']];
        }

        DB::table('import_details')->where('id', $detail->id)->update(['status' => 'pending']);
        ScrapeCentreQueueJob::dispatch($sessionId, $session->source_system, $session->exam_type, $session->year, $detail->centre_number);

        return ['status' => 200, 'payload' => ['message' => "Centre {$centreNumber} retry queued successfully."]];
    }

    public function approveSession(string $id): array
    {
        try {
            $success = $this->externalResultsService->promoteStagedResults($id);
            if (! $success) {
                return ['status' => 500, 'payload' => ['message' => 'Promotion transaction failed.']];
            }

            $session = DB::table('import_sessions')->where('id', $id)->first();
            if ($session) {
                Redis::del("import:{$session->source_system}:{$session->exam_type}:{$session->year}");
            }

            return [
                'status' => 200,
                'payload' => ['message' => 'Raw staged results promoted successfully. Check snapshots folder for recovery backup.'],
            ];
        } catch (\Throwable $e) {
            return ['status' => 500, 'payload' => ['message' => 'Promotion error occurred.', 'error' => $e->getMessage()]];
        }
    }

    public function compareSession(string $id): array
    {
        $raw = DB::table('raw_candidates')->where('import_session_id', $id)->get();
        if ($raw->isEmpty()) {
            return ['status' => 404, 'payload' => ['message' => 'No staging candidates found.']];
        }

        $stagedCandidates = [];
        foreach ($raw as $candidate) {
            $subjects = DB::table('raw_subjects')->where('raw_candidate_id', $candidate->id)->get();
            $stagedCandidates[] = [
                'candidate_number' => $candidate->candidate_number,
                'gender' => $candidate->gender,
                'division' => $candidate->division,
                'points' => $candidate->points,
                'subjects' => $subjects->map(fn ($subject) => [
                    'subject_code' => $subject->subject_code,
                    'subject_name' => $subject->subject_name,
                    'subject_id' => $subject->subject_id,
                    'grade' => $subject->grade,
                    'points' => $subject->points,
                ])->all(),
            ];
        }

        $dbCandidates = [];
        $registrations = DB::table('examination_registrations')
            ->select('examination_registrations.id', 'examination_registrations.exam_number', 'students.first_name', 'students.last_name', 'student_exam_summaries.division', 'student_exam_summaries.division_points')
            ->join('students', 'students.id', '=', 'examination_registrations.student_id')
            ->leftJoin('student_exam_summaries', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
            ->get();

        foreach ($registrations as $registration) {
            $marks = DB::table('marks')
                ->select('subjects.code as subject_code', 'marks.grade')
                ->join('examination_subjects', 'examination_subjects.id', '=', 'marks.examination_subject_id')
                ->join('subjects', 'subjects.id', '=', 'examination_subjects.subject_id')
                ->where('marks.examination_registration_id', $registration->id)
                ->get()
                ->toArray();

            $dbCandidates[] = [
                'exam_number' => $registration->exam_number,
                'student_name' => "{$registration->first_name} {$registration->last_name}",
                'division' => $registration->division,
                'division_points' => $registration->division_points,
                'marks' => array_map(static fn ($mark) => (array) $mark, $marks),
            ];
        }

        try {
            $report = $this->externalResultsService->compareResults($stagedCandidates, $dbCandidates);
            return ['status' => 200, 'payload' => $report];
        } catch (\Throwable $e) {
            return ['status' => 500, 'payload' => ['message' => 'Comparison engine failed.', 'error' => $e->getMessage()]];
        }
    }

    public function checkHealth(): array
    {
        $status = [
            'laravel' => 'OK',
            'database' => 'OK',
            'redis' => 'OK',
            'python_service' => 'OFFLINE',
            'telemetry' => [],
        ];

        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $status['database'] = 'ERROR: ' . $e->getMessage();
        }

        try {
            Redis::ping();
        } catch (\Throwable $e) {
            $status['redis'] = 'ERROR: ' . $e->getMessage();
        }

        try {
            $url = env('PYTHON_SERVICE_URL', 'http://127.0.0.1:8000') . '/api/v1/health';
            $response = Http::timeout(2)->get($url);
            if ($response->ok()) {
                $status['python_service'] = 'OK';
                $status['telemetry'] = $response->json()['metrics'] ?? [];
            }
        } catch (\Throwable $e) {
            // Leave offline
        }

        return $status;
    }
}
