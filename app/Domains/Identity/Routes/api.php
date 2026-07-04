<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\AuditLogController;

// ─────────────────────────────────────────────────────────────
// Public Authentication
// ─────────────────────────────────────────────────────────────
Route::post('auth/login', [AuthController::class, 'login']);

// ─────────────────────────────────────────────────────────────
// Protected routes (Sanctum token required)
// ─────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me',      [AuthController::class, 'me']);

    // ── User Management ──────────────────────────────────────
    Route::prefix('users')->group(function () {
        Route::get('/',                          [UserController::class, 'index']);
        Route::post('/',                         [UserController::class, 'store']);
        Route::get('/form-data',                 [UserController::class, 'formData']);
        Route::get('/{id}',                      [UserController::class, 'show']);
        Route::put('/{id}',                      [UserController::class, 'update']);
        Route::delete('/{id}',                   [UserController::class, 'destroy']);
        Route::patch('/{id}/status',             [UserController::class, 'changeStatus']);
        Route::post('/{id}/reset-password',      [UserController::class, 'resetPassword']);
        Route::post('/{id}/force-password-reset', [UserController::class, 'forcePasswordChange']);
    });

    // ── Roles & Permissions ──────────────────────────────────
    Route::get('roles',              [RoleController::class, 'index']);
    Route::get('roles/hierarchy',    [RoleController::class, 'hierarchy']);
    Route::get('permissions',        [RoleController::class, 'permissions']);

    // ── Audit Logs & Activity ─────────────────────────────────
    Route::prefix('audit-logs')->group(function () {
        Route::get('/',         [AuditLogController::class, 'index']);
        Route::get('/live',     [AuditLogController::class, 'live']);
        Route::get('/modules',  [AuditLogController::class, 'modules']);
        Route::get('/{id}',     [AuditLogController::class, 'show']);
    });
});
