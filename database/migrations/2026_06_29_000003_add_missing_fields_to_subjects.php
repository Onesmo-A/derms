<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            if (!Schema::hasColumn('subjects', 'class_level_id')) {
                $table->foreignUuid('class_level_id')->nullable()->constrained('class_levels')->onDelete('set null');
            }
            if (!Schema::hasColumn('subjects', 'description')) {
                $table->text('description')->nullable();
            }
            if (!Schema::hasColumn('subjects', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['class_level_id']);
            $table->dropColumn(['class_level_id', 'description', 'is_active']);
        });
    }
};
