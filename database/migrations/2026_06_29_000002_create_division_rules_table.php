<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('division_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 50);        // e.g. "Division I"
            $table->integer('min_points');     // e.g. 7
            $table->integer('max_points');     // e.g. 17
            $table->string('badge', 100)->nullable(); // optional CSS class
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('division_rules');
    }
};
