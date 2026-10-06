<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Building;

class LocationController extends Controller
{
    /**
     * GET /api/locations
     * Buildings with their rooms, for the "Select Room" list screen.
     */
    public function index()
    {
        $buildings = Building::query()
            ->where('is_active', true)
            ->with(['rooms' => fn ($rooms) => $rooms
                ->where('is_active', true)
                ->orderBy('id')
                ->select('id', 'building_id', 'name')])
            ->orderBy('id')
            ->get(['id', 'name']);

        return response()->json(['data' => $buildings]);
    }
}
