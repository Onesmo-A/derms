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
        // 1. ACADEMIC YEARS
        Schema::create('academic_years', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 4)->unique(); // e.g. '2026'
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. CLASS LEVELS
        Schema::create('class_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 50)->unique(); // e.g. 'Form One', 'Form Two'
            $table->integer('numeric_level')->unique(); // 1, 2, 3, 4 for sorting
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. SUBJECTS
        Schema::create('subjects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100)->unique();
            $table->string('code', 10)->unique(); // e.g. '011', '033'
            $table->boolean('has_practical')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. STUDENTS
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->constrained('schools')->onDelete('cascade');
            $table->foreignUuid('academic_year_id')->constrained('academic_years');
            $table->foreignUuid('current_class_level_id')->constrained('class_levels');
            $table->string('registration_number', 50)->unique();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->char('gender', 1); // 'M' or 'F'
            $table->date('date_of_birth')->nullable();
            $table->string('parent_name', 150)->nullable();
            $table->string('parent_phone', 20); // parent mobile for SMS alerts
            $table->string('status', 20)->default('active'); // 'active', 'transferred', 'completed'
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('class_levels');
        Schema::dropIfExists('academic_years');
    }
};
