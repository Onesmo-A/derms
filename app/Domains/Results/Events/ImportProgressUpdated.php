<?php

namespace App\Domains\Results\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ImportProgressUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $sessionId;
    public array $progress;

    /**
     * Create a new event instance.
     */
    public function __construct(string $sessionId, array $progress)
    {
        $this->sessionId = $sessionId;
        $this->progress = $progress;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('import-progress.' . $this->sessionId)
        ];
    }
}
