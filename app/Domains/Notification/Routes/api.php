<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\NotificationController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('notifications/examinations/{examId}/sms', [NotificationController::class, 'dispatchResultSms']);
    Route::get('notifications/sms/logs', [NotificationController::class, 'logs']);
});
