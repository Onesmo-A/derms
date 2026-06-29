<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AiController;

// Routes for AI Domain
Route::middleware(['auth:sanctum'])->prefix('ai')->group(function () {
    Route::post('/analyze-performance', [AiController::class, 'analyzePerformance']);
    Route::post('/identify-risk', [AiController::class, 'identifyAtRiskStudents']);
    Route::post('/school-recommendations', [AiController::class, 'getSchoolRecommendations']);
    Route::post('/analyze-trends', [AiController::class, 'analyzeTrends']);
    Route::post('/executive-summary', [AiController::class, 'generateExecutiveSummary']);
});
