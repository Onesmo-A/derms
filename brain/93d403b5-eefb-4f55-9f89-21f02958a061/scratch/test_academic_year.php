<?php
require __DIR__ . '/../../../vendor/autoload.php';
$app = require __DIR__ . '/../../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    // Delete any test 2027 year if exists
    \App\Domains\School\Models\AcademicYear::where('name', '2027')->forceDelete();

    $y = \App\Domains\School\Models\AcademicYear::create([
        'name' => '2027',
        'start_date' => '2027-01-01',
        'end_date' => '2027-12-31',
        'is_active' => false
    ]);
    echo "SUCCESS: Created year with ID: " . $y->id . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
