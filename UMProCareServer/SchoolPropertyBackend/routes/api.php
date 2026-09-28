<?php

use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminMapController;
use App\Http\Controllers\Api\AdminReportController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ComplaintController;
use App\Http\Controllers\Api\DamageReportController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\MyReportsController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReportHistoryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Buildings + rooms for the "select location" list screen.
Route::get('/locations', [LocationController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Authenticated routes (student, teacher, or admin)
|--------------------------------------------------------------------------
| "active" blocks any account an admin has banned.
*/

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::patch('/user/profile', [ProfileController::class, 'update']);
    Route::post('/user/push-token', [ProfileController::class, 'updatePushToken']);

    // Damage reports - submit and track your own.
    Route::post('/reports', [DamageReportController::class, 'store']);
    Route::get('/my/reports', [MyReportsController::class, 'index']);
    Route::get('/my/reports/history', [ReportHistoryController::class, 'index']);
    Route::get('/my/reports/{report}', [MyReportsController::class, 'show']);

    // Complaints / feedback to the admin.
    Route::post('/complaints', [ComplaintController::class, 'store']);

    // In-app notification center.
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
});

/*
|--------------------------------------------------------------------------
| Admin-only routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'active', 'admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::get('/campus-counts', [AdminDashboardController::class, 'campusCounts']);

        Route::get('/map/counts', [AdminMapController::class, 'counts']);
        Route::get('/map/room-reports', [AdminMapController::class, 'roomReports']);
        Route::get('/building-map/counts', [AdminMapController::class, 'buildingCounts']);

        Route::get('/reports', [AdminReportController::class, 'index']);
        Route::get('/reports/{report}', [AdminReportController::class, 'show']);
        Route::patch('/reports/{report}', [AdminReportController::class, 'update']);

        Route::get('/users', [AdminUserController::class, 'index']);
        Route::patch('/users/{user}/ban', [AdminUserController::class, 'toggleBan']);
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);

        Route::get('/complaints', [ComplaintController::class, 'index']);
    });
