<?php

namespace App\Domains\Notification\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BeemSmsGateway implements SmsGatewayInterface
{
    protected string $apiKey;
    protected string $secretKey;
    protected string $senderId;

    public function __construct()
    {
        $this->apiKey = env('BEEM_API_KEY', '');
        $this->secretKey = env('BEEM_SECRET_KEY', '');
        $this->senderId = env('BEEM_SENDER_ID', 'INFO');
    }

    /**
     * Send SMS using Beem API gateway.
     */
    public function send(string $phoneNumber, string $message): array
    {
        // Sanitize phone number to Tanzanian country code format: e.g. 2557XXXXXXXX
        $formattedPhone = $this->formatPhoneNumber($phoneNumber);

        try {
            $response = Http::withBasicAuth($this->apiKey, $this->secretKey)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post('https://api.beem.africa/v1/send', [
                    'source_addr' => $this->senderId,
                    'message' => $message,
                    'recipients' => [
                        [
                            'recipient_id' => 1,
                            'dest_addr' => $formattedPhone,
                        ]
                    ]
                ]);

            if ($response->successful()) {
                return [
                    'status' => 'success',
                    'response' => $response->json(),
                ];
            }

            Log::error("Beem SMS send failed. Code: {$response->status()}, Body: {$response->body()}");

            return [
                'status' => 'failed',
                'error' => "HTTP error {$response->status()}: " . $response->body(),
            ];
        } catch (\Exception $e) {
            Log::error("Beem SMS network error: " . $e->getMessage());

            return [
                'status' => 'failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Ensure phone number uses the 255XXXXXXXXX country code format.
     */
    protected function formatPhoneNumber(string $phone): string
    {
        // Remove spaces, dashes, or plus signs
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // If starts with 07 or 06, replace with 255
        if (str_starts_with($phone, '0')) {
            $phone = '255' . substr($phone, 1);
        }

        // If starts with 7 or 6 (missing leading 0), add 255
        if ((str_starts_with($phone, '7') || str_starts_with($phone, '6')) && strlen($phone) === 9) {
            $phone = '255' . $phone;
        }

        return $phone;
    }
}
