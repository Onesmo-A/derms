<?php

namespace Database\Seeders;

use Database\Seeders\Modules\DemoExamCycleSeeder;
use Illuminate\Database\Seeder;

class DermsSystemSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(DemoExamCycleSeeder::class);
    }
}
