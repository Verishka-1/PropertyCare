<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Building;

class LocationController extends Controller
{
    public function index()
    {
        $buildings = Building::query()
            ->with(['rooms:id,building_id,name'])
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json([
            'data' => $buildings,
        ]);
    }
}