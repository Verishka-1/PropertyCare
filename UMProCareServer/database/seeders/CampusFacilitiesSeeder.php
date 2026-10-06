<?php

namespace Database\Seeders;

use App\Models\Building;
use Illuminate\Database\Seeder;

/**
 * Seeds the single "Campus Facilities" building. Every standalone campus
 * location (Library, Canteen, Clinic, RV rooms, comfort rooms ...) becomes
 * a room under it - exactly how the campus map reports them.
 *
 * Data comes from config/campus_map.php ('facilities').
 */
class CampusFacilitiesSeeder extends Seeder
{
    public function run(): void
    {
        $group = config('campus_map.facilities_building');

        $building = Building::updateOrCreate(
            ['building_id' => $group['key']],
            ['name' => $group['name'], 'is_active' => true]
        );

        foreach (config('campus_map.facilities') as $roomKey => $roomName) {
            $building->rooms()->updateOrCreate(
                ['room_id' => $roomKey],
                ['name' => $roomName, 'is_active' => true]
            );
        }
    }
}
