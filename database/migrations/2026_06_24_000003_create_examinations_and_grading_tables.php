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
        // 1. GRADING SYSTEMS
        Schema::create('grading_systems', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100); // e.g. 'NECTA Form Four Subject'
            $table->foreignUuid('class_level_id')->nullable()->constrained('class_levels')->onDelete('cascade');
            $table->string('type', 20); // 'subject', 'division'
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. GRADING SYSTEM DETAILS
        Schema::create('grading_system_details', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('grading_system_id')->constrained('grading_systems')->onDelete('cascade');
            $table->string('grade', 5); // 'A', 'B', 'C', 'D', 'F' or 'I', 'II', 'III', 'IV', '0'
            $table->decimal('min_score', 5, 2);
            $table->decimal('max_score', 5, 2);
            $table->integer('min_points')->nullable(); // for divisions
            $table->integer('max_points')->nullable(); // for divisions
            $table->integer('points'); // points value (A=1, B=2, C=3, D=4, F=5)
            $table->string('description', 255)->nullable();
            $table->timestamps();
        });

        // 3. EXAMINATION TYPES
        Schema::create('examination_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100)->unique(); // 'Mock', 'Series', 'Pre-Mock'
            $table->string('code', 20)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. EXAMINATIONS
        Schema::create('examinations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('academic_year_id')->constrained('academic_years');
            $table->foreignUuid('examination_type_id')->constrained('examination_types');
            $table->string('name', 150);
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status', 20)->default('draft'); // 'draft', 'registration_open', 'registration_closed', 'marks_entry_open', 'processing', 'processed', 'published', 'closed', 'archived'
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        // 5. EXAMINATION CLASS LEVELS (m:n)
        Schema::create('examination_class_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('examination_id')->constrained('examinations')->onDelete('cascade');
            $table->foreignUuid('class_level_id')->constrained('class_levels')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['examination_id', 'class_level_id']);
        });

        // 6. EXAMINATION SUBJECTS
        Schema::create('examination_subjects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('examination_id')->constrained('examinations')->onDelete('cascade');
            $table->foreignUuid('class_level_id')->constrained('class_levels')->onDelete('cascade');
            $table->foreignUuid('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->decimal('max_marks', 5, 2)->default(100.00);
            $table->decimal('pass_marks', 5, 2)->default(30.00);
            $table->decimal('paper_one_weight', 5, 2)->default(100.00); // theory/p1 weight
            $table->decimal('paper_two_weight', 5, 2)->default(0.00); // practical/p2 weight
            $table->timestamps();

            $table->unique(['examination_id', 'class_level_id', 'subject_id'], 'idx_exam_class_subject_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('examination_subjects');
        Schema::dropIfExists('examination_class_levels');
        Schema::dropIfExists('examinations');
        Schema::dropIfExists('examination_types');
        Schema::dropIfExists('grading_system_details');
        Schema::dropIfExists('grading_systems');
    }
};
