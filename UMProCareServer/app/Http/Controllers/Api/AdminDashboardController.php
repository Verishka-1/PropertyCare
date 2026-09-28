<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Check that the request is from an authenticated admin.
     */
    private function authorizeAdmin(Request $request): ?JsonResponse
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.',
            ], 403);
        }

        return null;
    }

    /**
     * GET /api/admin/dashboard
     *
     * Dashboard summary and the five newest pending reports.
     */
    public function index(Request $request): JsonResponse
    {
        if ($response = $this->authorizeAdmin($request)) {
            return $response;
        }

        $totalReports = DB::table('damage_reports')->count();

        $pendingReports = DB::table('damage_reports')
            ->where('status', 'pending')
            ->count();

        $verifiedReports = DB::table('damage_reports')
            ->where('status', 'verified')
            ->count();

        $forRepairReports = DB::table('damage_reports')
            ->where('status', 'for repair')
            ->count();

        $repairedReports = DB::table('damage_reports')
            ->where('status', 'repaired')
            ->count();

        $recentPendingReports = DB::table('damage_reports as dr')
            ->leftJoin('buildings as b', 'b.id', '=', 'dr.building_id')
            ->leftJoin('rooms as r', 'r.id', '=', 'dr.room_id')
            ->where('dr.status', 'pending')
            ->orderByDesc('dr.created_at')
            ->limit(5)
            ->select([
                'dr.id',
                'dr.report_number',
                'dr.property_name',
                'dr.description',
                'dr.priority',
                'dr.status',
                'dr.user_id',
                'dr.created_at',
                'b.name as building_name',
                'r.name as room_name',
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
                    'priority' => $report->priority,
                    'status' => $report->status,
                    'user_id' => $report->user_id,
                    'created_at' => $report->created_at,
                ];
            });

        return response()->json([
            'message' => 'Dashboard loaded successfully.',
            'data' => [
                'total_reports' => $totalReports,
                'pending_reports' => $pendingReports,
                'verified_reports' => $verifiedReports,
                'for_repair_reports' => $forRepairReports,
                'repaired_reports' => $repairedReports,
                'recent_pending_reports' => $recentPendingReports,
            ],
        ]);
    }

    /**
     * GET /api/admin/reports
     *
     * Return all reports for the admin reports list.
     */
    public function reports(Request $request): JsonResponse
    {
        if ($response = $this->authorizeAdmin($request)) {
            return $response;
        }

        $reports = DB::table('damage_reports as dr')
            ->leftJoin('buildings as b', 'b.id', '=', 'dr.building_id')
            ->leftJoin('rooms as r', 'r.id', '=', 'dr.room_id')
            ->orderByDesc('dr.created_at')
            ->select([
                'dr.id',
                'dr.report_number',
                'dr.property_name',
                'b.name as building_name',
                'r.name as room_name',
                'dr.description',
                'dr.status',
                'dr.priority',
                'dr.user_id',
                'dr.created_at',
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
                ];
            });

        return response()->json([
            'message' => 'Reports loaded successfully.',
            'data' => $reports,
        ]);
    }

    /**
     * GET /api/admin/map/room-reports
     *
     * Optional query parameters:
     * - building: building key or building name
     * - room: room key or room name
     * - location: facility/location key or name
     *
     * If building and room are supplied together, both filters apply.
     */
    public function roomReports(Request $request): JsonResponse
    {
        if ($response = $this->authorizeAdmin($request)) {
            return $response;
        }

        $validated = $request->validate([
            'building' => ['nullable', 'string', 'max:255'],
            'room' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $building = $validated['building'] ?? null;
        $room = $validated['room'] ?? null;
        $location = $validated['location'] ?? null;

        $query = DB::table('damage_reports as dr')
            ->leftJoin('buildings as b', 'b.id', '=', 'dr.building_id')
            ->leftJoin('rooms as r', 'r.id', '=', 'dr.room_id')
            ->leftJoin('users as u', 'u.id', '=', 'dr.user_id')
            ->orderByDesc('dr.created_at');

        // Match the building by database ID, stable key, or display name.
if ($building !== null && $building !== '') {
    $query->where(function ($q) use ($building) {
        $q->where('b.building_id', $building)
            ->orWhere('b.name', $building);

        if (is_numeric($building)) {
            $q->orWhere('b.id', (int) $building);
        }
    });
}

// Match the room by database ID, stable key, or display name.
if ($room !== null && $room !== '') {
    $query->where(function ($q) use ($room) {
        $q->where('r.room_id', $room)
            ->orWhere('r.name', $room);

        if (is_numeric($room)) {
            $q->orWhere('r.id', (int) $room);
        }
    });
}

        // Apply location filtering only when building and room weren't provided.
        if (
            ($building === null || $building === '') &&
            ($room === null || $room === '') &&
            $location !== null &&
            $location !== ''
        ) {
            $query->where(function ($q) use ($location) {
                $q->where('b.building_id', $location)
                    ->orWhere('b.name', $location)
                    ->orWhere('r.room_id', $location)
                    ->orWhere('r.name', $location);
            });
        }

        $reports = $query
            ->select([
                'dr.id',
                'dr.report_number',
                'dr.property_name',
                'dr.description',
                'dr.status',
                'dr.priority',
                'dr.user_id',
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
                    'description' => $report->description,
                    'building_name' => $report->building_name ?? 'Unknown building',
                    'room_name' => $report->room_name ?? 'Unknown room',
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
            'message' => 'Room reports loaded successfully.',
            'data' => $reports,
        ]);
    }

    /**
     * GET /api/admin/campus-counts
     *
     * Return report counts for active buildings and active rooms.
     */
    public function campusCounts(Request $request): JsonResponse
    {
        if ($response = $this->authorizeAdmin($request)) {
            return $response;
        }

        $buildings = DB::table('buildings as b')
            ->leftJoin('damage_reports as dr', 'dr.building_id', '=', 'b.id')
            ->where('b.is_active', true)
            ->groupBy(
                'b.id',
                'b.building_id',
                'b.name'
            )
            ->orderBy('b.name')
            ->select([
                'b.id as database_id',
                'b.building_id',
                'b.name as building_name',
            ])
            ->selectRaw('COUNT(dr.id) as report_count')
            ->get();

        $rooms = DB::table('rooms as r')
            ->join('buildings as b', 'b.id', '=', 'r.building_id')
            ->leftJoin('damage_reports as dr', 'dr.room_id', '=', 'r.id')
            ->where('b.is_active', true)
            ->where('r.is_active', true)
            ->groupBy(
                'r.id',
                'r.room_id',
                'r.name',
                'b.building_id',
                'b.name'
            )
            ->orderBy('b.name')
            ->orderBy('r.name')
            ->select([
                'r.id as database_id',
                'r.room_id',
                'r.name as room_name',
                'b.building_id',
                'b.name as building_name',
            ])
            ->selectRaw('COUNT(dr.id) as report_count')
            ->get();

        return response()->json([
            'message' => 'Campus report counts loaded successfully.',
            'data' => [
                'buildings' => $buildings,
                'rooms' => $rooms,
            ],
        ]);
    }
}