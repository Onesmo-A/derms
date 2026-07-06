<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->unsignedInteger('student_count_cache')->default(0)->after('address');
            $table->string('enrolment_category', 20)->default('below_40')->after('student_count_cache');
            $table->index('student_count_cache');
            $table->index('enrolment_category');
        });

        DB::table('schools')
            ->select('id')
            ->orderBy('name')
            ->get()
            ->each(function ($school) {
                $studentCount = DB::table('students')
                    ->where('school_id', $school->id)
                    ->whereNull('deleted_at')
                    ->count();

                DB::table('schools')
                    ->where('id', $school->id)
                    ->update([
                        'student_count_cache' => $studentCount,
                        'enrolment_category' => $studentCount < 40 ? 'below_40' : '40_and_above',
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropIndex(['student_count_cache']);
            $table->dropIndex(['enrolment_category']);
            $table->dropColumn(['student_count_cache', 'enrolment_category']);
        });
    }
};
