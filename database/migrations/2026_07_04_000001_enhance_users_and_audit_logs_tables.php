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
        // 1. ENHANCE USERS TABLE
        Schema::table('users', function (Blueprint $table) {
            // Drop old name and phone columns if they exist
            if (Schema::hasColumn('users', 'name')) {
                $table->dropColumn('name');
            }
            if (Schema::hasColumn('users', 'phone_number')) {
                $table->dropColumn('phone_number');
            }

            // Add split name and phone
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('phone', 20)->nullable();

            // Add scope and tracking
            $table->foreignUuid('region_id')->nullable()->constrained('regions')->onDelete('set null');
            $table->integer('failed_login_attempts')->default(0);
            $table->timestamp('last_login_at')->nullable();
            $table->boolean('force_password_change')->default(false);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->onDelete('set null');
        });

        // 2. ENHANCE AUDIT LOGS TABLE
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('module', 50)->nullable()->index();
            $table->string('status', 20)->default('success'); // 'success', 'failed'
            $table->string('browser', 100)->nullable();
            $table->string('device', 100)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn(['module', 'status', 'browser', 'device']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['region_id']);
            $table->dropColumn([
                'first_name',
                'middle_name',
                'last_name',
                'phone',
                'region_id',
                'failed_login_attempts',
                'last_login_at',
                'force_password_change',
                'created_by'
            ]);
            $table->string('name')->nullable();
            $table->string('phone_number', 20)->nullable();
        });
    }
};
