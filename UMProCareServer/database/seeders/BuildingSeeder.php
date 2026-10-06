<?php

namespace Database\Seeders;

use App\Models\Building;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds the 4 floor-plan buildings and all of their rooms.
 *
 * Data comes from config/campus_map.php ('buildings'), so the names are
 * guaranteed to match what the mobile app's building maps send.
 * Safe to run more than once (updateOrCreate).
 */
class BuildingSeeder extends Seeder
{
    public function run(): void
    {
        foreach (config('campus_map.buildings') as $buildingKey => $data) {
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
    }
}
