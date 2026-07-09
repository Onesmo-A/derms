<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Domains\Student\Services\StudentSubjectBackfillService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('external-results:check-new-results', function () {
    $this->info('Checking for newly published external exam results...');
    
    // Call Python Client to discover published years for CSEE
    try {
        $url = env('PYTHON_SERVICE_URL', 'http://127.0.0.1:8000') . '/api/v1/imports/years?source=NECTA&exam_type=CSEE';
        $response = Http::get($url);
        if ($response->ok()) {
            $years = $response->json()['years'] ?? [];
            foreach ($years as $year) {
                // Check if session exists in DB
                $exists = DB::table('import_sessions')
                    ->where('source_system', 'NECTA')
                    ->where('exam_type', 'CSEE')
                    ->where('year', $year)
                    ->exists();
                
                if (!$exists) {
                    $this->comment("Discovered newly published NECTA CSEE results for Year {$year}!");
                    // Here we can dispatch notifications or alert dashboards
                }
            }
        }
    } catch (\Exception $e) {
        $this->error("Failed to connect to Python service: " . $e->getMessage());
    }
})->purpose('Check daily for newly published results on external portal boards');

Schedule::command('external-results:check-new-results')->dailyAt('08:00');

Artisan::command('students:backfill-subjects {--dry-run} {--fill-partial} {--academic-year=} {--class-level=} {--school=} {--status=active}', function () {
    $service = app(StudentSubjectBackfillService::class);

    $filters = array_filter([
        'academic_year_id' => $this->option('academic-year'),
        'class_level_id' => $this->option('class-level'),
        'school_id' => $this->option('school'),
        'status' => $this->option('status'),
    ], fn ($value) => !empty($value));

    $report = $service->run(
        $filters,
        (bool) $this->option('dry-run'),
        (bool) $this->option('fill-partial')
    );

    $this->info(sprintf(
        'Processed %d students. Created %d registrations, updated %d, dropped %d, skipped %d.',
        $report['processed'],
        $report['created'],
        $report['updated'],
        $report['dropped'],
        $report['skipped'],
    ));

    if ($this->option('dry-run')) {
        $this->comment('Dry run completed. No data was written.');
    }
})->purpose('Backfill default subject registrations for existing students');
