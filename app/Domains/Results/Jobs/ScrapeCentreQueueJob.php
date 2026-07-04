<?php

namespace App\Domains\Results\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Domains\Results\Services\ExternalResultsService;
use App\Domains\Results\Events\ImportProgressUpdated;

class ScrapeCentreQueueJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $sessionId;
    protected string $sourceSystem;
    protected string $examType;
    protected int $year;
    protected string $centreNumber;

    /**
     * Create a new job instance.
     */
    public function __construct(string $sessionId, string $sourceSystem, string $examType, int $year, string $centreNumber)
    {
        $this->sessionId = $sessionId;
        $this->sourceSystem = $sourceSystem;
        $this->examType = $examType;
        $this->year = $year;
        $this->centreNumber = $centreNumber;
    }

    /**
     * Execute the job.
     */
    public function handle(ExternalResultsService $service): void
    {
        // 1. Update status to processing
        DB::table('import_details')
            ->where('import_session_id', $this->sessionId)
            ->where('centre_number', $this->centreNumber)
            ->update([
                'status' => 'processing',
                'started_at' => now()
            ]);

        try {
            // 2. Call python service pipeline
            $payload = $service->processCentre($this->sourceSystem, $this->examType, $this->year, $this->centreNumber);

            $candidates = $payload['candidates'] ?? [];
            $summary = $payload['summary'] ?? [];

            DB::transaction(function() use ($candidates, $summary) {
                // Save raw summaries
                if (!empty($summary)) {
                    DB::table('raw_summaries')->updateOrInsert(
                        [
                            'import_session_id' => $this->sessionId,
                            'centre_number' => $this->centreNumber
                        ],
                        [
                            'id' => Str::uuid()->toString(),
                            'division_i_count' => $summary['division_i_count'] ?? 0,
                            'division_ii_count' => $summary['division_ii_count'] ?? 0,
                            'division_iii_count' => $summary['division_iii_count'] ?? 0,
                            'division_iv_count' => $summary['division_iv_count'] ?? 0,
                            'division_zero_count' => $summary['division_zero_count'] ?? 0,
                            'sat_candidates' => $summary['sat_candidates'] ?? 0,
                            'absent_candidates' => $summary['absent_candidates'] ?? 0,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]
                    );
                }

                // Save candidates and detailed subjects
                foreach ($candidates as $cand) {
                    $rawCandId = Str::uuid()->toString();
                    
                    DB::table('raw_candidates')->updateOrInsert(
                        [
                            'import_session_id' => $this->sessionId,
                            'candidate_number' => $cand['candidate_number']
                        ],
                        [
                            'id' => $rawCandId,
                            'centre_number' => $this->centreNumber,
                            'gender' => $cand['gender'],
                            'division' => $cand['division'],
                            'points' => $cand['points'],
                            'is_verified' => false,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]
                    );

                    // Drop existing raw subjects for this candidate if any (for re-run resilience)
                    DB::table('raw_subjects')->where('raw_candidate_id', $rawCandId)->delete();

                    // Save subjects
                    foreach ($cand['subjects'] as $sub) {
                        DB::table('raw_subjects')->insert([
                            'id' => Str::uuid()->toString(),
                            'raw_candidate_id' => $rawCandId,
                            'subject_code' => $sub['subject_code'],
                            'subject_name' => $sub['subject_name'],
                            'subject_id' => $sub['subject_id'],
                            'grade' => $sub['grade'],
                            'points' => $sub['points'],
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                }
            });

            // 3. Mark completed
            DB::table('import_details')
                ->where('import_session_id', $this->sessionId)
                ->where('centre_number', $this->centreNumber)
                ->update([
                    'status' => 'completed',
                    'candidates_count' => count($candidates),
                    'finished_at' => now()
                ]);

            DB::table('import_sessions')
                ->where('id', $this->sessionId)
                ->update([
                    'processed_centres' => DB::raw('processed_centres + 1'),
                    'total_students' => DB::raw('total_students + ' . count($candidates))
                ]);

        } catch (\Exception $e) {
            DB::table('import_details')
                ->where('import_session_id', $this->sessionId)
                ->where('centre_number', $this->centreNumber)
                ->update([
                    'status' => 'failed',
                    'errors' => json_encode(['message' => $e->getMessage()]),
                    'finished_at' => now()
                ]);

            DB::table('import_sessions')
                ->where('id', $this->sessionId)
                ->update([
                    'failed_centres' => DB::raw('failed_centres + 1')
                ]);
        }

        // Broadcast progress event (websockets update)
        $session = DB::table('import_sessions')->where('id', $this->sessionId)->first();
        if ($session) {
            event(new ImportProgressUpdated($this->sessionId, [
                'processed_centres' => $session->processed_centres,
                'failed_centres' => $session->failed_centres,
                'total_centres' => $session->total_centres,
                'total_students' => $session->total_students,
                'status' => $session->status
            ]));

            // If complete
            if (($session->processed_centres + $session->failed_centres) >= $session->total_centres) {
                DB::table('import_sessions')
                    ->where('id', $this->sessionId)
                    ->update([
                        'status' => $session->failed_centres > 0 ? 'failed' : 'completed',
                        'finished_at' => now()
                    ]);
            }
        }
    }
}
