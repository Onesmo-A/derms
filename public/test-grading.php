<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Domains\Examination\Models\GradingSystem;
$grading = GradingSystem::with('details')->get();
header('Content-Type: application/json');
echo json_encode($grading, JSON_PRETTY_PRINT);
