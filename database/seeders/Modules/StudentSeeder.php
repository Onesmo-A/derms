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
        $formFour = ClassLevel::where('name', 'Form Four')->firstOrFail();

        $schools = School::orderBy('registration_number')->get();

        $firstNames = ['Juma', 'Neema', 'Baraka', 'Mussa', 'Asha', 'Emmanuel', 'Halima', 'John', 'Sarah', 'Kassim'];
        $lastNames = ['Kibwana', 'Mwita', 'Chacha', 'Massawe', 'Mshana', 'Kamau', 'Komba', 'Sanga', 'Luoga', 'Nyerere'];

        foreach ($schools as $schoolIndex => $school) {
            for ($i = 0; $i < 8; $i++) {
                $gender = $i % 2 === 0 ? 'M' : 'F';
                $firstName = $firstNames[($schoolIndex * 2 + $i) % count($firstNames)];
                $lastName = $lastNames[($schoolIndex * 2 + $i) % count($lastNames)];

                Student::firstOrCreate(
                    ['registration_number' => 'ST' . $school->registration_number . str_pad($i + 1, 3, '0', STR_PAD_LEFT)],
                    [
                        'id' => (string) Str::uuid(),
                        'school_id' => $school->id,
                        'academic_year_id' => $academicYear->id,
                        'current_class_level_id' => $formFour->id,
                        'first_name' => $firstName,
                        'middle_name' => 'S.',
                        'last_name' => $lastName,
                        'gender' => $gender,
                        'date_of_birth' => '2010-05-12',
                        'parent_name' => 'Parent of ' . $firstName,
                        'parent_phone' => '+255712000' . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                        'status' => 'active',
                    ]
                );
            }
        }
    }
}
