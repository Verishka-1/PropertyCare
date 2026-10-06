<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DamageReport;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    /**
     * GET /api/admin/dashboard
     *
     * The app's dashboard cards read:
     *   summary.total / pending / in_progress / completed
     *   needs_review[]  (newest pending reports)
     *
     * "in_progress" = everything between ACCEPTED and COMPLETED
     * (verified + in_progress), so no open report is ever hidden.
     */
    public function index(): JsonResponse
    {
        $count = fn (array $statuses) => DamageReport::whereIn('status', $statuses)->count();

        $summary = [
            'total' => DamageReport::count(),
            'pending' => $count(['pending']),
            'in_progress' => $count(['verified', 'assigned', 'in_progress']),
            'completed' => $count(['completed']),

            // extra figures (not required by the current cards)
            'accepted' => $count(['verified']),
            'repair' => $count(['in_progress']),
            'rejected' => $count(['rejected']),
            'users' => User::where('role', '!=', 'admin')->count(),
        ];

        $needsReview = DamageReport::query()
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (DamageReport $report) => $report->toApiArray());

        return response()->json([
            'message' => 'Dashboard loaded successfully.',
            'summary' => $summary,
            'needs_review' => $needsReview,
        ]);
    }
}
