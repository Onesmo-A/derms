<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\StudentController;

Route::middleware('auth:sanctum')->group(function () {
    // Student CRUD & Bulk Registration
    Route::get('students', [StudentController::class, 'index']);
    Route::post('students', [StudentController::class, 'store']);
    Route::get('students/{id}', [StudentController::class, 'show']);
    Route::put('students/{id}', [StudentController::class, 'update']);
    Route::delete('students/{id}', [StudentController::class, 'destroy']);
    Route::post('students/bulk', [StudentController::class, 'bulkStore']);
});
