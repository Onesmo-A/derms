<?php

namespace App\Providers;

use App\Domains\Notification\Services\BeemSmsGateway;
use App\Domains\Notification\Services\LogSmsGateway;
use App\Domains\Notification\Services\SmsGatewayInterface;
use Illuminate\Support\ServiceProvider;

class NotificationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(SmsGatewayInterface::class, function () {
            return env('SMS_DRIVER', 'log') === 'beem'
                ? new BeemSmsGateway()
                : new LogSmsGateway();
        });
    }
}
