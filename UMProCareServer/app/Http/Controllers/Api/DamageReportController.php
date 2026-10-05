<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DamageReport;
use App\Notifications\NewDamageReportNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DamageReportController extends Controller
{
    /**
     * POST /api/reports
     *
     * Accepts building_name, room_name, description, optional
     * property_name, and up to 5 photos.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'building_name' => ['required', 'string', 'max:255'],
            'room_name' => ['required', 'string', 'max:255'],
            'property_name' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['nullable', 'in:low,medium,high'],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['image', 'max:8192'],
        ]);

        // Find the selected building by its display name.
        $building = DB::table('buildings')
            ->where('name', $validated['building_name'])
            ->where('is_active', true)
            ->first();

        if (!$building) {
            throw ValidationException::withMessages([
                'building_name' => ['The selected building was not found.'],
            ]);
        }

        // Find the room within the selected building.
        $room = DB::table('rooms')
            ->where('building_id', $building->id)
            ->where('name', $validated['room_name'])
            ->where('is_active', true)
            ->first();

        if (!$room) {
            throw ValidationException::withMessages([
                'room_name' => [
                    'The selected room was not found in this building.',
                ],
            ]);
        }

        // Create the damage report.
        $report = DamageReport::create([
            'report_number' => 'RPT-' . now()->format('Ymd') . '-'
                . Str::upper(Str::random(6)),
            'user_id' => $request->user()->id,
            'building_id' => $building->id,
            'room_id' => $room->id,
            'property_name' => $validated['property_name']
                ?? 'Unspecified property',
            'description' => $validated['description'],
            'status' => 'pending',
            'priority' => $validated['priority'] ?? 'medium',
            'reported_at' => now(),
        ]);

        // Save uploaded photos.
        foreach ($request->file('photos', []) as $photo) {
            $path = $photo->store('damage-reports', 'public');

            $report->photos()->create([
                'photo_path' => $path,
            ]);
        }

        // Load the user relationship for the notification.
        $report->load('user');

        // Notify all admins about the new damage report.
        (new NewDamageReportNotification($report))->send();

        return response()->json([
            'message' => 'Report submitted successfully.',
            'report' => $report->load('photos'),
        ], 201);
    }
}