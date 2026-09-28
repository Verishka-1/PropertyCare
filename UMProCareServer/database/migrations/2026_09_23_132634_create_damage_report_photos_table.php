<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('damage_report_photos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('damage_report_id')
                ->constrained('damage_reports')
                ->cascadeOnDelete();

            $table->string('photo_path');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('damage_report_photos');
    }
};