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
        // Drop old tables if they exist to allow clean refactoring
        Schema::dropIfExists('raw_necta_results');
        Schema::dropIfExists('necta_import_details');
        Schema::dropIfExists('necta_import_sessions');

        Schema::create('subject_mappings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('source_system', 50); // e.g. 'NECTA', 'CAMBRIDGE'
            $table->string('external_code', 50); // e.g. 'B/MATH'
            $table->foreignUuid('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['source_system', 'external_code']);
        });

        Schema::create('school_mappings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('source_system', 50);
            $table->string('centre_code', 50); // e.g. 'P0136'
            $table->foreignUuid('school_id')->constrained('schools')->onDelete('cascade');
            $table->integer('effective_year');
            $table->string('status', 20)->default('active'); // active, inactive
            $table->timestamps();

            $table->unique(['source_system', 'centre_code', 'effective_year']);
        });

        Schema::create('import_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('source_system', 50); // NECTA, CAMBRIDGE
            $table->string('exam_type', 50); // CSEE, ACSEE, MOCK
            $table->integer('year');
            $table->string('status', 20)->default('pending'); // pending, running, completed, failed, paused
            $table->integer('total_centres')->default(0);
            $table->integer('processed_centres')->default(0);
            $table->integer('failed_centres')->default(0);
            $table->integer('total_students')->default(0);
            $table->string('parser_version', 20)->nullable();
            $table->string('scraper_version', 20)->nullable();
            $table->string('mapping_version', 20)->nullable();
            $table->jsonb('errors')->nullable();
            $table->jsonb('warnings')->nullable();
            $table->text('logs')->nullable();
            $table->foreignUuid('started_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
        });

        Schema::create('import_details', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('import_session_id')->constrained('import_sessions')->onDelete('cascade');
            $table->string('centre_number', 50);
            $table->string('school_name', 150)->nullable();
            $table->string('status', 20)->default('pending'); // pending, processing, completed, failed
            $table->integer('candidates_count')->default(0);
            $table->jsonb('errors')->nullable();
            $table->jsonb('warnings')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->unique(['import_session_id', 'centre_number']);
        });

        Schema::create('raw_candidates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('import_session_id')->constrained('import_sessions')->onDelete('cascade');
            $table->string('centre_number', 50);
            $table->string('candidate_number', 50); // e.g. S0101/0001
            $table->string('gender', 5)->nullable();
            $table->string('division', 10)->nullable();
            $table->integer('points')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamps();

            $table->unique(['import_session_id', 'candidate_number']);
        });

        Schema::create('raw_subjects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('raw_candidate_id')->constrained('raw_candidates')->onDelete('cascade');
            $table->string('subject_code', 50);
            $table->string('subject_name', 150)->nullable();
            $table->foreignUuid('subject_id')->nullable()->constrained('subjects')->onDelete('set null');
            $table->string('grade', 5);
            $table->integer('points')->nullable();
            $table->timestamps();
        });

        Schema::create('raw_summaries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('import_session_id')->constrained('import_sessions')->onDelete('cascade');
            $table->string('centre_number', 50);
            $table->integer('division_i_count')->default(0);
            $table->integer('division_ii_count')->default(0);
            $table->integer('division_iii_count')->default(0);
            $table->integer('division_iv_count')->default(0);
            $table->integer('division_zero_count')->default(0);
            $table->integer('sat_candidates')->default(0);
            $table->integer('absent_candidates')->default(0);
            $table->timestamps();

            $table->unique(['import_session_id', 'centre_number']);
        });

        Schema::create('import_snapshots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')->constrained('import_sessions')->onDelete('cascade');
            $table->string('snapshot_type', 50); // e.g. 'PRE_PROMOTION'
            $table->string('storage_path', 255); // storage directory path
            $table->string('checksum', 100);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_snapshots');
        Schema::dropIfExists('raw_summaries');
        Schema::dropIfExists('raw_subjects');
        Schema::dropIfExists('raw_candidates');
        Schema::dropIfExists('import_details');
        Schema::dropIfExists('import_sessions');
        Schema::dropIfExists('school_mappings');
        Schema::dropIfExists('subject_mappings');
    }
};
