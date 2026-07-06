<?php

namespace App\Domains\School\Services;

use App\Domains\School\Models\AcademicYear;
use App\Domains\School\Models\ClassLevel;
use App\Domains\School\Models\DivisionRule;
use App\Domains\School\Models\GradingSystem;
use App\Domains\School\Models\GradingSystemDetail;
use App\Domains\School\Models\Subject;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AcademicCatalogService
{
    public function listAcademicYears()
    {
        return AcademicYear::orderBy('start_date', 'desc')->get();
    }

    public function storeAcademicYear(array $data): AcademicYear
    {
        return DB::transaction(function () use ($data): AcademicYear {
            if (!empty($data['is_active'])) {
                AcademicYear::where('is_active', true)->update(['is_active' => false]);
            }

            return AcademicYear::create($data);
        });
    }

    public function updateAcademicYear(AcademicYear $year, array $data): AcademicYear
    {
        return DB::transaction(function () use ($year, $data): AcademicYear {
            if (!empty($data['is_active'])) {
                AcademicYear::where('id', '!=', $year->id)->where('is_active', true)->update(['is_active' => false]);
            }

            $year->update($data);
            return $year->fresh();
        });
    }

    public function listClassLevels()
    {
        return ClassLevel::orderBy('numeric_level')->get();
    }

    public function storeClassLevel(array $data): ClassLevel
    {
        return ClassLevel::create($data);
    }

    public function updateClassLevel(ClassLevel $level, array $data): ClassLevel
    {
        $level->update($data);
        return $level->fresh();
    }

    public function importClassLevels(UploadedFile $file): int
    {
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);
        $created = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($header, $row);
            if (empty($data['name'])) {
                continue;
            }

            ClassLevel::updateOrCreate(
                ['name' => $data['name']],
                ['numeric_level' => $data['numeric_level'] ?? null],
            );
            $created++;
        }

        fclose($handle);
        return $created;
    }

    public function classLevelTemplate(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="class_level_template.csv"',
        ];

        return new StreamedResponse(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['name', 'numeric_level']);
            fputcsv($out, ['Form 1', '1']);
            fclose($out);
        }, 200, $headers);
    }

    public function listSubjects()
    {
        return Subject::with('classLevel')->get();
    }

    public function showSubject(Subject $subject): Subject
    {
        return $subject->load('classLevel');
    }

    public function storeSubject(array $data): Subject
    {
        return Subject::create($data);
    }

    public function updateSubject(Subject $subject, array $data): Subject
    {
        $subject->update($data);
        return $subject->fresh(['classLevel']);
    }

    public function deleteSubject(Subject $subject): void
    {
        $subject->delete();
    }

    public function importSubjects(UploadedFile $file): int
    {
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);
        $created = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($header, $row);
            if (empty($data['name']) || empty($data['code'])) {
                continue;
            }

            Subject::updateOrCreate(
                ['code' => $data['code']],
                [
                    'name' => $data['name'],
                    'short_name' => $data['short_name'] ?? null,
                    'description' => $data['description'] ?? null,
                    'class_level_id' => $data['class_level_id'] ?? null,
                    'is_active' => isset($data['is_active']) ? filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN) : true,
                ]
            );
            $created++;
        }

        fclose($handle);
        return $created;
    }

    public function subjectTemplate(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="subject_template.csv"',
        ];

        return new StreamedResponse(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['name', 'short_name', 'code', 'description', 'class_level_id', 'is_active']);
            fputcsv($out, ['Mathematics', 'MAT', 'MATH', 'Core math subject', '', 'true']);
            fclose($out);
        }, 200, $headers);
    }

    public function listDivisionRules()
    {
        return DivisionRule::orderBy('min_points')->get();
    }

    public function storeDivisionRule(array $data): DivisionRule
    {
        return DivisionRule::create($data);
    }

    public function updateDivisionRule(DivisionRule $rule, array $data): DivisionRule
    {
        $rule->update($data);
        return $rule->fresh();
    }

    public function deleteDivisionRule(DivisionRule $rule): void
    {
        $rule->delete();
    }

    public function listGradingDetails()
    {
        return GradingSystemDetail::with('gradingSystem')
            ->orderBy('min_score', 'desc')
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'label' => $d->grade,
                'min_percent' => $d->min_score,
                'max_percent' => $d->max_score,
                'points' => $d->points,
                'description' => $d->description,
                'system_name' => $d->gradingSystem?->name,
            ]);
    }

    public function storeGradingDetail(array $data)
    {
        $system = GradingSystem::firstOrCreate(
            ['name' => 'NECTA Standard', 'type' => 'subject'],
            ['id' => (string) \Illuminate\Support\Str::uuid()]
        );

        $detail = GradingSystemDetail::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'grading_system_id' => $system->id,
            'grade' => $data['label'],
            'min_score' => $data['min_percent'],
            'max_score' => $data['max_percent'],
            'points' => $data['points'],
            'description' => $data['description'] ?? null,
        ]);

        return [
            'id' => $detail->id,
            'label' => $detail->grade,
            'min_percent' => $detail->min_score,
            'max_percent' => $detail->max_score,
            'points' => $detail->points,
        ];
    }

    public function deleteGradingDetail(GradingSystemDetail $detail): void
    {
        $detail->delete();
    }
}
