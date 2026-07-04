<?php

namespace App\Domains\Results\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Domains\Results\Services\NectaIntegrationService;

class ImportCentreJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $sessionId;
    protected string $examType;
    protected int $year;
    protected string $centreNumber;

    /**
     * Create a new job instance.
     */
    public function __construct(string $sessionId, string $examType, int $year, string $centreNumber)
    {
        $this->sessionId = $sessionId;
        $this->examType = $examType;
        $this->year = $year;
        $this->centreNumber = $centreNumber;
    }

    /**
     * Execute the job.
     */
    public function handle(NectaIntegrationService $nectaService): void
    {
        // 1. Update status in details to processing
        DB::table('necta_import_details')
            ->where('import_session_id', $this->sessionId)
            ->where('centre_number', $this->centreNumber)
            ->update([
                'status' => 'processing',
                'started_at' => now()
            ]);

        try {
            // 2. Call python service to scrape the center results
            $result = $nectaService->scrapeCentre($this->examType, $this->year, $this->centreNumber);

            $candidates = $result['candidates'] ?? [];
            
            // 3. Save raw candidates and marks in a transaction
            DB::transaction(function() use ($candidates) {
                foreach ($candidates as $cand) {
                    DB::table('raw_necta_results')->updateOrInsert(
                        [
                            'import_session_id' => $this->sessionId,
                            'candidate_number' => $cand['candidate_number']
                        ],
                        [
                            'id' => Str::uuid()->toString(),
                            'centre_number' => $this->centreNumber,
                            'gender' => $cand['gender'],
                            'division' => $cand['division'],
                            'points' => $cand['points'],
                            'raw_subjects' => json_encode($cand['raw_subjects']),
                            'normalized_subjects' => json_encode($cand['normalized_subjects']),
                            'is_verified' => false,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]
                    );
                }
            });

            // 4. Update detail record to completed
            DB::table('necta_import_details')
                ->where('import_session_id', $this->sessionId)
                ->where('centre_number', $this->centreNumber)
                ->update([
                    'status' => 'completed',
                    'candidates_count' => count($candidates),
                    'finished_at' => now()
                ]);

            // Update session totals
            DB::table('necta_import_sessions')
                ->where('id', $this->sessionId)
                ->update([
                    'processed_centres' => DB::raw('processed_centres + 1'),
                    'total_students' => DB::raw('total_students + ' . count($candidates))
                ]);

        } catch (\Exception $e) {
            // Handle error and mark center as failed
            DB::table('necta_import_details')
                ->where('import_session_id', $this->sessionId)
                ->where('centre_number', $this->centreNumber)
                ->update([
                    'status' => 'failed',
                    'errors' => json_encode(['message' => $e->getMessage()]),
                    'finished_at' => now()
                ]);

            DB::table('necta_import_sessions')
                ->where('id', $this->sessionId)
                ->update([
                    'failed_centres' => DB::raw('failed_centres + 1')
                ]);
        }

        // Check if session is completely finished
        $session = DB::table('necta_import_sessions')->where('id', $this->sessionId)->first();
        if ($session && ($session->processed_centres + $session->failed_centres) >= $session->total_centres) {
            DB::table('necta_import_sessions')
                ->where('id', $this->sessionId)
                ->update([
                    'status' => $session->failed_centres > 0 ? 'failed' : 'completed',
                    'finished_at' => now()
                ]);
        }
    }
}
