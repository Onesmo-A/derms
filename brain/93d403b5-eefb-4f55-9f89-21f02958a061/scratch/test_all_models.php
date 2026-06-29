<?php
require __DIR__ . '/../../../vendor/autoload.php';
$app = require __DIR__ . '/../../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Domains\School\Models\ClassLevel;
use App\Domains\School\Models\Subject;
use App\Domains\School\Models\GradingSystem;
use App\Domains\School\Models\GradingSystemDetail;
use App\Domains\School\Models\DivisionRule;
use Illuminate\Support\Str;

try {
    // 1. Class Level
    ClassLevel::where('name', 'Test Class')->forceDelete();
    $c = ClassLevel::create([
        'name' => 'Test Class',
        'numeric_level' => 999
    ]);
    echo "SUCCESS: Created ClassLevel ID: " . $c->id . "\n";

    // 2. Subject
    Subject::where('code', 'TESTSUB')->forceDelete();
    $s = Subject::create([
        'name' => 'Test Subject',
        'code' => 'TESTSUB',
        'has_practical' => true,
        'class_level_id' => $c->id
    ]);
    echo "SUCCESS: Created Subject ID: " . $s->id . "\n";

    // 3. Grading System
    $gs = GradingSystem::create([
        'name' => 'Test Grading System',
        'type' => 'subject'
    ]);
    echo "SUCCESS: Created GradingSystem ID: " . $gs->id . "\n";

    $gsd = GradingSystemDetail::create([
        'id' => (string) Str::uuid(),
        'grading_system_id' => $gs->id,
        'grade' => 'A',
        'min_score' => 80.00,
        'max_score' => 100.00,
        'points' => 1
    ]);
    echo "SUCCESS: Created GradingSystemDetail ID: " . $gsd->id . "\n";

    // 4. Division Rule
    DivisionRule::where('name', 'Test Division')->forceDelete();
    $dr = DivisionRule::create([
        'name' => 'Test Division',
        'min_points' => 7,
        'max_points' => 17
    ]);
    echo "SUCCESS: Created DivisionRule ID: " . $dr->id . "\n";

    // Clean up
    $gsd->delete();
    $gs->forceDelete();
    $dr->forceDelete();
    $s->forceDelete();
    $c->forceDelete();
    echo "SUCCESS: All test data cleaned up successfully.\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
