<?php

namespace Database\Seeders;

use Database\Seeders\Modules\AcademicSeeder;
use Database\Seeders\Modules\ExaminationSeeder;
use Database\Seeders\Modules\IdentitySeeder;
use Database\Seeders\Modules\OrganizationSeeder;
use Database\Seeders\Modules\StudentSubjectSeeder;
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
            StudentSubjectSeeder::class,
        ]);

        if (filter_var(env('IDEMS_SEED_DEMO', true), FILTER_VALIDATE_BOOLEAN)) {
            $this->call(DermsSystemSeeder::class);
        }
    }
}
