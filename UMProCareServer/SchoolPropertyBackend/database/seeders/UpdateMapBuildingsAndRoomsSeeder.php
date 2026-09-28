<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UpdateMapBuildingsAndRoomsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $mapBuildings = [
            [
                'building_id' => 'building1',
                'name' => 'Building 1',
                'rooms' => [
                    '3rd Floor' => ['B1 309', 'B1 310', 'B1 311', 'B1 312'],
                    '2nd Floor' => ['B1 205', 'B1 206', 'B1 207', 'B1 208'],
                    '1st Floor' => ['B1 101', 'B1 102', 'B1 103', 'B1 104'],
                ],
            ],
            [
                'building_id' => 'building2',
                'name' => 'Building 2',
                'rooms' => [
                    '3rd Floor' => [
                        'B2 313', 'B2 314', 'B2 315',
                        'B2 316', 'B2 317', 'B2 318',
                    ],
                    '2nd Floor' => [
                        'B2 212', 'B2 211', 'B2 210',
                        'B2 209', 'B2 208', 'B2 207',
                    ],
                    '1st Floor' => [
                        'B2 101', 'B2 102', 'B2 103',
                        'B2 104', 'B2 105', 'B2 106',
                    ],
                ],
            ],
        ];

        foreach ($mapBuildings as $buildingData) {
            DB::table('buildings')->updateOrInsert(
                ['building_id' => $buildingData['building_id']],
                [
                    'name' => $buildingData['name'],
                    'is_active' => true,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );

            $building = DB::table('buildings')
                ->where('building_id', $buildingData['building_id'])
                ->first();

            foreach ($buildingData['rooms'] as $floor => $roomNames) {
                foreach ($roomNames as $roomName) {
                    // Stable room key; room name remains the map label.
                    $roomKey = strtolower(
                        preg_replace('/[^a-zA-Z0-9]+/', '-', $roomName)
                    );

                    DB::table('rooms')->updateOrInsert(
                        [
                            'building_id' => $building->id,
                            'room_id' => $roomKey,
                        ],
                        [
                            'name' => $roomName,
                            'is_active' => true,
                            'updated_at' => $now,
                            'created_at' => $now,
                        ]
                    );
                }
            }
        }
    }
}