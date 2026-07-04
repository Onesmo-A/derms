<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MarksController;
use App\Http\Controllers\Api\NectaController;

Route::middleware('auth:sanctum')->group(function () {
    // Marks entry grid & Bulk Save endpoints
    Route::get('marks/exams/{examId}/class-levels/{classLevelId}/subjects/{subjectId}', [MarksController::class, 'getMarksGrid']);
    Route::post('marks/bulk-save', [MarksController::class, 'bulkSave']);

    // External Pluggable Results Importer API Gateway
    Route::get('imports/years', [NectaController::class, 'getYears']);
    Route::get('imports/centres', [NectaController::class, 'getCentres']);
    Route::post('imports/start-import', [NectaController::class, 'startImport']);
    Route::get('imports/sessions', [NectaController::class, 'listSessions']);
    Route::get('imports/sessions/{id}', [NectaController::class, 'showSession']);
    Route::get('imports/{id}/progress', [NectaController::class, 'getProgress']);
    Route::post('imports/sessions/{id}/resume', [NectaController::class, 'resumeSession']);
    Route::post('imports/sessions/{id}/approve', [NectaController::class, 'approveSession']);
    Route::delete('imports/sessions/{id}', [NectaController::class, 'discardSession']);
    Route::post('imports/sessions/{id}/retry-centre', [NectaController::class, 'retryCentre']);
    Route::get('imports/sessions/{id}/comparison', [NectaController::class, 'compareSession']);
    Route::get('health', [NectaController::class, 'checkHealth']);

});
