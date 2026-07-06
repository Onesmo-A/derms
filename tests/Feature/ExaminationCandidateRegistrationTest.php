<?php

use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Examination\Models\ExaminationType;
use App\Domains\Identity\Models\User;
use App\Domains\School\Models\District;
use App\Domains\School\Models\Region;
use App\Domains\School\Models\School;
use App\Domains\Student\Models\AcademicYear;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\Student\Models\Student;
use App\Enums\ExaminationStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('exam candidate registration respects school and class scope end to end', function () {
    Role::firstOrCreate(['name' => 'Super Administrator', 'guard_name' => 'web']);

    $user = User::create([
        'first_name' => 'System',
        'last_name' => 'Admin',
        'email' => 'admin@example.com',
        'phone' => '+255700000999',
        'password' => 'password',
        'status' => 'active',
    ]);
    $user->assignRole('Super Administrator');

    Sanctum::actingAs($user);

    $region = Region::create([
        'name' => 'Dar es Salaam',
        'code' => 'DSM',
    ]);

    $district = District::create([
        'region_id' => $region->id,
        'name' => 'Kinondoni',
        'code' => 'KIN',
    ]);

    $schoolOne = School::create([
        'district_id' => $district->id,
        'name' => 'Kinondoni Secondary School',
        'registration_number' => '0101',
        'type' => 'government',
        'level' => 'secondary',
    ]);

    $schoolTwo = School::create([
        'district_id' => $district->id,
        'name' => 'Oysterbay Secondary School',
        'registration_number' => '0102',
        'type' => 'government',
        'level' => 'secondary',
    ]);

    $academicYear = AcademicYear::create([
        'name' => '2026',
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
        'is_active' => true,
    ]);

    $formThree = ClassLevel::create([
        'name' => 'Form Three',
        'numeric_level' => 3,
    ]);

    $formFour = ClassLevel::create([
        'name' => 'Form Four',
        'numeric_level' => 4,
    ]);

    $examType = ExaminationType::create([
        'name' => 'Mock Examination',
        'code' => 'MOCK',
        'description' => 'Mock examinations',
    ]);

    $exam = Examination::create([
        'academic_year_id' => $academicYear->id,
        'examination_type_id' => $examType->id,
        'target_class_level_id' => $formFour->id,
        'code' => 'F4-DMC-2026',
        'name' => 'Form Four District Mock Exam 2026',
        'start_date' => '2026-06-01',
        'end_date' => '2026-06-15',
        'status' => ExaminationStatus::RegistrationOpen->value,
        'created_by' => $user->id,
    ]);

    $schoolOneCandidate = Student::create([
        'school_id' => $schoolOne->id,
        'academic_year_id' => $academicYear->id,
        'current_class_level_id' => $formFour->id,
        'registration_number' => $schoolOne->buildStudentRegistrationNumber($formFour, '1'),
        'first_name' => 'Amina',
        'last_name' => 'Hassan',
        'gender' => 'F',
        'parent_phone' => '+255712345678',
        'status' => 'active',
    ]);

    $schoolOneWrongClassStudent = Student::create([
        'school_id' => $schoolOne->id,
        'academic_year_id' => $academicYear->id,
        'current_class_level_id' => $formThree->id,
        'registration_number' => $schoolOne->buildStudentRegistrationNumber($formThree, '2'),
        'first_name' => 'Juma',
        'last_name' => 'Musa',
        'gender' => 'M',
        'parent_phone' => '+255712345679',
        'status' => 'active',
    ]);

    $schoolTwoCandidate = Student::create([
        'school_id' => $schoolTwo->id,
        'academic_year_id' => $academicYear->id,
        'current_class_level_id' => $formFour->id,
        'registration_number' => $schoolTwo->buildStudentRegistrationNumber($formFour, '1'),
        'first_name' => 'Neema',
        'last_name' => 'Mtei',
        'gender' => 'F',
        'parent_phone' => '+255712345680',
        'status' => 'active',
    ]);

    $eligibleResponse = $this->getJson("/api/v1/examinations/{$exam->id}/eligible-students?" . http_build_query([
        'school_id' => $schoolOne->id,
        'class_level_id' => $formFour->id,
    ]));

    $eligibleResponse->assertOk();

    $eligibleIds = collect($eligibleResponse->json())->pluck('id')->all();

    expect($eligibleIds)->toHaveCount(1);
    expect($eligibleIds)->toContain($schoolOneCandidate->id);
    expect($eligibleIds)->not->toContain($schoolTwoCandidate->id);
    expect($eligibleIds)->not->toContain($schoolOneWrongClassStudent->id);

    $registerResponse = $this->postJson("/api/v1/examinations/{$exam->id}/registrations", [
        'student_ids' => [$schoolOneCandidate->id],
        'class_level_id' => $formFour->id,
    ]);

    $registerResponse->assertOk();
    $registerResponse->assertJsonPath('registered_count', 1);

    $this->assertDatabaseCount('examination_registrations', 1);

    $registration = ExaminationRegistration::with(['student'])->firstOrFail();

    expect($registration->examination_id)->toBe($exam->id)
        ->and($registration->class_level_id)->toBe($formFour->id)
        ->and($registration->student_id)->toBe($schoolOneCandidate->id)
        ->and($registration->student->school_id)->toBe($schoolOne->id)
        ->and($registration->student->current_class_level_id)->toBe($formFour->id);

    $this->assertDatabaseMissing('examination_registrations', [
        'examination_id' => $exam->id,
        'student_id' => $schoolTwoCandidate->id,
    ]);
});
