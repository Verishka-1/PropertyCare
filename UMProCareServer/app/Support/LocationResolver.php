<?php

namespace App\Support;

use App\Models\Building;
use App\Models\Room;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Turns the building / room NAMES sent by the mobile app into database rows.
 *
 *  - matching ignores upper/lower case and extra spaces
 *  - if the building or room is part of config/campus_map.php but is missing
 *    from the database (for example the seeder was never run), it is created
 *    on the spot, so the user never sees "building does not exist".
 *  - anything that is NOT part of the campus config is rejected.
 */
class LocationResolver
{
    /** Old / alternative labels -> the canonical building name. */
    private const BUILDING_ALIASES = [
        'building crs' => 'Building CR',
        'building cr' => 'Building CR',
        'campus facility' => 'Campus Facilities',
    ];

    /**
     * @return array{0: Building, 1: Room}
     */
    public static function resolve(string $buildingName, string $roomName): array
    {
        $building = static::findBuilding($buildingName);

        if (! $building) {
            throw ValidationException::withMessages([
                'building_name' => ["The building \"{$buildingName}\" was not found."],
            ]);
        }

        $room = static::findRoom($building, $roomName);

        if (! $room) {
            throw ValidationException::withMessages([
                'room_name' => ["The room \"{$roomName}\" was not found in {$building->name}."],
            ]);
        }

        return [$building, $room];
    }

    public static function norm(string $value): string
    {
        return Str::lower(trim(preg_replace('/\s+/', ' ', $value) ?? ''));
    }

    private static function findBuilding(string $name): ?Building
    {
        $key = static::norm($name);
        $key = static::norm(self::BUILDING_ALIASES[$key] ?? $name);

        $building = Building::query()
            ->where('is_active', true)
            ->get()
            ->first(fn (Building $b) => static::norm($b->name) === $key
                || static::norm($b->building_id) === $key);

        if ($building) {
            return $building;
        }

        // Not in the database - is it a known campus building?
        foreach (config('campus_map.buildings') as $buildingKey => $data) {
            if (static::norm($data['name']) === $key || static::norm($buildingKey) === $key) {
                return Building::updateOrCreate(
                    ['building_id' => $buildingKey],
                    ['name' => $data['name'], 'is_active' => true]
                );
            }
        }

        $group = config('campus_map.facilities_building');

        if (static::norm($group['name']) === $key || static::norm($group['key']) === $key) {
            return Building::updateOrCreate(
                ['building_id' => $group['key']],
                ['name' => $group['name'], 'is_active' => true]
            );
        }

        return null;
    }

    private static function findRoom(Building $building, string $name): ?Room
    {
        $key = static::norm($name);

        $room = Room::query()
            ->where('building_id', $building->id)
            ->where('is_active', true)
            ->get()
            ->first(fn (Room $r) => static::norm($r->name) === $key
                || static::norm($r->room_id) === $key);

        if ($room) {
            return $room;
        }

        // Not in the database - is it a known room of this building?
        $knownRooms = static::knownRoomsFor($building);

        foreach ($knownRooms as $roomKey => $roomName) {
            if (static::norm($roomName) === $key || static::norm($roomKey) === $key) {
                return Room::updateOrCreate(
                    ['building_id' => $building->id, 'room_id' => $roomKey],
                    ['name' => $roomName, 'is_active' => true]
                );
            }
        }

        return null;
    }

    /**
     * @return array<string, string>  room_id => room name
     */
    private static function knownRoomsFor(Building $building): array
    {
        $group = config('campus_map.facilities_building');

        if ($building->building_id === $group['key']) {
            return config('campus_map.facilities');
        }

        $data = config('campus_map.buildings.' . $building->building_id);

        if (! $data) {
            return [];
        }

        $rooms = [];
        foreach ($data['rooms'] as $roomName) {
            $rooms[Str::slug($roomName)] = $roomName;
        }

        return $rooms;
    }
}
