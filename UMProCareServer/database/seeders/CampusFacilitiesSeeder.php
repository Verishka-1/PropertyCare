<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CampusFacilitiesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        /*
         * =========================================================
         * CAMPUS FACILITIES BUILDING
         * =========================================================
         *
         * We create ONE building record:
         *
         * Campus Facilities
         *
         * Every facility becomes a room under this building.
         */

        DB::table('buildings')->updateOrInsert(
            [
                'building_id' => 'campus-facilities',
            ],
            [
                'name' => 'Campus Facilities',
                'map_image' => null,
                'is_active' => true,
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        $campusFacilities = DB::table('buildings')
            ->where('building_id', 'campus-facilities')
            ->first();

        if (!$campusFacilities) {
            throw new \RuntimeException(
                'Campus Facilities building could not be created.'
            );
        }

        /*
         * =========================================================
         * FACILITIES
         * =========================================================
         *
         * Each one becomes a room belonging to
         * Campus Facilities.
         */

        $facilities = [
            [
                'room_id' => 'male-cr1',
                'name' => 'Male CR1',
            ],
            [
                'room_id' => 'female-cr1',
                'name' => 'Female CR1',
            ],
            [
                'room_id' => 'rv1',
                'name' => 'RV1',
            ],
            [
                'room_id' => 'physics-lab',
                'name' => 'Physics Lab',
            ],
            [
                'room_id' => 'chem-lab',
                'name' => 'Chem Lab',
            ],
            [
                'room_id' => 'clinic',
                'name' => 'Clinic',
            ],
            [
                'room_id' => 'cashier',
                'name' => 'Cashier',
            ],
            [
                'room_id' => 'osa',
                'name' => 'OSA',
            ],
            [
                'room_id' => 'library',
                'name' => 'Library',
            ],
            [
                'room_id' => 'ict-room',
                'name' => 'ICT Room',
            ],
            [
                'room_id' => 'storage-house',
                'name' => 'Storage House',
            ],
            [
                'room_id' => 'parking-area',
                'name' => 'Parking Area',
            ],
            [
                'room_id' => 'guard-house',
                'name' => 'Guard House',
            ],
            [
                'room_id' => 'canteen',
                'name' => 'Canteen',
            ],
            [
                'room_id' => 'radio-house',
                'name' => 'Radio House',
            ],
            [
                'room_id' => 'courtyard',
                'name' => 'Courtyard',
            ],
            [
                'room_id' => 'female-cr2',
                'name' => 'Female CR2',
            ],
            [
                'room_id' => 'male-cr2',
                'name' => 'Male CR2',
            ],
            [
                'room_id' => 'faculty',
                'name' => 'Faculty',
            ],
            [
                'room_id' => 'guidance-room',
                'name' => 'Guidance Room',
            ],
            [
                'room_id' => 'rv5',
                'name' => 'RV5',
            ],
            [
                'room_id' => 'rv6',
                'name' => 'RV6',
            ],
            [
                'room_id' => 'male-cr3',
                'name' => 'Male CR3',
            ],
            [
                'room_id' => 'female-cr3',
                'name' => 'Female CR3',
            ],
            [
                'room_id' => 'rv2',
                'name' => 'RV2',
            ],
            [
                'room_id' => 'rv3',
                'name' => 'RV3',
            ],
            [
                'room_id' => 'rv4',
                'name' => 'RV4',
            ],
        ];

        foreach ($facilities as $facility) {
            DB::table('rooms')->updateOrInsert(
                [
                    'building_id' => $campusFacilities->id,
                    'room_id' => $facility['room_id'],
                ],
                [
                    'name' => $facility['name'],
                    'is_active' => true,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }
    }
}