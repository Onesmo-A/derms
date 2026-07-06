<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('examinations', function (Blueprint $table) {
            if (!Schema::hasColumn('examinations', 'target_class_level_id')) {
                $table->foreignUuid('target_class_level_id')
                    ->nullable()
                    ->after('examination_type_id')
                    ->constrained('class_levels')
                    ->nullOnDelete();
            }
        });

        if (Schema::hasTable('examination_class_levels')) {
            $examIds = DB::table('examinations')->pluck('id');

            foreach ($examIds as $examId) {
                $targetClassLevelId = DB::table('examination_class_levels')
                    ->where('examination_id', $examId)
                    ->orderBy('created_at')
                    ->value('class_level_id');

                if ($targetClassLevelId) {
                    DB::table('examinations')
                        ->where('id', $examId)
                        ->update(['target_class_level_id' => $targetClassLevelId]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::table('examinations', function (Blueprint $table) {
            if (Schema::hasColumn('examinations', 'target_class_level_id')) {
                $table->dropConstrainedForeignId('target_class_level_id');
            }
        });
    }
};
