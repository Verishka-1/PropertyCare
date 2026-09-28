<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DamageReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Feeds the admin campus map and per-building map screens with report
 * counts, keyed the same way as config/campus_map.php so the pins on
 * the map line up with real submitted reports.
 */
class AdminMapController extends Controller
{
    /**
     * GET /api/admin/map/counts
     *
     * One count per campus pin (buildings + standalone facilities).
     */
    public function counts(): JsonResponse
    {
        $map = config('campus_map');

        $counts = [];
        foreach (array_keys($map['facilities']) as $id) {
            $counts[$id] = 0;
        }
        foreach (array_keys($map['buildings']) as $id) {
            $counts[$id] = 0;
        }

        $reports = DamageReport::query()->select('building_name', 'room_name')->get();

        foreach ($reports as $report) {
            $buildingName = trim((string) $report->building_name);

            foreach ($map['buildings'] as $id => $building) {
                if (strcasecmp($buildingName, $building['name']) === 0) {
                    $counts[$id]++;
                    continue 2;
                }
            }

            foreach ($map['facilities'] as $id => $name) {
                if (strcasecmp($buildingName, $name) === 0) {
                    $counts[$id]++;
                    continue 2;
                }
            }
        }

        return response()->json(['counts' => $counts]);
    }

    /**
     * GET /api/admin/map/room-reports?building=Building 1&room=Br202
     *
     * Raw report rows for one building (optionally one room) - used by
     * the "reports in this room" list screen.
     */
    public function roomReports(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'building' => ['nullable', 'string', 'max:255'],
            'room' => ['nullable', 'string', 'max:255'],
        ]);

        $reports = DamageReport::query()
            ->when(!empty($validated['building']), fn ($q) => $q->where('building_name', $validated['building']))
            ->when(!empty($validated['room']), fn ($q) => $q->where('room_name', $validated['room']))
            ->latest()
            ->get(['id', 'report_number', 'title', 'description', 'building_name', 'room_name', 'status', 'created_at']);

        return response()->json(['data' => $reports]);
    }

    /**
     * GET /api/admin/building-map/counts?building=building1
     *
     * Per-room report counts for one building's floor plan, e.g.
     * { "Br202": 2, "Br201": 0, ... }. "building" accepts either the
     * map's short id (building1, buildingCR, ...) or the full display
     * name (Building 1, Building CR, ...).
     */
    public function buildingCounts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'building' => ['required', 'string', 'max:255'],
        ]);

        $map = config('campus_map.buildings');
        $requested = $validated['building'];

        $buildingName = $map[$requested]['name'] ?? null;

        if (! $buildingName) {
            foreach ($map as $building) {
                if (strcasecmp($building['name'], $requested) === 0) {
                    $buildingName = $building['name'];
                    break;
                }
            }
        }

        $buildingName ??= $requested;

        $roomCounts = DamageReport::query()
            ->where('building_name', $buildingName)
            ->whereNotNull('room_name')
            ->selectRaw('room_name, COUNT(*) as report_count')
            ->groupBy('room_name')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->room_name => (int) $row->report_count]);

        return response()->json([
            'building' => $buildingName,
            'room_counts' => $roomCounts,
        ]);
    }
}
