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
            ->withCount('photos')
            ->latest()
            ->get()
            ->map(function (DamageReport $report) {
                return $report->toApiArray() + [
                    'photos_count' => $report->photos_count,
                ];
            });

        return response()->json(['data' => $reports]);
    }

    /**
     * GET /api/my/reports/{report}
     *
     * Full detail (photos + progress updates) for the "track my report"
     * screen. Only the reporting user may open their own report.
     */
    public function show(Request $request, $id)
    {
        $report = DamageReport::with(['photos', 'repairUpdates'])
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($report->toApiArray(true));
    }
}
