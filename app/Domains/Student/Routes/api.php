<?php

use App\Http\Controllers\Api\StudentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('students/stats', [StudentController::class, 'stats']);
    Route::get('students/validate', [StudentController::class, 'validateStudentData']);
    Route::get('students/export', [StudentController::class, 'export']);
    Route::get('students/template', [StudentController::class, 'downloadTemplate']);
    Route::get('students/duplicates', [StudentController::class, 'duplicates']);
    Route::get('students', [StudentController::class, 'index']);
    Route::post('students', [StudentController::class, 'store']);
    Route::get('students/{id}', [StudentController::class, 'show']);
    Route::put('students/{id}', [StudentController::class, 'update']);
    Route::delete('students/{id}', [StudentController::class, 'destroy']);

    Route::post('students/bulk', [StudentController::class, 'bulkStore']);
    Route::post('students/import-file', [StudentController::class, 'importFile']);

    Route::post('students/{id}/promote', [StudentController::class, 'promote']);
    Route::post('students/{id}/transfer', [StudentController::class, 'transfer']);
    Route::get('students/{id}/subjects', [StudentController::class, 'subjects']);
    Route::put('students/{id}/subjects', [StudentController::class, 'syncSubjects']);
    Route::post('students/subjects/bulk', [StudentController::class, 'bulkSyncSubjects']);

    Route::get('students/{id}/performance', [StudentController::class, 'performance']);

    Route::get('academic-years', [StudentController::class, 'academicYears']);
    Route::get('class-levels', [StudentController::class, 'classLevels']);
});
