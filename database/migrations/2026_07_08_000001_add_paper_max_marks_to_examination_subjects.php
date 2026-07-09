<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('examination_subjects', function (Blueprint $table) {
            if (! Schema::hasColumn('examination_subjects', 'paper_one_max_marks')) {
                $table->decimal('paper_one_max_marks', 5, 2)->default(100.00)->after('paper_two_weight');
            }

            if (! Schema::hasColumn('examination_subjects', 'paper_two_max_marks')) {
                $table->decimal('paper_two_max_marks', 5, 2)->default(0.00)->after('paper_one_max_marks');
            }
        });

        DB::table('examination_subjects')
            ->whereNull('paper_one_max_marks')
            ->update(['paper_one_max_marks' => 100.00]);

        DB::table('examination_subjects')
            ->where('paper_two_weight', '>', 0)
            ->update(['paper_two_max_marks' => 50.00]);

        DB::table('examination_subjects')
            ->where('paper_two_weight', '<=', 0)
            ->update(['paper_two_max_marks' => 0.00]);
    }

    public function down(): void
    {
        Schema::table('examination_subjects', function (Blueprint $table) {
            if (Schema::hasColumn('examination_subjects', 'paper_two_max_marks')) {
                $table->dropColumn('paper_two_max_marks');
            }

            if (Schema::hasColumn('examination_subjects', 'paper_one_max_marks')) {
                $table->dropColumn('paper_one_max_marks');
            }
        });
    }
};
