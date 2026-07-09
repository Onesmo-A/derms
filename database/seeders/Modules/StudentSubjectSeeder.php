<?php

namespace Database\Seeders\Modules;

use App\Domains\Student\Services\StudentSubjectBackfillService;
use Illuminate\Database\Seeder;

class StudentSubjectSeeder extends Seeder
{
    public function run(): void
    {
        $report = app(StudentSubjectBackfillService::class)->run([], false, true);

        if (($report['insufficient_subjects'] ?? 0) > 0) {
            throw new \RuntimeException('Student subject seeding failed because the subject catalog does not contain enough active subjects.');
        }
    }
}
