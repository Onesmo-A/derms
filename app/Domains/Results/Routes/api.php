<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MarksController;

Route::middleware('auth:sanctum')->group(function () {
    // Marks entry grid & Bulk Save endpoints
    Route::get('marks/exams/{examId}/class-levels/{classLevelId}/subjects/{subjectId}', [MarksController::class, 'getMarksGrid']);
    Route::post('marks/bulk-save', [MarksController::class, 'bulkSave']);
});
