<?php

use App\Domains\Identity\Models\User;
use App\Domains\School\Models\District;
use App\Domains\School\Models\Region;
use App\Domains\School\Models\School;
use App\Domains\Student\Models\AcademicYear;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\Student\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('student registration number can repeat across classes but not within the same school class and year scope', function () {
    Role::firstOrCreate(['name' => 'Super Administrator', 'guard_name' => 'web']);

    $user = User::create([
        'first_name' => 'System',
        'last_name' => 'Admin',
        'email' => 'admin-scope@example.com',
        'phone' => '+255700001111',
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

    $school = School::create([
        'district_id' => $district->id,
        'name' => 'Kinondoni Secondary School',
        'registration_number' => '1023',
        'type' => 'government',
        'level' => 'secondary',
    ]);

    $academicYear = AcademicYear::create([
        'name' => '2026',
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
        'is_active' => true,
    ]);

    $classM = ClassLevel::create([
        'name' => 'Class M',
        'numeric_level' => 1,
    ]);

    $classN = ClassLevel::create([
        'name' => 'Class N',
        'numeric_level' => 2,
    ]);

    $sharedRegistrationNumber = $school->buildStudentRegistrationNumber($classM, '1');

    $firstResponse = $this->postJson('/api/v1/students', [
        'school_id' => $school->id,
        'academic_year_id' => $academicYear->id,
        'current_class_level_id' => $classM->id,
        'registration_number' => $sharedRegistrationNumber,
        'first_name' => 'Amina',
        'last_name' => 'Juma',
        'gender' => 'F',
        'parent_phone' => '+255712340001',
        'status' => 'active',
    ]);

    $firstResponse->assertCreated();

    $secondResponse = $this->postJson('/api/v1/students', [
        'school_id' => $school->id,
        'academic_year_id' => $academicYear->id,
        'current_class_level_id' => $classN->id,
        'registration_number' => $sharedRegistrationNumber,
        'first_name' => 'Baraka',
        'last_name' => 'Musa',
        'gender' => 'M',
        'parent_phone' => '+255712340002',
        'status' => 'active',
    ]);

    $secondResponse->assertCreated();

    $duplicateResponse = $this->postJson('/api/v1/students', [
        'school_id' => $school->id,
        'academic_year_id' => $academicYear->id,
        'current_class_level_id' => $classM->id,
        'registration_number' => $sharedRegistrationNumber,
        'first_name' => 'Zawadi',
        'last_name' => 'Musa',
        'gender' => 'F',
        'parent_phone' => '+255712340003',
        'status' => 'active',
    ]);

    $duplicateResponse->assertStatus(422);

    $this->assertDatabaseCount('students', 2);

    expect(Student::where('registration_number', $sharedRegistrationNumber)->count())->toBe(2);
});
