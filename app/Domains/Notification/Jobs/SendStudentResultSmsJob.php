<?php

namespace App\Domains\Notification\Jobs;

use App\Domains\Notification\Services\SmsDispatcherService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendStudentResultSmsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $registrationId;

    /**
     * Create a new job instance.
     */
    public function __construct(string $registrationId)
    {
        $this->registrationId = $registrationId;
    }

    /**
     * Execute the job.
     */
    public function handle(SmsDispatcherService $dispatcher): void
    {
        Log::info("Running result SMS job for registration: {$this->registrationId}");
        
        try {
            $dispatcher->dispatchResultSms($this->registrationId);
        } catch (\Exception $e) {
            Log::error("SMS Job failed for registration: {$this->registrationId}. Error: " . $e->getMessage());
            throw $e;
        }
    }
}
