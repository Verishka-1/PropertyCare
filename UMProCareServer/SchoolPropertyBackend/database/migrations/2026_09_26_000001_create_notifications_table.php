<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();

            // The account that should see this notification.
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // Optional link back to the damage report this is about.
            $table->foreignId('damage_report_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('title');
            $table->text('body');

            // e.g. "report_submitted", "status_updated", "complaint_replied"
            $table->string('type')->default('general');

            $table->timestamp('read_at')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
