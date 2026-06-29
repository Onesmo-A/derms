<?php

namespace Database\Seeders;

use Database\Seeders\Modules\AcademicSeeder;
use Database\Seeders\Modules\DemoExamCycleSeeder;
use Database\Seeders\Modules\ExaminationSeeder;
use Database\Seeders\Modules\IdentitySeeder;
use Database\Seeders\Modules\OrganizationSeeder;
use Database\Seeders\Modules\StudentSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            OrganizationSeeder::class,
            AcademicSeeder::class,
            ExaminationSeeder::class,
            IdentitySeeder::class,
            StudentSeeder::class,
        ]);

        if (filter_var(env('DERMS_SEED_DEMO', true), FILTER_VALIDATE_BOOLEAN)) {
            $this->call(DemoExamCycleSeeder::class);
        }
    }
}
