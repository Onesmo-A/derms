<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('examination_subjects', function (Blueprint $table) {
            if (!Schema::hasColumn('examination_subjects', 'exam_date')) {
                $table->date('exam_date')->nullable();
            }
            if (!Schema::hasColumn('examination_subjects', 'start_time')) {
                $table->string('start_time', 10)->nullable();
            }
            if (!Schema::hasColumn('examination_subjects', 'end_time')) {
                $table->string('end_time', 10)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('examination_subjects', function (Blueprint $table) {
            $table->dropColumn(['exam_date', 'start_time', 'end_time']);
        });
    }
};
