<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DamageReport;
use Illuminate\Http\Request;

class ReportHistoryController extends Controller
{
    /**
     * GET /api/my/reports/history
     *
     * The user's CLOSED reports: completed (repaired) and rejected.
     * Open reports stay in "My Reports".
     */
    public function index(Request $request)
    {
        $reports = DamageReport::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['completed', 'rejected'])
            ->latest('updated_at')
            ->get()
            ->map(fn (DamageReport $report) => $report->toApiArray());

        return response()->json(['data' => $reports]);
    }
}
