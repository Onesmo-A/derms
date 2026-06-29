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
        // 1. REGIONS
        Schema::create('regions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100)->unique();
            $table->string('code', 10)->unique();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. DISTRICTS
        Schema::create('districts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('region_id')->constrained('regions')->onDelete('cascade');
            $table->string('name', 100);
            $table->string('code', 10)->unique();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['region_id', 'name']);
        });

        // 3. SCHOOLS
        Schema::create('schools', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('district_id')->constrained('districts')->onDelete('cascade');
            $table->string('name', 150);
            $table->string('registration_number', 50)->unique();
            $table->string('type', 20); // 'government', 'private'
            $table->string('level', 20); // 'primary', 'secondary'
            $table->string('phone_number', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. USERS
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->nullable()->constrained('schools')->onDelete('set null');
            $table->foreignUuid('district_id')->nullable()->constrained('districts')->onDelete('set null');
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone_number', 20)->nullable();
            $table->string('password');
            $table->string('status', 20)->default('active'); // 'active', 'inactive', 'suspended'
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        // 5. PASSWORD RESET TOKENS
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // 6. SESSIONS
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignUuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('schools');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('regions');
    }
};
