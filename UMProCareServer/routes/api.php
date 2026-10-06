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

// Buildings + rooms for the "Select Room" list screen.
Route::get('/locations', [LocationController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Signed-in routes (student, teacher or admin)
|--------------------------------------------------------------------------
| "active" blocks accounts that an admin has banned.
*/

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile
    Route::get('/user/profile', [ProfileController::class, 'show']);
    Route::patch('/user/profile', [ProfileController::class, 'update']);

    // Damage reports - submit and track your own.
    // (order matters: "history" must come before the {report} wildcard)
    Route::post('/reports', [DamageReportController::class, 'store']);
    Route::get('/my/reports', [MyReportsController::class, 'index']);
    Route::get('/my/reports/history', [ReportHistoryController::class, 'index']);
    Route::get('/my/reports/{report}', [MyReportsController::class, 'show']);

    // Complaints / feedback to the admin.
    Route::post('/complaints', [ComplaintController::class, 'store']);

    // In-app notifications (bell icon) - users AND admin.
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
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

        // Report map (campus + building) and its counts
        Route::get('/campus-counts', [AdminMapController::class, 'campusCounts']);
        Route::get('/map/counts', [AdminMapController::class, 'counts']);
        Route::get('/map/room-reports', [AdminMapController::class, 'roomReports']);
        Route::get('/building-map/counts', [AdminMapController::class, 'buildingCounts']);

        // Reports (list view, details, accept / repair / complete / reject)
        Route::get('/reports', [AdminReportController::class, 'index']);
        Route::get('/reports/{report}', [AdminReportController::class, 'show']);
        Route::patch('/reports/{report}', [AdminReportController::class, 'update']);

        // Users (search, details, ban / unban)
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{user}', [AdminUserController::class, 'show']);
        Route::patch('/users/{user}/ban', [AdminUserController::class, 'toggleBan']);
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);

        // Complaints (view + reply)
        Route::get('/complaints', [ComplaintController::class, 'index']);
        Route::patch('/complaints/{complaint}/reply', [ComplaintController::class, 'reply']);
    });
