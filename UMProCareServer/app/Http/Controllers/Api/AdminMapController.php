<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminMapController extends Controller
{
    /**
     * A report is ACTIVE on the maps unless it is:
     *
     * - Completed
     * - Rejected
     *
     * Therefore:
     *
     * Pending      = COUNT
     * Verified     = COUNT
     * For Repair   = COUNT
     * Repaired     = COUNT
     * Any future   = COUNT
     *
     * Completed    = NOT COUNTED
     * Rejected     = NOT COUNTED
     */
    private function activeReportCondition($query, string $column = 'damage_reports.status')
    {
        return $query->whereRaw(
            "LOWER(TRIM(COALESCE($column, ''))) NOT IN (?, ?)",
            [
                'rejected',
                'completed',
            ]
        );
    }

    /**
     * Normalize a room name for comparison.
     *
     * Examples:
     *
     * B1 309          -> 309
     * B2 313          -> 313
     * RV302           -> 302
     * COMLAB - V2     -> comlabv2
     * ComLabV2        -> comlabv2
     * Female CR3      -> femalecr3
     */
    private function normalizeRoomName(string $value): string
    {
        $value = strtolower(trim($value));

        /*
         * Remove Building 1 / Building 2 prefixes.
         *
         * B1 309 -> 309
         * B2 309 -> 309
         */
        $value = preg_replace(
            '/^b(?:1|2)\s*/i',
            '',
            $value
        );

        /*
         * Remove RV prefix used by the Old Building
         *
         * RV302 -> 302
         */
        $value = preg_replace(
            '/^rv\s*/i',
            '',
            $value
        );

        /*
         * Remove spaces, hyphens, underscores,
         * punctuation, etc.
         */
        return preg_replace(
            '/[^a-z0-9]/',
            '',
            $value
        ) ?? '';
    }

    /**
     * Resolve the frontend building ID to the
     * actual database building.
     */
    private function resolveBuilding(?string $requestedBuilding)
    {
        if (!$requestedBuilding) {
            return null;
        }

        $requestedBuilding = trim($requestedBuilding);

        if ($requestedBuilding === '') {
            return null;
        }

        $map = config('campus_map.buildings', []);

        /*
         * ---------------------------------------------------------
         * 1. Frontend config ID
         * ---------------------------------------------------------
         *
         * Example:
         *
         * building1
         * building2
         * oldBuilding
         * buildingCR
         */
        if (
            isset($map[$requestedBuilding]) &&
            isset($map[$requestedBuilding]['name'])
        ) {
            $buildingName = trim(
                (string) $map[$requestedBuilding]['name']
            );

            $building = DB::table('buildings')
                ->whereRaw(
                    'LOWER(TRIM(name)) = LOWER(TRIM(?))',
                    [$buildingName]
                )
                ->where('is_active', true)
                ->first();

            if ($building) {
                return $building;
            }
        }

        /*
         * ---------------------------------------------------------
         * 2. Case-insensitive building name
         * ---------------------------------------------------------
         */
        $building = DB::table('buildings')
            ->whereRaw(
                'LOWER(TRIM(name)) = LOWER(TRIM(?))',
                [$requestedBuilding]
            )
            ->where('is_active', true)
            ->first();

        if ($building) {
            return $building;
        }

        /*
         * ---------------------------------------------------------
         * 3. Database building_id
         * ---------------------------------------------------------
         *
         * This supports cases where frontend sends the
         * actual building_id stored in the database.
         */
        $building = DB::table('buildings')
            ->whereRaw(
                'LOWER(TRIM(building_id)) = LOWER(TRIM(?))',
                [$requestedBuilding]
            )
            ->where('is_active', true)
            ->first();

        return $building;
    }

    /**
     * -------------------------------------------------------------
     * CAMPUS REPORT MAP
     * -------------------------------------------------------------
     *
     * Returns active report count for every building.
     */
    public function campusCounts(): JsonResponse
    {
        /*
         * Get all active buildings first.
         */
        $buildings = DB::table('buildings')
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        $buildingCounts = [];

        $buildingData = [];

        /*
         * Get active report counts grouped by building ID.
         *
         * IMPORTANT:
         * Only Completed and Rejected are excluded.
         */
        $reportCounts = DB::table('damage_reports')
            ->whereRaw(
                "LOWER(TRIM(COALESCE(damage_reports.status, ''))) NOT IN (?, ?)",
                [
                    'rejected',
                    'completed',
                ]
            )
            ->whereNotNull('damage_reports.building_id')
            ->select(
                'damage_reports.building_id',
                DB::raw(
                    'COUNT(damage_reports.id) as report_count'
                )
            )
            ->groupBy('damage_reports.building_id')
            ->get()
            ->keyBy(function ($row) {
                return (string) $row->building_id;
            });

        /*
         * Campus map configuration.
         *
         * Used to connect:
         *
         * building1
         * building2
         * oldBuilding
         *
         * to their database building.
         */
        $map = config('campus_map.buildings', []);

        foreach ($buildings as $building) {
            $count =
                isset(
                    $reportCounts[
                        (string) $building->id
                    ]
                )
                    ? (int) $reportCounts[
                        (string) $building->id
                    ]->report_count
                    : 0;

            /*
             * Database numeric ID.
             */
            $buildingCounts[
                (string) $building->id
            ] = $count;

            /*
             * Database building_id.
             */
            if (!empty($building->building_id)) {
                $buildingCounts[
                    (string) $building->building_id
                ] = $count;
            }

            /*
             * Return building information.
             */
            $buildingData[] = [
                'id' => (int) $building->id,

                'building_id' =>
                    $building->building_id,

                'name' =>
                    $building->name,

                'report_count' =>
                    $count,
            ];
        }

        /*
         * ---------------------------------------------------------
         * IMPORTANT:
         * Add counts using the FRONTEND map IDs.
         * ---------------------------------------------------------
         *
         * This prevents:
         *
         * building1 != numeric database ID
         * building2 != numeric database ID
         * oldBuilding != database building_id
         */
        foreach ($map as $frontendId => $configBuilding) {
            if (
                !isset($configBuilding['name'])
            ) {
                continue;
            }

            $buildingName = trim(
                (string) $configBuilding['name']
            );

            $building = $buildings->first(
                function ($item) use ($buildingName) {
                    return strcasecmp(
                        trim((string) $item->name),
                        $buildingName
                    ) === 0;
                }
            );

            if (!$building) {
                $buildingCounts[
                    (string) $frontendId
                ] = 0;

                continue;
            }

            $count =
                isset(
                    $reportCounts[
                        (string) $building->id
                    ]
                )
                    ? (int) $reportCounts[
                        (string) $building->id
                    ]->report_count
                    : 0;

            $buildingCounts[
                (string) $frontendId
            ] = $count;
        }

        return response()->json([
            'building_counts' =>
                $buildingCounts,

            'buildings' =>
                $buildingData,
        ]);
    }

    /**
     * -------------------------------------------------------------
     * BUILDING REPORT MAP
     * -------------------------------------------------------------
     *
     * Returns active report counts for every room.
     */
    public function buildingCounts(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'building' => [
                'required',
                'string',
                'max:255',
            ],
        ]);

        $requestedBuilding =
            trim(
                (string) $validated['building']
            );

        /*
         * Resolve frontend building ID.
         */
        $building =
            $this->resolveBuilding(
                $requestedBuilding
            );

        if (!$building) {
            return response()->json([
                'building' =>
                    $requestedBuilding,

                'building_id' =>
                    null,

                'room_counts' =>
                    [],

                'room_counts_by_name' =>
                    [],
            ]);
        }

        /*
         * ---------------------------------------------------------
         * Get ACTIVE report counts.
         * ---------------------------------------------------------
         *
         * We group by the actual database room.
         *
         * This is much safer than grouping by room name.
         */
        $roomCounts = DB::table('rooms')
            ->leftJoin(
                'damage_reports',
                function ($join) {
                    $join->on(
                        'damage_reports.room_id',
                        '=',
                        'rooms.id'
                    );

                    /*
                     * ONLY Completed and Rejected
                     * are excluded.
                     */
                    $join->whereRaw(
                        "LOWER(TRIM(COALESCE(damage_reports.status, ''))) NOT IN (?, ?)",
                        [
                            'rejected',
                            'completed',
                        ]
                    );
                }
            )
            ->where(
                'rooms.building_id',
                $building->id
            )
            ->where(
                'rooms.is_active',
                true
            )
            ->select(
                'rooms.id as room_id',
                'rooms.room_id as room_identifier',
                'rooms.name as room_name',
                DB::raw(
                    'COUNT(damage_reports.id) as report_count'
                )
            )
            ->groupBy(
                'rooms.id',
                'rooms.room_id',
                'rooms.name'
            )
            ->orderBy('rooms.id')
            ->get();

        /*
         * ---------------------------------------------------------
         * Build response maps.
         * ---------------------------------------------------------
         */
        $roomCountsById = [];

        $roomCountsByName = [];

        $rooms = [];

        foreach ($roomCounts as $room) {
            $count =
                (int) $room->report_count;

            /*
             * Numeric DB room ID.
             */
            $roomCountsById[
                (string) $room->room_id
            ] = $count;

            /*
             * Actual room_id string.
             *
             * Example:
             *
             * R-101
             * old-302
             */
            if (
                !empty(
                    $room->room_identifier
                )
            ) {
                $roomCountsById[
                    (string) $room->room_identifier
                ] = $count;
            }

            /*
             * Actual database room name.
             */
            if (
                !empty($room->room_name)
            ) {
                $roomCountsByName[
                    (string) $room->room_name
                ] = $count;

                /*
                 * ALSO store normalized room name.
                 *
                 * This allows:
                 *
                 * B1 309 -> 309
                 * RV302 -> 302
                 * COMLAB - V2 -> comlabv2
                 */
                $normalized =
                    $this->normalizeRoomName(
                        (string) $room->room_name
                    );

                if ($normalized !== '') {
                    $roomCountsByName[
                        $normalized
                    ] = $count;
                }
            }

            $rooms[] = [
                'id' =>
                    (int) $room->room_id,

                'room_id' =>
                    $room->room_identifier,

                'name' =>
                    $room->room_name,

                'report_count' =>
                    $count,
            ];
        }

        /*
         * ---------------------------------------------------------
         * Return everything the frontend can use.
         * ---------------------------------------------------------
         */
        return response()->json([
            'building' =>
                $building->name,

            'building_id' =>
                (int) $building->id,

            'room_counts' =>
                $roomCountsById,

            'room_counts_by_name' =>
                $roomCountsByName,

            'rooms' =>
                $rooms,
        ]);
    }

    /**
     * -------------------------------------------------------------
     * ROOM REPORTS
     * -------------------------------------------------------------
     *
     * This endpoint intentionally returns ALL reports.
     *
     * Completed and Rejected must remain visible
     * in report history.
     */
    public function roomReports(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'building' => [
                'nullable',
                'string',
                'max:255',
            ],

            'room' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $requestedBuilding =
            trim(
                (string) (
                    $validated['building'] ?? ''
                )
            );

        $building = null;

        if (
            $requestedBuilding !== ''
        ) {
            $building =
                $this->resolveBuilding(
                    $requestedBuilding
                );

            if (!$building) {
                return response()->json([
                    'building' =>
                        $requestedBuilding,

                    'building_id' =>
                        null,

                    'room' =>
                        $validated['room'] ?? null,

                    'data' =>
                        [],
                ]);
            }
        }

        /*
         * ALL statuses are returned here.
         */
        $reports = DB::table(
            'damage_reports'
        )
            ->join(
                'buildings',
                'damage_reports.building_id',
                '=',
                'buildings.id'
            )
            ->leftJoin(
                'rooms',
                'damage_reports.room_id',
                '=',
                'rooms.id'
            )
            ->when(
                $building,
                function ($query) use ($building) {
                    $query->where(
                        'damage_reports.building_id',
                        $building->id
                    );
                }
            )
            ->when(
                !empty(
                    $validated['room']
                ),
                function ($query) use (
                    $validated
                ) {
                    $room =
                        trim(
                            (string) $validated['room']
                        );

                    /*
                     * Match either:
                     *
                     * room name
                     * room_id
                     */
                    $query->where(
                        function ($subQuery) use (
                            $room
                        ) {
                            $subQuery
                                ->where(
                                    'rooms.name',
                                    $room
                                )
                                ->orWhere(
                                    'rooms.room_id',
                                    $room
                                );
                        }
                    );
                }
            )
            ->latest(
                'damage_reports.created_at'
            )
            ->get([
                'damage_reports.id',

                'damage_reports.report_number',

                'damage_reports.property_name',

                'damage_reports.description',

                'buildings.name as building_name',

                'rooms.name as room_name',

                'rooms.room_id as room_identifier',

                'damage_reports.status',

                'damage_reports.priority',

                'damage_reports.reported_at',

                'damage_reports.created_at',
            ]);

        return response()->json([
            'building' =>
                $building
                    ? $building->name
                    : null,

            'building_id' =>
                $building
                    ? (int) $building->id
                    : null,

            'room' =>
                $validated['room'] ?? null,

            'data' =>
                $reports,
        ]);
    }

    /**
     * -------------------------------------------------------------
     * COMPATIBILITY COUNTS ENDPOINT
     * -------------------------------------------------------------
     */
    public function counts(): JsonResponse
    {
        $map =
            config(
                'campus_map',
                []
            );

        $counts = [];

        foreach (
            array_keys(
                $map['facilities'] ?? []
            ) as $id
        ) {
            $counts[$id] = 0;
        }

        foreach (
            array_keys(
                $map['buildings'] ?? []
            ) as $id
        ) {
            $counts[$id] = 0;
        }

        /*
         * Get active reports.
         */
        $reports = DB::table(
            'damage_reports'
        )
            ->join(
                'buildings',
                'damage_reports.building_id',
                '=',
                'buildings.id'
            )
            ->whereRaw(
                "LOWER(TRIM(COALESCE(damage_reports.status, ''))) NOT IN (?, ?)",
                [
                    'rejected',
                    'completed',
                ]
            )
            ->select(
                'damage_reports.id',
                'buildings.name as building_name'
            )
            ->get();

        /*
         * Match reports to configured buildings.
         */
        foreach ($reports as $report) {
            $buildingName =
                trim(
                    (string)
                    $report->building_name
                );

            foreach (
                $map['buildings'] ?? []
                as $id => $building
            ) {
                if (
                    isset(
                        $building['name']
                    ) &&
                    strcasecmp(
                        $buildingName,
                        trim(
                            (string)
                            $building['name']
                        )
                    ) === 0
                ) {
                    $counts[$id] =
                        ($counts[$id] ?? 0) + 1;

                    continue 2;
                }
            }

            foreach (
                $map['facilities'] ?? []
                as $id => $name
            ) {
                if (
                    strcasecmp(
                        $buildingName,
                        trim(
                            (string) $name
                        )
                    ) === 0
                ) {
                    $counts[$id] =
                        ($counts[$id] ?? 0) + 1;

                    continue 2;
                }
            }
        }

        return response()->json([
            'counts' =>
                $counts,
        ]);
    }
}