<?php

namespace Database\Seeders\Modules;

use App\Domains\Examination\Models\ExaminationType;
use App\Domains\Examination\Models\GradingSystem;
use App\Domains\Examination\Models\GradingSystemDetail;
use App\Domains\Examination\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ExaminationSeeder extends Seeder
{
    public function run(): void
    {
        $subjects = [
            ['name' => 'Basic Mathematics', 'short_name' => 'MAT', 'code' => '011', 'has_practical' => false],
            ['name' => 'English Language', 'short_name' => 'ENG', 'code' => '012', 'has_practical' => false],
            ['name' => 'Kiswahili', 'short_name' => 'KIS', 'code' => '013', 'has_practical' => false],
            ['name' => 'History', 'short_name' => 'HIST', 'code' => '014', 'has_practical' => false],
            ['name' => 'Geography', 'short_name' => 'GEO', 'code' => '015', 'has_practical' => false],
            ['name' => 'Civics', 'short_name' => 'CIV', 'code' => '010', 'has_practical' => false],
            ['name' => 'Physics', 'short_name' => 'PHY', 'code' => '031', 'has_practical' => true],
            ['name' => 'Chemistry', 'short_name' => 'CHE', 'code' => '032', 'has_practical' => true],
            ['name' => 'Biology', 'short_name' => 'BIO', 'code' => '033', 'has_practical' => true],
        ];

        foreach ($subjects as $subjectData) {
            Subject::updateOrCreate(
                ['code' => $subjectData['code']],
                [
                    'name' => $subjectData['name'],
                    'short_name' => $subjectData['short_name'],
                    'has_practical' => $subjectData['has_practical'],
                ]
            );
        }

        $examTypes = [
            ['name' => 'Pre-Mock Examination', 'code' => 'PREMOCK'],
            ['name' => 'Mock Examination', 'code' => 'MOCK'],
            ['name' => 'Series Examination', 'code' => 'SERIES'],
            ['name' => 'Midterm Examination', 'code' => 'MIDTERM'],
            ['name' => 'Terminal Examination', 'code' => 'TERMINAL'],
        ];

        foreach ($examTypes as $examTypeData) {
            ExaminationType::firstOrCreate(
                ['code' => $examTypeData['code']],
                [
                    'id' => (string) Str::uuid(),
                    'name' => $examTypeData['name'],
                ]
            );
        }

        $subjectGrading = GradingSystem::firstOrCreate(
            ['type' => 'subject', 'class_level_id' => null],
            [
                'id' => (string) Str::uuid(),
                'name' => 'NECTA Subject Grading',
            ]
        );

        foreach ([
            ['grade' => 'A', 'min_score' => 75.00, 'max_score' => 100.00, 'points' => 1, 'description' => 'Excellent'],
            ['grade' => 'B', 'min_score' => 65.00, 'max_score' => 74.99, 'points' => 2, 'description' => 'Very Good'],
            ['grade' => 'C', 'min_score' => 45.00, 'max_score' => 64.99, 'points' => 3, 'description' => 'Good'],
            ['grade' => 'D', 'min_score' => 30.00, 'max_score' => 44.99, 'points' => 4, 'description' => 'Satisfactory'],
            ['grade' => 'F', 'min_score' => 0.00, 'max_score' => 29.99, 'points' => 5, 'description' => 'Fail'],
        ] as $grade) {
            GradingSystemDetail::firstOrCreate(
                [
                    'grading_system_id' => $subjectGrading->id,
                    'grade' => $grade['grade'],
                ],
                [
                    'id' => (string) Str::uuid(),
                    'min_score' => $grade['min_score'],
                    'max_score' => $grade['max_score'],
                    'points' => $grade['points'],
                    'description' => $grade['description'],
                ]
            );
        }

        $divisionGrading = GradingSystem::firstOrCreate(
            ['type' => 'division', 'class_level_id' => null],
            [
                'id' => (string) Str::uuid(),
                'name' => 'NECTA Division Points',
            ]
        );

        foreach ([
            ['grade' => 'I', 'min_points' => 7, 'max_points' => 17, 'description' => 'Division I'],
            ['grade' => 'II', 'min_points' => 18, 'max_points' => 21, 'description' => 'Division II'],
            ['grade' => 'III', 'min_points' => 22, 'max_points' => 25, 'description' => 'Division III'],
            ['grade' => 'IV', 'min_points' => 26, 'max_points' => 33, 'description' => 'Division IV'],
            ['grade' => '0', 'min_points' => 34, 'max_points' => 35, 'description' => 'Division 0'],
        ] as $grade) {
            GradingSystemDetail::firstOrCreate(
                [
                    'grading_system_id' => $divisionGrading->id,
                    'grade' => $grade['grade'],
                ],
                [
                    'id' => (string) Str::uuid(),
                    'min_score' => 0.00,
                    'max_score' => 0.00,
                    'min_points' => $grade['min_points'],
                    'max_points' => $grade['max_points'],
                    'points' => 0,
                    'description' => $grade['description'],
                ]
            );
        }
    }
}
