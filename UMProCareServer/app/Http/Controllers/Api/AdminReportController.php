<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DamageReport;
use App\Support\PushNotifier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

/**
 * Admin-only report review. Route-level "admin" middleware already
 * guarantees $request->user() is an admin, so the controller itself
 * stays focused on the actual work.
 */
class AdminReportController extends Controller
{
    private const STATUS_MESSAGES = [
        'verified' => 'Your report has been accepted and is now being worked on.',
        'rejected' => 'Your report was reviewed and could not be accepted.',
        'completed' => 'Good news! The property you reported has been repaired.',
    ];

    /**
     * GET /api/admin/reports?status=pending&building=Building 1
     */
   public function index(Request $request): JsonResponse
{
    if (!$request->user() || $request->user()->role !== 'admin') {
        return response()->json([
            'message' => 'Unauthorized. Admin access required.',
        ], 403);
    }

    $reports = DB::table('damage_reports as dr')
        ->leftJoin('buildings as b', 'b.id', '=', 'dr.building_id')
        ->leftJoin('rooms as r', 'r.id', '=', 'dr.room_id')
        ->leftJoin('users as u', 'u.id', '=', 'dr.user_id')
        ->orderByDesc('dr.created_at')
        ->select([
            'dr.id',
            'dr.report_number',
            'dr.property_name',
            'dr.status',
            'dr.priority',
            'dr.user_id',
            'dr.description',
            'dr.created_at',
            'b.name as building_name',
            'r.name as room_name',
            'u.name as reporter_name',
            'u.email as reporter_email',
        ])
        ->get()
        ->map(function ($report) {
            return [
                'id' => $report->id,
                'report_number' => $report->report_number,
                'title' => $report->property_name ?: 'Damage report',
                'building_name' => $report->building_name ?? 'Unknown building',
                'room_name' => $report->room_name ?? 'Unknown room',
                'description' => $report->description,
                'status' => $report->status,
                'priority' => $report->priority,
                'user_id' => $report->user_id,
                'created_at' => $report->created_at,
                'user' => [
                    'name' => $report->reporter_name,
                    'email' => $report->reporter_email,
                ],
            ];
        });

    return response()->json([
        'message' => 'Reports loaded successfully.',
        'data' => $reports,
    ]);
}

    public function show(DamageReport $report)
    {
        return response()->json([
            'data' => $report->load(['user:id,name,email', 'photos', 'repairUpdates.maintenanceUser:id,name']),
        ]);
    }

    /**
     * PATCH /api/admin/reports/{report}
     *
     * Moves a report through: pending -> verified (accepted / in
     * progress) -> completed, or pending -> rejected. Every change is
     * logged as a repair update and the reporting user is notified.
     */
    public function update(Request $request, DamageReport $report)
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(array_keys(self::STATUS_MESSAGES))],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $report->update(['status' => $validated['status']]);

        $report->repairUpdates()->create([
            'maintenance_user_id' => $request->user()->id,
            'status' => $validated['status'] === 'verified' ? 'in_progress' : $validated['status'],
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($report->user) {
            PushNotifier::notify(
                $report->user,
                'Report ' . $report->report_number . ' updated',
                self::STATUS_MESSAGES[$validated['status']],
                'status_updated',
                $report
            );
        }

        return response()->json([
            'message' => 'Report status updated.',
            'data' => $report->fresh()->load('user:id,name,email'),
        ]);

        $report->load('user');

        (new \App\Notifications\ReportStatusNotification(
            $report
        ))->send();
    }
}
