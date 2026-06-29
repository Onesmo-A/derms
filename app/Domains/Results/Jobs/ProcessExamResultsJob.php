<?php

namespace App\Domains\Results\Jobs;

use App\Actions\Examination\TransitionExaminationStatusAction;
use App\Enums\ExaminationStatus;
use App\Domains\Results\Services\ResultsProcessingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Domains\Examination\Models\Examination;
use Illuminate\Support\Facades\Log;

class ProcessExamResultsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $examinationId;
    protected string $classLevelId;

    /**
     * Create a new job instance.
     */
    public function __construct(string $examinationId, string $classLevelId)
    {
        $this->examinationId = $examinationId;
        $this->classLevelId = $classLevelId;
    }

    /**
     * Execute the job.
     */
    public function handle(
        ResultsProcessingService $service,
        TransitionExaminationStatusAction $transitionAction
    ): void
    {
        Log::info("Starting results processing for Exam: {$this->examinationId}, ClassLevel: {$this->classLevelId}");

        try {
            // Update examination status to processing
            $exam = Examination::find($this->examinationId);
            if ($exam) {
                $transitionAction->handle($exam, ExaminationStatus::Processing->value);
            }

            // Execute service calculations
            $service->process($this->examinationId, $this->classLevelId);

            // Mark the exam as processed after summaries and rankings are ready
            if ($exam) {
                $transitionAction->handle($exam, ExaminationStatus::Processed->value);
            }

            Log::info("Completed results processing for Exam: {$this->examinationId}");
        } catch (\Exception $e) {
            Log::error("Failed results processing: " . $e->getMessage());
            
            // Revert exam status to marks_entry_open on error
            $exam = Examination::find($this->examinationId);
            if ($exam) {
                $transitionAction->handle($exam, ExaminationStatus::MarksEntryOpen->value);
            }

            throw $e;
        }
    }
}
