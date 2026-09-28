<?php

namespace Database\Seeders;

use App\Models\Building;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds the buildings/rooms used by:
 *  - GET /api/locations (the "Select Room" list screen)
 *  - the campus + building map screens, indirectly, since the report
 *    building_name/room_name values these produce must line up with
 *    the names defined here.
 *
 * All names come from config/campus_map.php so there is exactly one
 * place to update if a room or building is renamed.
 */
class BuildingSeeder extends Seeder
{
    public function run(): void
    {
        $map = config('campus_map');

        // Multi-floor buildings, each with several real rooms.
        foreach ($map['buildings'] as $buildingKey => $data) {
            $building = Building::updateOrCreate(
                ['building_id' => $buildingKey],
                ['name' => $data['name'], 'is_active' => true]
            );

            foreach ($data['rooms'] as $roomName) {
                $building->rooms()->updateOrCreate(
                    ['room_id' => Str::slug($roomName)],
                    ['name' => $roomName, 'is_active' => true]
                );
            }
        }

        // Standalone facilities (Library, Canteen, comfort rooms, etc.)
        // have no sub-rooms on the map, so we give each one a single
        // room that shares its name - this keeps the "Select Room" flow
        // consistent with tapping the facility directly on the map,
        // which sends the same string for both building_name and
        // room_name.
        foreach ($map['facilities'] as $facilityKey => $facilityName) {
            $building = Building::updateOrCreate(
                ['building_id' => $facilityKey],
                ['name' => $facilityName, 'is_active' => true]
            );

            $building->rooms()->updateOrCreate(
                ['room_id' => $facilityKey],
                ['name' => $facilityName, 'is_active' => true]
            );
        }
    }
}
