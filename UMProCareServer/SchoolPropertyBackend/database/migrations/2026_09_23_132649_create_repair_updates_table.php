<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_updates', function (Blueprint $table) {
            $table->id();

            $table->foreignId('damage_report_id')
                ->constrained('damage_reports')
                ->cascadeOnDelete();

            $table->foreignId('maintenance_user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->enum('status', [
                'assigned',
                'in_progress',
                'completed',
                'rejected',
            ]);

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_updates');
    }
};