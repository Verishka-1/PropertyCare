<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DamageReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MyReportsController extends Controller
{
    /**
     * GET /api/my/reports
     *
     * The signed-in user's own reports, newest first.
     */
    public function index(Request $request)
    {
        $reports = DamageReport::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->withCount('photos')
            ->get([
                'id',
                'report_number',
                'title',
                'building_name',
                'room_name',
                'status',
                'created_at',
            ]);

        return response()->json([
            'data' => $reports,
        ]);
    }

    /**
     * GET /api/my/reports/{report}
     *
     * Full detail + photo + status-history view for the "track my
     * report" screen. Only the reporting user may view their own report.
     */
    public function show($id)
{
    $report = DamageReport::with([
        'building',
        'room',
        'photos',
    ])
    ->where('user_id', Auth::id())
    ->findOrFail($id);

    return response()->json([
        'id' => $report->id,
        'report_number' => $report->report_number,

        'building_id' => $report->building_id,
        'room_id' => $report->room_id,

        'building_name' => $report->building?->name,
        'room_name' => $report->room?->name,

        'property_name' => $report->property_name,
        'description' => $report->description,
        'priority' => $report->priority,
        'status' => $report->status,
        'reported_at' => $report->reported_at,
        'created_at' => $report->created_at,

        'photos' => $report->photos,
    ]);
}
}
