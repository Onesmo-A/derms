<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('students')
            ->where('registration_number', 'like', '%/F%/%')
            ->orderBy('id')
            ->chunkById(500, function ($students): void {
                foreach ($students as $student) {
                    if (!preg_match('/^([SP]\d{4})\/F\d+\/(\d{4})$/', strtoupper((string) $student->registration_number), $matches)) {
                        continue;
                    }

                    DB::table('students')
                        ->where('id', $student->id)
                        ->update([
                            'registration_number' => $matches[1] . '/' . $matches[2],
                            'updated_at' => now(),
                        ]);
                }
            });
    }

    public function down(): void
    {
        // Legacy class-coded registration numbers are intentionally not restored.
    }
};
