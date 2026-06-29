<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ReportingController;

Route::middleware('auth:sanctum')->group(function () {

    // ── Merit List ──────────────────────────────
    Route::get('reports/{examId}/merit-list', [ReportingController::class, 'getMeritList']);
    Route::get('reports/{examId}/merit-list/pdf', [ReportingController::class, 'exportMeritListPdf']);
    Route::get('reports/{examId}/merit-list/excel', [ReportingController::class, 'exportMeritListExcel']);
    Route::get('reports/{examId}/merit-list/csv', [ReportingController::class, 'exportMeritListCsv']);

    // ── Student Slip ───────────────────────────
    Route::get('reports/{examId}/student-slip/{registrationId}', [ReportingController::class, 'getStudentSlip']);
    Route::get('reports/{examId}/student-slip/{registrationId}/pdf', [ReportingController::class, 'exportStudentSlipPdf']);

    // ── School Summary ─────────────────────────
    Route::get('reports/{examId}/school-summary/{schoolId}/{classLevelId}', [ReportingController::class, 'getSchoolSummary']);
    Route::get('reports/{examId}/school-summary/{schoolId}/{classLevelId}/pdf', [ReportingController::class, 'exportSchoolSummaryPdf']);
    Route::get('reports/{examId}/school-summary/{schoolId}/{classLevelId}/excel', [ReportingController::class, 'exportSchoolSummaryExcel']);

    // ── District Summary ───────────────────────
    Route::get('reports/{examId}/district-summary/{classLevelId}', [ReportingController::class, 'getDistrictSummary']);
    Route::get('reports/{examId}/district-summary/{classLevelId}/pdf', [ReportingController::class, 'exportDistrictSummaryPdf']);
    Route::get('reports/{examId}/district-summary/{classLevelId}/excel', [ReportingController::class, 'exportDistrictSummaryExcel']);
});

