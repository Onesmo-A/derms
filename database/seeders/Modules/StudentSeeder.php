<?php

namespace Database\Seeders\Modules;

use App\Domains\School\Models\School;
use App\Domains\Student\Models\AcademicYear;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\Student\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $academicYear = AcademicYear::where('name', '2026')->firstOrFail();
        $classLevels = ClassLevel::orderBy('numeric_level')->get();

        if ($classLevels->isEmpty()) {
            return;
        }

        $schools = School::orderBy('registration_number')->get();

        $firstNames = ['Juma', 'Neema', 'Baraka', 'Mussa', 'Asha', 'Emmanuel', 'Halima', 'John', 'Sarah', 'Kassim'];
        $lastNames = ['Kibwana', 'Mwita', 'Chacha', 'Massawe', 'Mshana', 'Kamau', 'Komba', 'Sanga', 'Luoga', 'Nyerere'];
        $studentCountBands = [16, 24, 32, 40, 48];

        foreach ($schools as $schoolIndex => $school) {
            $studentTotal = $studentCountBands[$schoolIndex % count($studentCountBands)];
            $classSequences = [];

            for ($i = 0; $i < $studentTotal; $i++) {
                $gender = $i % 2 === 0 ? 'M' : 'F';
                $firstName = $firstNames[($schoolIndex * 2 + $i) % count($firstNames)];
                $lastName = $lastNames[($schoolIndex * 2 + $i) % count($lastNames)];
                $classLevel = $classLevels[$i % $classLevels->count()];
                $classKey = $school->id . '|' . $classLevel->id;
                $classSequences[$classKey] = ($classSequences[$classKey] ?? 0) + 1;
                $registrationNumber = $school->buildStudentRegistrationNumber($classLevel, (string) $classSequences[$classKey]);
                $phoneSeed = (($schoolIndex + 1) * 1000) + ($i + 1);
                $birthDay = str_pad((string) ((($schoolIndex + $i) % 28) + 1), 2, '0', STR_PAD_LEFT);

                Student::updateOrCreate(
                    [
                        'school_id' => $school->id,
                        'current_class_level_id' => $classLevel->id,
                        'registration_number' => $registrationNumber,
                    ],
                    [
                        'academic_year_id' => $academicYear->id,
                        'current_class_level_id' => $classLevel->id,
                        'first_name' => $firstName,
                        'middle_name' => 'S.',
                        'last_name' => $lastName,
                        'gender' => $gender,
                        'date_of_birth' => '2010-05-' . $birthDay,
                        'parent_name' => 'Parent of ' . $firstName,
                        'parent_phone' => '+255712' . str_pad((string) $phoneSeed, 6, '0', STR_PAD_LEFT),
                        'status' => 'active',
                    ]
                );
            }

            $school->refreshEnrollmentSummary();
        }
    }
}
