<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_subjects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignUuid('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignUuid('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignUuid('class_level_id')->constrained('class_levels')->cascadeOnDelete();
            $table->foreignUuid('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignUuid('registered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('registered');
            $table->timestamp('registered_at')->useCurrent();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['student_id', 'subject_id', 'academic_year_id'], 'idx_student_subject_year_unique');
            $table->index(['school_id', 'academic_year_id', 'class_level_id'], 'idx_student_subject_scope');
            $table->index(['student_id', 'status'], 'idx_student_subject_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_subjects');
    }
};
