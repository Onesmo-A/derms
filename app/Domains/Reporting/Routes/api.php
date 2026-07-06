<?php

use App\Http\Controllers\Api\ExecutiveReportingController;
use App\Http\Controllers\Api\ReportingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('reports/menu', [ExecutiveReportingController::class, 'menu']);
    Route::get('reports/overview', [ExecutiveReportingController::class, 'overview']);
    Route::get('reports/national', [ExecutiveReportingController::class, 'national']);
    Route::get('reports/national/details', [ExecutiveReportingController::class, 'nationalDetails']);
    Route::get('reports/regions', [ExecutiveReportingController::class, 'regions']);
    Route::get('reports/regions/{regionId}', [ExecutiveReportingController::class, 'region']);
    Route::get('reports/regions/{regionId}/details', [ExecutiveReportingController::class, 'regionDetails']);
    Route::get('reports/districts', [ExecutiveReportingController::class, 'districts']);
    Route::get('reports/districts/{districtId}', [ExecutiveReportingController::class, 'district']);
    Route::get('reports/districts/{districtId}/details', [ExecutiveReportingController::class, 'districtDetails']);
    Route::get('reports/schools', [ExecutiveReportingController::class, 'schools']);
    Route::get('reports/schools/{schoolId}', [ExecutiveReportingController::class, 'school']);
    Route::get('reports/schools/{schoolId}/details', [ExecutiveReportingController::class, 'schoolDetails']);
    Route::get('reports/students', [ExecutiveReportingController::class, 'students']);
    Route::get('reports/students/{studentId}', [ExecutiveReportingController::class, 'student']);
    Route::get('reports/ai-insights', [ExecutiveReportingController::class, 'insights']);

    Route::get('reports/{examId}/merit-list', [ReportingController::class, 'getMeritList']);
    Route::get('reports/{examId}/merit-list/pdf', [ReportingController::class, 'exportMeritListPdf']);
    Route::get('reports/{examId}/merit-list/excel', [ReportingController::class, 'exportMeritListExcel']);
    Route::get('reports/{examId}/merit-list/csv', [ReportingController::class, 'exportMeritListCsv']);

    Route::get('reports/{examId}/student-slip/{registrationId}', [ReportingController::class, 'getStudentSlip']);
    Route::get('reports/{examId}/student-slip/{registrationId}/pdf', [ReportingController::class, 'exportStudentSlipPdf']);

    Route::get('reports/{examId}/school-summary/{schoolId}/{classLevelId}', [ReportingController::class, 'getSchoolSummary']);
    Route::get('reports/{examId}/school-summary/{schoolId}/{classLevelId}/pdf', [ReportingController::class, 'exportSchoolSummaryPdf']);
    Route::get('reports/{examId}/school-summary/{schoolId}/{classLevelId}/excel', [ReportingController::class, 'exportSchoolSummaryExcel']);

    Route::get('reports/{examId}/district-summary/{classLevelId}', [ReportingController::class, 'getDistrictSummary']);
    Route::get('reports/{examId}/district-summary/{classLevelId}/pdf', [ReportingController::class, 'exportDistrictSummaryPdf']);
    Route::get('reports/{examId}/district-summary/{classLevelId}/excel', [ReportingController::class, 'exportDistrictSummaryExcel']);
});
