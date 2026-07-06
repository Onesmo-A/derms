<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            $table->dropUnique(['registration_number']);
            $table->unique(
                ['school_id', 'current_class_level_id', 'academic_year_id', 'registration_number'],
                'students_school_class_year_registration_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            $table->dropUnique('students_school_class_year_registration_unique');
            $table->unique('registration_number');
        });
    }
};
