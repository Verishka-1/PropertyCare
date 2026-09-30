<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportHistoryController extends Controller
{
     public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $reports = DB::table('damage_reports as dr')
            ->leftJoin('buildings as b', 'b.id', '=', 'dr.building_id')
            ->leftJoin('rooms as r', 'r.id', '=', 'dr.room_id')
            ->where('dr.user_id', $user->id)
            ->where('dr.status', 'completed')
            ->orderByDesc('dr.created_at')
            ->select([
                'dr.id',
                'dr.report_number',
                'dr.property_name as title',
                'b.name as building_name',
                'r.name as room_name',
                'dr.status',
                'dr.created_at',
            ])
            ->get();

        return response()->json([
            'data' => $reports,
        ]);
    }
}