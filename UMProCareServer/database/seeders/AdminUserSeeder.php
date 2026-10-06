<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Creates the single built-in admin account.
 *
 *   Email:    Admin@gmail.com
 *   Password: Admin#@123
 *
 * IMPORTANT: change this password before using the system for real.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'Admin@gmail.com'],
            [
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'name' => 'System Administrator',
                'username' => 'admin',
                'password' => Hash::make('Admin#@123'),
                'role' => 'admin',
                'is_banned' => false,
                'email_verified_at' => now(),
            ]
        );
    }
}
