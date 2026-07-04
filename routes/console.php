<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

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
