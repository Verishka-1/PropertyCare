<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DamageReport;
use Illuminate\Http\Request;

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
    public function show(Request $request, DamageReport $report)
    {
        abort_unless($report->user_id === $request->user()->id, 403);

        return response()->json([
            'data' => $report->load(['photos', 'repairUpdates']),
        ]);
    }
}
