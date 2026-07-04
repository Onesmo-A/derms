<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Domains\Examination\Models\GradingSystem;
use App\Domains\Examination\Models\Examination;
use App\Domains\Results\Services\ResultsProcessingService;

try {
    // 1. Delete all empty grading systems
    $emptySystems = GradingSystem::doesntHave('details')->get();
    foreach ($emptySystems as $system) {
        $system->delete();
    }
    
    // 2. Reprocess all examinations
    $service = app(ResultsProcessingService::class);
    $exams = Examination::with('classLevels')->get();
    
    foreach ($exams as $exam) {
        foreach ($exam->classLevels as $classLevel) {
            $service->process($exam->id, $classLevel->id);
        }
    }
    
    echo "Fix applied successfully! Empty rules deleted and all results reprocessed.";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . " - " . $e->getTraceAsString();
}
