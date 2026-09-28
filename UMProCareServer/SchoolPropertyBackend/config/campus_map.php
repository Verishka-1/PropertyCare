<?php

/**
 * Canonical campus location data.
 *
 * This is the single source of truth for building/room names used by:
 *  - database/seeders/BuildingSeeder.php  (creates the Building/Room rows
 *    that power the "Select Room" list screen via /api/locations)
 *  - App\Http\Controllers\Api\AdminMapController (counts reports per
 *    campus pin for the admin map screens)
 *
 * The exact spelling of every name here MUST match what the mobile
 * app's map screens actually send as building_name/room_name
 * (see src/app/user/building-map.tsx and src/data/campusHotspots.ts).
 * If you rename a room/building on the map screens, update it here too.
 */
return [

    // Standalone facilities on the main campus map. Each one has no
    // sub-rooms of its own - the facility name is used as both the
    // "building" and the "room" when a report is filed there.
    'facilities' => [
        'storage-house' => 'Storage House',
        'parking-area' => 'Parking Area',
        'guard-house' => 'GuardHouse',
        'canteen' => 'Canteen',
        'radio-house' => 'Radio House',
        'cashier' => 'Cashier',
        'meeting-room' => 'Meeting Room',
        'library' => 'Library',
        'ict-room' => 'ICT Room',
        'physics-lab' => 'Physics Lab',
        'chem-lab' => 'Chem Lab',
        'courtyard' => 'Courtyard',
        'faculty' => 'Faculty',
        'drawing-room-1' => 'Drawing Room 1',
        'drawing-room-2' => 'Drawing Room 2',
        'male-cr1' => 'Male CR1',
        'female-cr1' => 'Female CR1',
        'female-cr2' => 'Female CR2',
        'male-cr2' => 'Male CR2',
        'male-cr3' => 'Male CR3',
        'female-cr3' => 'Female CR3',
        'rv1' => 'RV1',
        'rv2' => 'RV2',
        'rv3' => 'RV3',
        'rv4' => 'RV4',
    ],

    // Multi-floor buildings, each with its own floor plan and rooms.
    // Keys/room order follow the floor plan images (3rd floor down to 1st).
    'buildings' => [
        'building1' => [
            'name' => 'Building 1',
            'rooms' => ['Br202', 'Br201', 'Br200', 'Br103', 'Br102', 'Br101', 'Br010', 'Br011', 'Br012'],
        ],
        'building2' => [
            'name' => 'Building 2',
            'rooms' => [
                'Br312', 'Br313', 'Br314', 'Br315', 'Br316', 'Br317',
                'Br211', 'Br210', 'Br209', 'Br208', 'Br207', 'Br206',
                'Br111', 'Br110', 'Br109', 'Br108', 'Br107', 'Br106',
            ],
        ],
        'buildingCR' => [
            'name' => 'Building CR',
            'rooms' => ['Female CR3', 'Male CR3', 'Female CR2', 'Male CR2', 'Female CR1', 'Male CR1'],
        ],
        'oldBuilding' => [
            'name' => 'Old Building',
            'rooms' => ['RV302', 'RV301', 'AVR', 'ComLabV2', 'ComLabV1', 'ComLabV3', 'Electrical Lab', 'Engineering Lab'],
        ],
    ],
];
