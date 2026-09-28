<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // First/last name are what the registration form collects;
            // "name" stays as the combined display name so existing
            // relations (User::name) keep working everywhere else.
            $table->string('first_name');
            $table->string('last_name');
            $table->string('name');

            $table->string('username')->unique();
            $table->string('email')->unique();

            $table->timestamp('email_verified_at')->nullable();

            $table->string('password');

            $table->enum('role', [
                'student',
                'teacher',
                'admin',
                'maintenance',
            ])->default('student');

            // Set by an admin to block a disruptive account without
            // deleting its history of reports.
            $table->boolean('is_banned')->default(false);

            // Expo push token registered by the mobile app so the
            // backend can send real push notifications to this device.
            $table->string('expo_push_token')->nullable();

            $table->rememberToken();

            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->text('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};