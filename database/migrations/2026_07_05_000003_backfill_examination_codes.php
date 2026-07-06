<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('examinations', 'code')) {
            return;
        }

        DB::table('examinations')
            ->whereNull('code')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->each(function ($exam): void {
                $seed = strtoupper(substr(str_replace('-', '', (string) $exam->id), 0, 12));
                DB::table('examinations')
                    ->where('id', $exam->id)
                    ->update([
                        'code' => 'EXM-' . $seed,
                    ]);
            });
    }

    public function down(): void
    {
        DB::table('examinations')
            ->where('code', 'like', 'EXM-%')
            ->update(['code' => null]);
    }
};
