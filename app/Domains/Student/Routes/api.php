<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\StudentController;

Route::middleware('auth:sanctum')->group(function () {

    // ── Student CRUD ──────────────────────────────────────────────────────────
    Route::get('students/stats',           [StudentController::class, 'stats']);
    Route::get('students/export',          [StudentController::class, 'export']);
    Route::get('students/template',        [StudentController::class, 'downloadTemplate']);
    Route::get('students/duplicates',      [StudentController::class, 'duplicates']);
    Route::get('students',                 [StudentController::class, 'index']);
    Route::post('students',                [StudentController::class, 'store']);
    Route::get('students/{id}',            [StudentController::class, 'show']);
    Route::put('students/{id}',            [StudentController::class, 'update']);
    Route::delete('students/{id}',         [StudentController::class, 'destroy']);

    // ── Bulk Import ───────────────────────────────────────────────────────────
    Route::post('students/bulk',           [StudentController::class, 'bulkStore']);
    Route::post('students/import-file',    [StudentController::class, 'importFile']);

    // ── Student Lifecycle ─────────────────────────────────────────────────────
    Route::post('students/{id}/promote',   [StudentController::class, 'promote']);
    Route::post('students/{id}/transfer',  [StudentController::class, 'transfer']);

    // ── Performance History ───────────────────────────────────────────────────
    Route::get('students/{id}/performance', [StudentController::class, 'performance']);

    // ── Helper Lookups ────────────────────────────────────────────────────────
    Route::get('academic-years',           [StudentController::class, 'academicYears']);
    Route::get('class-levels',             [StudentController::class, 'classLevels']);
});
