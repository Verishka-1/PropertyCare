<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name')->nullable();
            }

            if (!Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name')->nullable();
            }

            if (!Schema::hasColumn('users', 'name')) {
                $table->string('name')->nullable();
            }

            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->unique();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = [];

            foreach (['first_name', 'last_name', 'name', 'username'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $columns[] = $column;
                }
            }

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};