<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use App\Domains\Results\Services\ExternalResultsService;
use App\Domains\Results\Jobs\ScrapeCentreQueueJob;

class NectaController extends Controller
{
    protected ExternalResultsService $service;

    public function __construct(ExternalResultsService $service)
    {
        $this->service = $service;
    }

    public function getYears(Request $request)
    {
        $request->validate([
            'source' => 'required|string',
            'exam_type' => 'required|string'
        ]);
        try {
            $data = $this->service->fetchYears($request->source, $request->exam_type);
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to connect to parser service.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getCentres(Request $request)
    {
        $request->validate([
            'source' => 'required|string',
            'exam_type' => 'required|string',
            'year' => 'required|integer'
        ]);
        try {
            $data = $this->service->fetchCentres($request->source, $request->exam_type, $request->year);
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch centres index list.', 'error' => $e->getMessage()], 500);
        }
    }

    public function startImport(Request $request)
    {
        $request->validate([
            'source' => 'required|string',
            'exam_type' => 'required|string',
            'year' => 'required|integer',
            'mode' => 'required|string|in:all,selected_schools,selected_centres',
            'selected_centres' => 'nullable|array'
        ]);

        $source = $request->source;
        $examType = $request->exam_type;
        $year = $request->year;
        $mode = $request->mode;

        // 1. Check database for running sessions instead of strict Redis lock
        $existingSession = DB::table('import_sessions')
            ->where('source_system', $source)
            ->where('exam_type', $examType)
            ->where('year', $year)
            ->where('status', 'running')
            ->first();

        if ($existingSession) {
            // Check if it's genuinely still running (maybe jobs failed)
            // If it's been running for over 2 hours without progress, we might allow a new one, but for now block it.
            return response()->json(['message' => "An import session is already running for {$source} {$examType} {$year}."], 409);
        }

        // 2. Discover centres from python-service
        try {
            $centresData = $this->service->fetchCentres($source, $examType, $year);
            $allCentres = $centresData['centres'] ?? [];
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to connect to parser service.', 'error' => $e->getMessage()], 500);
        }

        // 3. Filter centres
        $targetCentres = [];
        if ($mode === 'all') {
            $targetCentres = $allCentres;
        } elseif ($mode === 'selected_schools') {
            // Find school mappings
            $mappedCodes = DB::table('school_mappings')
                ->where('source_system', $source)
                ->where('effective_year', $year)
                ->where('status', 'active')
                ->pluck('centre_code')
                ->toArray();

            foreach ($allCentres as $centre) {
                if (in_array($centre['centre_number'], $mappedCodes)) {
                    $targetCentres[] = $centre;
                }
            }
        } else {
            $selected = $request->selected_centres ?? [];
            foreach ($allCentres as $centre) {
                if (in_array($centre['centre_number'], $selected)) {
                    $targetCentres[] = $centre;
                }
            }
        }

        if (empty($targetCentres)) {
            return response()->json(['message' => 'No matching centres found to import.'], 422);
        }

        // 4. Create Session
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
            'started_by' => auth()->id() ?? DB::table('users')->first()->id,
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // 5. Queue Centre Jobs
        foreach ($targetCentres as $centre) {
            DB::table('import_details')->insert([
                'id' => Str::uuid()->toString(),
                'import_session_id' => $sessionId,
                'centre_number' => $centre['centre_number'],
                'school_name' => $centre['school_name'],
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            ScrapeCentreQueueJob::dispatch($sessionId, $source, $examType, $year, $centre['centre_number']);
        }

        return response()->json([
            'message' => 'Staged import session created. Scraper pipeline running.',
            'import_session_id' => $sessionId
        ]);
    }

    public function listSessions()
    {
        $sessions = DB::table('import_sessions')
            ->select('import_sessions.*', DB::raw("CONCAT(users.first_name, ' ', users.last_name) as started_by_name"))
            ->leftJoin('users', 'users.id', '=', 'import_sessions.started_by')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($sessions);
    }

    public function showSession($id)
    {
        $session = DB::table('import_sessions')
            ->select('import_sessions.*', DB::raw("CONCAT(users.first_name, ' ', users.last_name) as started_by_name"))
            ->leftJoin('users', 'users.id', '=', 'import_sessions.started_by')
            ->where('import_sessions.id', $id)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        $details = DB::table('import_details')
            ->where('import_session_id', $id)
            ->get();

        $candidates = DB::table('raw_candidates')
            ->where('import_session_id', $id)
            ->get();
            
        $session->candidates = $candidates;

        return response()->json([
            'session' => $session,
            'details' => $details
        ]);
    }

    public function getProgress($id)
    {
        $session = DB::table('import_sessions')->where('id', $id)->first();
        if (!$session) {
            return response()->json(['message' => 'Session not found.'], 404);
        }
        return response()->json([
            'processed_centres' => $session->processed_centres,
            'failed_centres' => $session->failed_centres,
            'total_centres' => $session->total_centres,
            'total_students' => $session->total_students,
            'status' => $session->status
        ]);
    }

    public function resumeSession($id)
    {
        $session = DB::table('import_sessions')->where('id', $id)->first();
        if (!$session) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        $incomplete = DB::table('import_details')
            ->where('import_session_id', $id)
            ->whereIn('status', ['pending', 'failed'])
            ->get();

        if ($incomplete->isEmpty()) {
            return response()->json(['message' => 'All centres in this session are completed.'], 422);
        }

        DB::table('import_sessions')->where('id', $id)->update([
            'status' => 'running',
            'updated_at' => now()
        ]);

        foreach ($incomplete as $detail) {
            DB::table('import_details')->where('id', $detail->id)->update(['status' => 'pending']);
            ScrapeCentreQueueJob::dispatch($id, $session->source_system, $session->exam_type, $session->year, $detail->centre_number);
        }

        return response()->json(['message' => 'Session resumed. Queued remaining centres.']);
    }

    public function discardSession($id)
    {
        $session = DB::table('import_sessions')->where('id', $id)->first();
        if (!$session) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        DB::table('raw_candidates')->where('import_session_id', $id)->delete();
        DB::table('raw_summaries')->where('import_session_id', $id)->delete();
        DB::table('import_details')->where('import_session_id', $id)->delete();
        DB::table('import_sessions')->where('id', $id)->delete();

        return response()->json(['message' => 'Session and all staged data permanently deleted.']);
    }

    public function retryCentre(Request $request, $id)
    {
        $request->validate(['centre_number' => 'required|string']);
        
        $session = DB::table('import_sessions')->where('id', $id)->first();
        if (!$session) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        $detail = DB::table('import_details')
            ->where('import_session_id', $id)
            ->where('centre_number', $request->centre_number)
            ->first();

        if (!$detail) {
            return response()->json(['message' => 'Centre details not found in session.'], 404);
        }

        DB::table('import_details')->where('id', $detail->id)->update(['status' => 'pending']);
        ScrapeCentreQueueJob::dispatch($id, $session->source_system, $session->exam_type, $session->year, $detail->centre_number);

        return response()->json(['message' => "Centre {$request->centre_number} retry queued successfully."]);
    }

    public function approveSession($id)
    {
        try {
            $success = $this->service->promoteStagedResults($id);
            if ($success) {
                // Release Redis Lock
                $session = DB::table('import_sessions')->where('id', $id)->first();
                if ($session) {
                    Redis::del("import:{$session->source_system}:{$session->exam_type}:{$session->year}");
                }
                return response()->json(['message' => 'Raw staged results promoted successfully. Check snapshots folder for recovery backup.']);
            }
            return response()->json(['message' => 'Promotion transaction failed.'], 500);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Promotion error occurred.', 'error' => $e->getMessage()], 500);
        }
    }

    public function compareSession($id)
    {
        // 1. Fetch raw staged candidates
        $raw = DB::table('raw_candidates')->where('import_session_id', $id)->get();
        if ($raw->isEmpty()) {
            return response()->json(['message' => 'No staging candidates found.'], 404);
        }

        $stagedCandidates = [];
        foreach ($raw as $c) {
            $subjects = DB::table('raw_subjects')->where('raw_candidate_id', $c->id)->get();
            $subs = [];
            foreach ($subjects as $s) {
                $subs[] = [
                    'subject_code' => $s->subject_code,
                    'subject_name' => $s->subject_name,
                    'subject_id' => $s->subject_id,
                    'grade' => $s->grade,
                    'points' => $s->points
                ];
            }
            $stagedCandidates[] = [
                'candidate_number' => $c->candidate_number,
                'gender' => $c->gender,
                'division' => $c->division,
                'points' => $c->points,
                'subjects' => $subs
            ];
        }

        // 2. Fetch matched internal DB candidates
        $dbCandidates = [];
        $registrations = DB::table('examination_registrations')
            ->select('examination_registrations.id', 'examination_registrations.exam_number', 'students.first_name', 'students.last_name', 'student_exam_summaries.division', 'student_exam_summaries.division_points')
            ->join('students', 'students.id', '=', 'examination_registrations.student_id')
            ->leftJoin('student_exam_summaries', 'student_exam_summaries.examination_registration_id', '=', 'examination_registrations.id')
            ->get();

        foreach ($registrations as $reg) {
            $marks = DB::table('marks')
                ->select('subjects.code as subject_code', 'marks.grade')
                ->join('examination_subjects', 'examination_subjects.id', '=', 'marks.examination_subject_id')
                ->join('subjects', 'subjects.id', '=', 'examination_subjects.subject_id')
                ->where('marks.examination_registration_id', $reg->id)
                ->get()
                ->toArray();

            $dbCandidates[] = [
                'exam_number' => $reg->exam_number,
                'student_name' => "{$reg->first_name} {$reg->last_name}",
                'division' => $reg->division,
                'division_points' => $reg->division_points,
                'marks' => array_map(function($m) { return (array)$m; }, $marks)
            ];
        }

        // 3. Call Python Comparison Service
        try {
            $report = $this->service->compareResults($stagedCandidates, $dbCandidates);
            return response()->json($report);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Comparison engine failed.', 'error' => $e->getMessage()], 500);
        }
    }

    public function checkHealth()
    {
        $status = [
            'laravel' => 'OK',
            'database' => 'OK',
            'redis' => 'OK',
            'python_service' => 'OFFLINE',
            'telemetry' => []
        ];

        // DB test
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            $status['database'] = 'ERROR: ' . $e->getMessage();
        }

        // Redis test
        try {
            Redis::ping();
        } catch (\Exception $e) {
            $status['redis'] = 'ERROR: ' . $e->getMessage();
        }

        // Python service test
        try {
            $url = env('PYTHON_SERVICE_URL', 'http://127.0.0.1:8000') . '/api/v1/health';
            $response = Http::timeout(2)->get($url);
            if ($response->ok()) {
                $status['python_service'] = 'OK';
                $status['telemetry'] = $response->json()['metrics'] ?? [];
            }
        } catch (\Exception $e) {
            // Offline
        }

        return response()->json($status);
    }
}
