<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('damage_reports', function (Blueprint $table) {
            $table->id();

            $table->string('report_number')->unique();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('title');
            $table->text('description');

            // Stored as names for this first version.
            // These can later be replaced with building_id / room_id foreign keys.
            $table->string('building_name');
            $table->string('room_name')->nullable();

            $table->enum('status', [
                'pending',
                'verified',
                'assigned',
                'in_progress',
                'completed',
                'rejected',
            ])->default('pending');

            $table->enum('priority', [
                'low',
                'medium',
                'high',
                'urgent',
            ])->default('medium');

            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('damage_reports');
    }
};