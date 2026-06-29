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
        // 1. EXAMINATION REGISTRATIONS
        Schema::create('examination_registrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('examination_id')->constrained('examinations')->onDelete('cascade');
            $table->foreignUuid('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignUuid('class_level_id')->constrained('class_levels')->onDelete('cascade');
            $table->string('exam_number', 50)->unique(); // candidate number
            $table->string('status', 20)->default('registered'); // 'registered', 'absent', 'disqualified'
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['examination_id', 'student_id']);
        });

        // 2. MARKS
        Schema::create('marks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('examination_registration_id')->constrained('examination_registrations')->onDelete('cascade');
            $table->foreignUuid('examination_subject_id')->constrained('examination_subjects')->onDelete('cascade');
            $table->decimal('paper_one_score', 5, 2)->nullable();
            $table->decimal('paper_two_score', 5, 2)->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->string('grade', 5)->nullable();
            $table->integer('points')->nullable();
            $table->string('remarks', 50)->nullable(); // 'Pass', 'Fail', 'Absent'
            $table->foreignUuid('entered_by')->nullable()->constrained('users')->onDelete('set null');
            $table->boolean('is_validated')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['examination_registration_id', 'examination_subject_id'], 'idx_marks_reg_subj');
        });

        // 3. STUDENT EXAM SUMMARIES
        Schema::create('student_exam_summaries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('examination_registration_id')->unique()->constrained('examination_registrations')->onDelete('cascade');
            $table->decimal('total_marks', 7, 2)->default(0.00);
            $table->decimal('average_marks', 5, 2)->default(0.00);
            $table->decimal('gpa', 4, 2)->default(0.00); // lower is better in NECTA
            $table->string('division', 5)->nullable();
            $table->integer('division_points')->nullable(); // sum of points of best 7 subjects
            $table->integer('passed_subjects_count')->default(0);
            $table->integer('failed_subjects_count')->default(0);
            $table->integer('school_position')->nullable();
            $table->integer('district_position')->nullable();
            $table->string('status', 20)->default('processed');
            $table->timestamps();
        });

        // 4. SCHOOL EXAM SUMMARIES
        Schema::create('school_exam_summaries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('examination_id')->constrained('examinations')->onDelete('cascade');
            $table->foreignUuid('school_id')->constrained('schools')->onDelete('cascade');
            $table->foreignUuid('class_level_id')->constrained('class_levels')->onDelete('cascade');
            $table->integer('registered_candidates')->default(0);
            $table->integer('sat_candidates')->default(0);
            $table->integer('absent_candidates')->default(0);
            $table->decimal('total_gpa', 4, 2)->default(0.00);
            $table->integer('division_i_count')->default(0);
            $table->integer('division_ii_count')->default(0);
            $table->integer('division_iii_count')->default(0);
            $table->integer('division_iv_count')->default(0);
            $table->integer('division_zero_count')->default(0);
            $table->decimal('pass_rate', 5, 2)->default(0.00);
            $table->decimal('fail_rate', 5, 2)->default(0.00);
            $table->integer('school_position_district')->nullable();
            $table->timestamps();

            $table->unique(['examination_id', 'school_id', 'class_level_id'], 'idx_school_exam_class');
        });

        // 5. SUBJECT EXAM SUMMARIES
        Schema::create('subject_exam_summaries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('examination_id')->constrained('examinations')->onDelete('cascade');
            $table->foreignUuid('class_level_id')->constrained('class_levels')->onDelete('cascade');
            $table->foreignUuid('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignUuid('school_id')->nullable()->constrained('schools')->onDelete('cascade'); // NULL = District wide aggregate
            $table->integer('registered_candidates')->default(0);
            $table->integer('sat_candidates')->default(0);
            $table->decimal('total_score', 10, 2)->default(0.00);
            $table->decimal('average_score', 5, 2)->default(0.00);
            $table->decimal('gpa', 4, 2)->default(0.00); // lower is better
            $table->integer('grade_a_count')->default(0);
            $table->integer('grade_b_count')->default(0);
            $table->integer('grade_c_count')->default(0);
            $table->integer('grade_d_count')->default(0);
            $table->integer('grade_f_count')->default(0);
            $table->integer('subject_position_district')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_exam_summaries');
        Schema::dropIfExists('school_exam_summaries');
        Schema::dropIfExists('student_exam_summaries');
        Schema::dropIfExists('marks');
        Schema::dropIfExists('examination_registrations');
    }
};
