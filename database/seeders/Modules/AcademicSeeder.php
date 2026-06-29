<?php

namespace Database\Seeders\Modules;

use App\Domains\Student\Models\AcademicYear;
use App\Domains\Student\Models\ClassLevel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AcademicSeeder extends Seeder
{
    public function run(): void
    {
        AcademicYear::firstOrCreate(
            ['name' => '2026'],
            [
                'id' => (string) Str::uuid(),
                'start_date' => '2026-01-01',
                'end_date' => '2026-12-31',
                'is_active' => true,
            ]
        );

        $classLevels = [
            ['name' => 'Form One', 'numeric_level' => 1],
            ['name' => 'Form Two', 'numeric_level' => 2],
            ['name' => 'Form Three', 'numeric_level' => 3],
            ['name' => 'Form Four', 'numeric_level' => 4],
        ];

        foreach ($classLevels as $classLevel) {
            ClassLevel::firstOrCreate(
                ['name' => $classLevel['name']],
                [
                    'id' => (string) Str::uuid(),
                    'numeric_level' => $classLevel['numeric_level'],
                ]
            );
        }
    }
}
