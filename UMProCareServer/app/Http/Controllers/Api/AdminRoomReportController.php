<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DamageReport;
use Illuminate\Http\Request;

class AdminRoomReportController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->role === 'admin', 403);

        $validated = $request->validate([
            'building' => ['nullable', 'string', 'max:255'],
            'room' => ['nullable', 'string', 'max:255'],
        ]);

        $reports = DamageReport::query()
            ->when(
                !empty($validated['building']),
                fn ($query) => $query->where(
                    'building_name',
                    $validated['building']
                )
            )
            ->when(
                !empty($validated['room']),
                fn ($query) => $query->where(
                    'room_name',
                    $validated['room']
                )
            )
            ->latest()
            ->get([
                'id',
                'report_number',
                'title',
                'description',
                'building_name',
                'room_name',
                'status',
                'created_at',
            ]);

        return response()->json([
            'data' => $reports,
        ]);
    }
}