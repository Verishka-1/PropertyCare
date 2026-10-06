<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DamageReport;
use App\Support\Notifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Admin-only report review. The route-level "admin" middleware already
 * guarantees $request->user() is an admin.
 */
class AdminReportController extends Controller
{
    /**
     * The ONLY allowed moves (current status => next statuses):
     *
     *   pending      -> verified      (Accept)   | rejected (Reject)
     *   verified     -> in_progress   (Start repair)
     *   in_progress  -> completed     (Mark complete)
     *
     * completed / rejected are final.
     */
    private const TRANSITIONS = [
        'pending' => ['verified', 'rejected'],
        'verified' => ['in_progress'],
        'in_progress' => ['completed'],
    ];

    /** Text shown in the reporter's notification bell. */
    private const NOTIFICATIONS = [
        'verified' => [
            'Report accepted',
            'Your report %s was accepted by the administrator.',
        ],
        'in_progress' => [
            'Repair started',
            'Repair work for your report %s has started.',
        ],
        'completed' => [
            'Repair completed',
            'Good news! The damage in your report %s has been repaired.',
        ],
        'rejected' => [
            'Report rejected',
            'Your report %s was reviewed and could not be accepted.',
        ],
    ];

    /**
     * GET /api/admin/reports
     *   ?status=pending,verified   (optional, comma separated)
     *   ?building=Building 1       (optional, name)
     *   ?search=text               (optional, report number / property / description)
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'max:100'],
            'building' => ['nullable', 'string', 'max:255'],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $statuses = collect(explode(',', $validated['status'] ?? ''))
            ->map(fn ($status) => trim($status))
            ->filter()
            ->values();

        $reports = DamageReport::query()
            ->with(['building:id,name', 'room:id,name', 'user:id,name,email,contact_number'])
            ->withCount('photos')
            ->when($statuses->isNotEmpty(), fn ($q) => $q->whereIn('status', $statuses))
            ->when(
                ! empty($validated['building']),
                fn ($q) => $q->whereHas(
                    'building',
                    fn ($b) => $b->where('name', $validated['building'])
                )
            )
            ->when(
                ! empty($validated['search']),
                function ($q) use ($validated) {
                    $term = '%' . $validated['search'] . '%';

                    $q->where(function ($inner) use ($term) {
                        $inner->where('report_number', 'like', $term)
                            ->orWhere('property_name', 'like', $term)
                            ->orWhere('description', 'like', $term);
                    });
                }
            )
            ->latest()
            ->get()
            ->map(fn (DamageReport $report) => $report->toApiArray() + [
                'photos_count' => $report->photos_count,
            ]);

        return response()->json([
            'message' => 'Reports loaded successfully.',
            'data' => $reports,
        ]);
    }

    /**
     * GET /api/admin/reports/{report}
     */
    public function show(DamageReport $report): JsonResponse
    {
        $report->load(['photos', 'repairUpdates.maintenanceUser:id,name']);

        return response()->json(['data' => $report->toApiArray(true)]);
    }

    /**
     * PATCH /api/admin/reports/{report}
     *
     * Body: { "status": "verified" | "in_progress" | "completed" | "rejected",
     *         "notes": "optional" }
     */
    public function update(Request $request, DamageReport $report): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'required',
                'string',
                Rule::in(array_keys(self::NOTIFICATIONS)),
            ],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $next = $validated['status'];
        $allowed = self::TRANSITIONS[$report->status] ?? [];

        if (! in_array($next, $allowed, true)) {
            $message = $allowed === []
                ? 'This report is already closed (' . $report->status . ') and can no longer be changed.'
                : 'This report is "' . $report->status . '". The next allowed step is: ' . implode(' or ', $allowed) . '.';

            throw ValidationException::withMessages(['status' => [$message]]);
        }

        DB::transaction(function () use ($report, $next, $validated, $request) {
            $report->update(['status' => $next]);

            $report->repairUpdates()->create([
                'maintenance_user_id' => $request->user()->id,
                'status' => $next,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        if ($report->user) {
            [$title, $body] = self::NOTIFICATIONS[$next];

            Notifier::notify(
                $report->user,
                $title,
                sprintf($body, $report->report_number),
                'status_updated',
                $report
            );
        }

        $report->refresh()->load(['photos', 'repairUpdates.maintenanceUser:id,name']);

        return response()->json([
            'message' => 'Report status updated.',
            'data' => $report->toApiArray(true),
        ]);
    }
}
