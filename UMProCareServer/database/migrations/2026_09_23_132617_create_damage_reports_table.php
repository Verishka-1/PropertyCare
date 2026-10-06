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

            // Where the damage is. Both come from the seeded
            // buildings / rooms tables (see config/campus_map.php).
            $table->foreignId('building_id')
                ->nullable()
                ->constrained('buildings')
                ->nullOnDelete();

            $table->foreignId('room_id')
                ->nullable()
                ->constrained('rooms')
                ->nullOnDelete();

            // What is damaged (shown as the report title in the app).
            $table->string('property_name')->nullable();
            $table->text('description');

            // pending      -> just submitted
            // verified     -> admin ACCEPTED the report
            // in_progress  -> admin started the REPAIR
            // completed    -> repair finished (goes to History)
            // rejected     -> admin rejected the report
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

            $table->timestamp('reported_at')->nullable();

            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['building_id', 'room_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('damage_reports');
    }
};
