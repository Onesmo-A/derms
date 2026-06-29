<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ExaminationController;

Route::middleware('auth:sanctum')->group(function () {
    // Examinations Config & Phases
    Route::get('examinations', [ExaminationController::class, 'index']);
    Route::post('examinations', [ExaminationController::class, 'store']);
    Route::get('examinations/{id}', [ExaminationController::class, 'show']);
    Route::put('examinations/{id}/status', [ExaminationController::class, 'updateStatus']);
    Route::post('examinations/{id}/open-registration', [ExaminationController::class, 'openRegistration']);
    Route::post('examinations/{id}/close-registration', [ExaminationController::class, 'closeRegistration']);
    Route::post('examinations/{id}/process', [ExaminationController::class, 'processResults']);
    Route::get('examinations/{id}/processing-status', [ExaminationController::class, 'processingStatus']);
    Route::post('examinations/{id}/publish', [ExaminationController::class, 'publishResults']);
    Route::post('examinations/{id}/unpublish', [ExaminationController::class, 'unpublishResults']);

    // Mappings & Registration
    Route::post('examinations/{id}/subjects', [ExaminationController::class, 'configureSubjects']);
    Route::post('examinations/{id}/register', [ExaminationController::class, 'registerCandidates']);

    // Grading System configurator
    Route::get('grading-systems', [ExaminationController::class, 'gradingSystems']);
    Route::post('grading-systems', [ExaminationController::class, 'storeGradingSystem']);

    // Lookup metadata
    Route::get('exam-types', [ExaminationController::class, 'examTypes']);
    Route::get('examination-types', [ExaminationController::class, 'examTypes']);
    Route::get('curriculum-subjects', [ExaminationController::class, 'curriculumSubjects']);
    Route::get('subjects', [ExaminationController::class, 'curriculumSubjects']);
});
