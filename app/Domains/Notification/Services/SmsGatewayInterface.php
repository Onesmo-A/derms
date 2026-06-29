<?php

namespace App\Domains\Notification\Services;

interface SmsGatewayInterface
{
    /**
     * Send an SMS message to a phone number.
     *
     * @param string $phoneNumber Recipient phone number (e.g. +2557XXXXXXXX)
     * @param string $message Message body text
     * @return array Array containing status ('success' or 'failed') and gateway response details
     */
    public function send(string $phoneNumber, string $message): array;
}
