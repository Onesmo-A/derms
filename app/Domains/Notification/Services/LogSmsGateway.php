<?php

namespace App\Domains\Notification\Services;

use Illuminate\Support\Facades\Log;

class LogSmsGateway implements SmsGatewayInterface
{
    /**
     * Simulate sending SMS by writing to application log.
     */
    public function send(string $phoneNumber, string $message): array
    {
        Log::info("SMS Gateway [LOG DRIVER]: Sent message to {$phoneNumber}: \"{$message}\"");

        return [
            'status' => 'success',
            'response' => 'Mock SMS recorded in logs successfully.',
        ];
    }
}
