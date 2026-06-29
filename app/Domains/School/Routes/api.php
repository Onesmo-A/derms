<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\RegionController;
use App\Http\Controllers\Api\DistrictController;

Route::middleware('auth:sanctum')->group(function () {

    // ── Region CRUD ──────────────────────────────────────────────────────────
    Route::get('regions', [RegionController::class, 'index']);
    Route::post('regions', [RegionController::class, 'store']);
    Route::get('regions/{id}', [RegionController::class, 'show']);
    Route::put('regions/{id}', [RegionController::class, 'update']);
    Route::delete('regions/{id}', [RegionController::class, 'destroy']);

    // ── District CRUD ─────────────────────────────────────────────────────────
    Route::get('districts', [DistrictController::class, 'index']);
    Route::post('districts', [DistrictController::class, 'store']);
    Route::get('districts/{id}', [DistrictController::class, 'show']);
    Route::put('districts/{id}', [DistrictController::class, 'update']);
    Route::delete('districts/{id}', [DistrictController::class, 'destroy']);

    // ── School CRUD ───────────────────────────────────────────────────────────
    Route::get('schools', [SchoolController::class, 'index']);
    Route::post('schools', [SchoolController::class, 'store']);
    Route::get('schools/{id}', [SchoolController::class, 'show']);
    Route::put('schools/{id}', [SchoolController::class, 'update']);
    Route::delete('schools/{id}', [SchoolController::class, 'destroy']);
    // Academic Setup CRUD
    Route::apiResource('academic-years', \App\Http\Controllers\Api\AcademicYearController::class);
    Route::apiResource('class-levels', \App\Http\Controllers\Api\ClassLevelController::class);
    Route::apiResource('subjects', \App\Http\Controllers\Api\SubjectController::class);
    // Import/Export endpoints
    Route::post('subjects/import', [\App\Http\Controllers\Api\SubjectController::class, 'import']);
    Route::get('subjects/template', [\App\Http\Controllers\Api\SubjectController::class, 'template']);
    Route::post('class-levels/import', [\App\Http\Controllers\Api\ClassLevelController::class, 'import']);
    Route::get('class-levels/template', [\App\Http\Controllers\Api\ClassLevelController::class, 'template']);

    // ── Grading Systems ──────────────────────────────────────────────────────────
    Route::get('grading-systems', [\App\Http\Controllers\Api\GradingSystemController::class, 'index']);
    Route::post('grading-systems', [\App\Http\Controllers\Api\GradingSystemController::class, 'store']);
    Route::delete('grading-systems/{id}', [\App\Http\Controllers\Api\GradingSystemController::class, 'destroy']);

    // ── Division Rules ───────────────────────────────────────────────────────────
    Route::apiResource('division-rules', \App\Http\Controllers\Api\DivisionRuleController::class);
});
