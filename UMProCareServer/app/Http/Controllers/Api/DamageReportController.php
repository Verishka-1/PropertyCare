<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DamageReport;
use App\Support\LocationResolver;
use App\Support\Notifier;
use App\Support\PhotoStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DamageReportController extends Controller
{
    /**
     * POST /api/reports
     *
     * Body (JSON):
     *   building_name  "Building 2"
     *   room_name      "B2 313"
     *   description    "..."
     *   photos         ["<base64 jpeg>", ...]   (0-5, optional)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'building_name' => ['required', 'string', 'max:255'],
            'room_name' => ['required', 'string', 'max:255'],
            'property_name' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:2000'],
            'priority' => ['nullable', 'in:low,medium,high'],
            // The photos themselves are validated by PhotoStorage
            // (it checks the real image bytes).
            'photos' => ['nullable', 'array', 'max:' . PhotoStorage::MAX_PHOTOS],
        ]);

        [$building, $room] = LocationResolver::resolve(
            $validated['building_name'],
            $validated['room_name']
        );

        $report = DB::transaction(function () use ($request, $validated, $building, $room) {
            $report = DamageReport::create([
                'report_number' => 'RPT-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6)),
                'user_id' => $request->user()->id,
                'building_id' => $building->id,
                'room_id' => $room->id,
                'property_name' => $validated['property_name']
                    ?? Str::limit(trim($validated['description']), 60),
                'description' => trim($validated['description']),
                'status' => DamageReport::STATUS_PENDING,
                'priority' => $validated['priority'] ?? 'medium',
                'reported_at' => now(),
            ]);

            PhotoStorage::storeFromRequest($request, $report);

            return $report;
        });

        Notifier::notifyAdmins(
            'New damage report',
            sprintf(
                '%s reported damage in %s - %s (%s).',
                $request->user()->name,
                $building->name,
                $room->name,
                $report->report_number
            ),
            'report_submitted',
            $report
        );

        return response()->json([
            'message' => 'Report submitted successfully.',
            'report' => $report->toApiArray(true),
        ], 201);
    }
}
