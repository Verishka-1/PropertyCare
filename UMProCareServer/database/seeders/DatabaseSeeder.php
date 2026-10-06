<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Run with:  php artisan migrate:fresh --seed
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,        // the one admin account
            BuildingSeeder::class,         // Building 1, Building 2, Building CR, Old Building
            CampusFacilitiesSeeder::class, // Library, Canteen, Clinic, RV rooms ...
        ]);
    }
}
