<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AnalyticsController;

// Routes for Analytics Domain
Route::middleware(['auth:sanctum'])->prefix('analytics')->group(function () {
    Route::post('/district-overview', [AnalyticsController::class, 'getDistrictOverview']);
});
