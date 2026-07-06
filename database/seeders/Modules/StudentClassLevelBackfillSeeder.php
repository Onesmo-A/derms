<?php

namespace Database\Seeders\Modules;

use App\Domains\School\Models\School;
use App\Domains\Student\Models\AcademicYear;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\Student\Models\Student;
use Illuminate\Database\Seeder;

class StudentClassLevelBackfillSeeder extends Seeder
{
    public function run(): void
    {
        $academicYear = AcademicYear::where('name', '2026')->first();
        $formFour = ClassLevel::where('name', 'Form Four')->first();

        if (! $academicYear || ! $formFour) {
            return;
        }

        Student::query()
            ->whereNull('current_class_level_id')
            ->update([
                'academic_year_id' => $academicYear->id,
                'current_class_level_id' => $formFour->id,
            ]);

        School::query()->get()->each(function (School $school) {
            $school->refreshEnrollmentSummary();
        });
    }
}
