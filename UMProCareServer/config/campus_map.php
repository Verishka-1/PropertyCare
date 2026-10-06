<?php

/**
 * Canonical campus location data  (SINGLE SOURCE OF TRUTH)
 *
 * Used by:
 *  - database/seeders/BuildingSeeder.php          -> floor-plan buildings + rooms
 *  - database/seeders/CampusFacilitiesSeeder.php  -> "Campus Facilities" rooms
 *  - App\Support\LocationResolver                 -> self-heals a missing
 *                                                    building/room when a report
 *                                                    is submitted
 *  - AdminMapController                           -> maps frontend ids -> database
 *
 * !! The spelling of every name below MUST match what the mobile app sends
 * !! (src/app/user/building-map.tsx, src/app/admin/admin-building-map.tsx and
 * !! src/data/campusHotspots.ts). If you rename a room on a map screen, rename
 * !! it here too and run:  php artisan db:seed
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Buildings that have their own floor-plan map
    |--------------------------------------------------------------------------
    | key  = id used by the app's maps (building1, building2, oldBuilding...)
    | name = the exact display name the app sends as `building_name`
    */
    'buildings' => [
        'building1' => [
            'name' => 'Building 1',
            'rooms' => [
                // 3rd floor
                'B1 309', 'B1 310', 'B1 311', 'B1 312',
                // 2nd floor
                'B1 205', 'B1 206', 'B1 207', 'B1 208',
                // 1st floor
                'B1 101', 'B1 102', 'B1 103', 'B1 104',
            ],
        ],

        'building2' => [
            'name' => 'Building 2',
            'rooms' => [
                // 3rd floor
                'B2 313', 'B2 314', 'B2 315', 'B2 316', 'B2 317', 'B2 318',
                // 2nd floor
                'B2 212', 'B2 211', 'B2 210', 'B2 209', 'B2 208', 'B2 207',
                // 1st floor
                'B2 101', 'B2 102', 'B2 103', 'B2 104', 'B2 105', 'B2 106',
            ],
        ],

        'buildingCR' => [
            'name' => 'Building CR',
            'rooms' => [
                'Female CR3', 'Male CR3',
                'Female CR2', 'Male CR2',
                'Female CR1', 'Male CR1',
            ],
        ],

        'oldBuilding' => [
            'name' => 'Old Building',
            'rooms' => [
                'RV302', 'RV301', 'AVR',
                'ComLabV2', 'ComLabV1', 'ComLabV3',
                'Electrical Lab', 'Engineering Lab',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Standalone facilities on the campus map
    |--------------------------------------------------------------------------
    | Every facility is stored as a ROOM under one building called
    | "Campus Facilities" (this is what the campus map sends).
    | key = hotspot id on the campus map, value = display name.
    */
    'facilities_building' => [
        'key' => 'campus-facilities',
        'name' => 'Campus Facilities',
    ],

    'facilities' => [
        'male-cr1' => 'Male CR1',
        'female-cr1' => 'Female CR1',
        'rv1' => 'RV1',
        'physics-lab' => 'Physics Lab',
        'chem-lab' => 'Chem Lab',
        'clinic' => 'Clinic',
        'cashier' => 'Cashier',
        'osa' => 'OSA',
        'library' => 'Library',
        'ict-room' => 'ICT Room',
        'storage-house' => 'Storage House',
        'parking-area' => 'Parking Area',
        'guard-house' => 'Guard House',
        'canteen' => 'Canteen',
        'radio-house' => 'Radio House',
        'courtyard' => 'Courtyard',
        'female-cr2' => 'Female CR2',
        'male-cr2' => 'Male CR2',
        'faculty' => 'Faculty',
        'guidance-room' => 'Guidance Room',
        'rv5' => 'RV5',
        'rv6' => 'RV6',
        'male-cr3' => 'Male CR3',
        'female-cr3' => 'Female CR3',
        'rv2' => 'RV2',
        'rv3' => 'RV3',
        'rv4' => 'RV4',
    ],
];
