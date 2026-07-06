<?php

namespace App\Domains\Student\Services;

use App\Domains\School\Models\School;
use App\Domains\Student\Models\AcademicYear;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\Student\Models\Student;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Protection;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentExcelImportService
{
    public function downloadTemplate(
        ?School $school = null,
        ?ClassLevel $classLevel = null,
        ?AcademicYear $academicYear = null
    ): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $instructions = $spreadsheet->getActiveSheet();
        $instructions->setTitle('Instructions');
        $instructions->setCellValue('A1', 'IDEMS Student Excel Import Template');
        $instructions->setCellValue('A3', 'Fill only the unlocked cells on the Data sheet.');
        $instructions->setCellValue('A4', 'School_reg (Leave blank - auto school prefix).');
        $instructions->setCellValue('A5', 'Template scope: ' . ($school?->name ?? 'Any school') . ' / ' . ($classLevel?->name ?? 'Any class') . ' / ' . ($academicYear?->name ?? 'Any academic year'));
        $instructions->setCellValue('A6', 'Only enter the Student_reg, first/last names, gender, DOB and parent details.');
        $instructions->setCellValue('A7', 'Do not rename sheets or remove columns.');
        $instructions->setCellValue('A8', 'The class level is selected in the system before import, so this file must only be used for that class scope.');
        $instructions->setCellValue('A9', 'Student_reg is school+class+year scoped: the same suffix can repeat in different classes, but must stay unique within the same school, class and academic year.');
        $instructions->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $instructions->getColumnDimension('A')->setWidth(90);
        $instructions->getProtection()->setSheet(true);

        $sheet = new Worksheet($spreadsheet, 'Student Import');
        $spreadsheet->addSheet($sheet, 1);

        $headers = [
            'School_reg',
            'Student_reg',
            'first_name',
            'middle_name',
            'last_name',
            'gender',
            'date_of_birth',
            'parent_name',
            'parent_phone',
        ];

        $prefix = $school
            ? $school->candidateRegistrationPrefix()
            : 'S0101';
        $sampleRows = $this->buildSampleRows($school, $classLevel, $academicYear, $prefix);

        $sheet->setCellValue('A1', 'IDEMS Student Import');
        $sheet->setCellValue('A2', 'School_reg (Leave blank - auto school prefix): ' . $prefix);
        $sheet->setCellValue('A3', 'Class Level: ' . ($classLevel?->name ?? 'Any class'));
        $sheet->setCellValue('A4', 'Academic Year: ' . ($academicYear?->name ?? 'Any academic year'));
        $sheet->fromArray([$headers], null, 'A5');
        $sheet->fromArray($sampleRows, null, 'A6');

        $this->styleTemplate($sheet);
        $this->applyValidations($sheet);

        $sheet->getStyle('A5:I5')->getProtection()->setLocked(Protection::PROTECTION_PROTECTED);
        for ($row = 6; $row <= 500; $row++) {
            $sheet->getStyle("A{$row}:I{$row}")->getProtection()->setLocked(Protection::PROTECTION_UNPROTECTED);
            $sheet->getStyle("A{$row}")->getProtection()->setLocked(Protection::PROTECTION_PROTECTED);
        }

        $sheet->getProtection()->setSheet(true);
        $sheet->getProtection()->setSort(true);
        $sheet->getProtection()->setInsertRows(false);
        $sheet->getProtection()->setDeleteRows(false);
        $sheet->getProtection()->setFormatCells(false);

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');

        return response()->streamDownload(function () use ($writer): void {
            $writer->save('php://output');
        }, 'IDEMS_Student_Import_Template.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function parseRows(UploadedFile $file, ?School $school = null, ?ClassLevel $classLevel = null, ?AcademicYear $academicYear = null): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet = $spreadsheet->getSheetByName('Student Import') ?? $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, false);

        $dataRows = array_slice($rows, 5);
        $parsed = [];

        foreach ($dataRows as $index => $row) {
            if ($this->isEmptyRow($row)) {
                continue;
            }

            $prefix = strtoupper(trim((string) ($row[0] ?? '')));
            if ($prefix === '' && $school && $classLevel) {
                $prefix = $school->candidateRegistrationPrefix();
            }

            $suffix = preg_replace('/\D+/', '', (string) ($row[1] ?? ''));
            if ($suffix !== '') {
                $suffix = str_pad($suffix, 4, '0', STR_PAD_LEFT);
            }

            $parsed[] = [
                'registration_prefix' => $prefix,
                'registration_suffix' => $suffix,
                'first_name' => trim((string) ($row[2] ?? '')),
                'middle_name' => trim((string) ($row[3] ?? '')),
                'last_name' => trim((string) ($row[4] ?? '')),
                'gender' => strtoupper(trim((string) ($row[5] ?? ''))),
                'date_of_birth' => trim((string) ($row[6] ?? '')),
                'parent_name' => trim((string) ($row[7] ?? '')),
                'parent_phone' => trim((string) ($row[8] ?? '')),
                '_row' => $index + 6,
            ];
        }

        return $parsed;
    }

    public function validateRows(array $rows, ?School $school = null, ?ClassLevel $classLevel = null, ?AcademicYear $academicYear = null): array
    {
        $validRows = [];
        $invalidRows = [];

        foreach ($rows as $row) {
            $errors = [];

            if (($row['registration_prefix'] ?? '') === '' && $school && $classLevel) {
                $row['registration_prefix'] = $school->candidateRegistrationPrefix();
            }

            foreach (['registration_suffix', 'first_name', 'last_name', 'gender', 'parent_phone'] as $field) {
                if (empty($row[$field])) {
                    $errors[] = 'Missing: ' . $this->friendlyColumnName($field);
                }
            }

            if (!empty($row['registration_prefix']) && !preg_match('/^[SP]\d{4}$/', strtoupper($row['registration_prefix']))) {
                $errors[] = 'School_reg must match S0101 or P0104';
            }

            if (!empty($row['registration_suffix']) && !preg_match('/^\d{1,4}$/', $row['registration_suffix'])) {
                $errors[] = 'Student_reg must be 1 to 4 digits';
            }

            if (!empty($row['gender']) && !in_array(strtoupper($row['gender']), ['M', 'F'], true)) {
                $errors[] = 'gender must be M or F';
            }

            if (!empty($row['date_of_birth']) && !strtotime($row['date_of_birth'])) {
                $errors[] = 'date_of_birth must be YYYY-MM-DD';
            }

            if (empty($errors) && $school) {
                $registrationNumber = $this->buildRegistrationNumber($row['registration_prefix'], $row['registration_suffix']);

                [$prefixPart, $suffixPart] = array_pad(explode('/', $registrationNumber, 2), 2, '');
                $duplicateQuery = Student::where('school_id', $school->id)
                    ->when($academicYear, fn ($query) => $query->where('academic_year_id', $academicYear->id))
                    ->when($classLevel, fn ($query) => $query->where('current_class_level_id', $classLevel->id))
                    ->where(function ($query) use ($registrationNumber, $prefixPart, $suffixPart) {
                        $query->where('registration_number', $registrationNumber);

                        if ($prefixPart !== '' && $suffixPart !== '') {
                            $query->orWhere('registration_number', 'like', $prefixPart . '/F%/' . $suffixPart);
                        }
                    });

                if ($registrationNumber && $duplicateQuery->exists()) {
                    $errors[] = "Duplicate {$registrationNumber} already exists in the selected school, class and academic year";
                }
            }

            $row['_errors'] = $errors;
            $row['_valid'] = empty($errors);

            if ($row['_valid']) {
                $validRows[] = $row;
            } else {
                $invalidRows[] = $row;
            }
        }

        return compact('validRows', 'invalidRows');
    }

    public function materializeRows(array $rows): array
    {
        return array_map(function (array $row): array {
            $prefix = strtoupper(trim((string) $row['registration_prefix']));
            $suffix = str_pad(preg_replace('/\D+/', '', (string) $row['registration_suffix']), 4, '0', STR_PAD_LEFT);

            $row['registration_number'] = "{$prefix}/{$suffix}";
            unset($row['registration_prefix'], $row['registration_suffix']);

            return $row;
        }, $rows);
    }

    private function styleTemplate(Worksheet $sheet): void
    {
        $sheet->getStyle('A1:I4')->getFont()->setBold(true);
        $sheet->getStyle('A5:I5')->getFont()->setBold(true);
        $sheet->getStyle('A5:I500')->getAlignment()->setWrapText(true);
        $sheet->getStyle('A5:I500')->getBorders()->getAllBorders()->setBorderStyle('thin');
        $sheet->getStyle('A5:I5')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('DCE6F1');
        $sheet->getStyle('A1:I4')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F8FAFC');
        $sheet->getColumnDimension('A')->setWidth(18);
        $sheet->getColumnDimension('B')->setWidth(14);
        $sheet->getColumnDimension('C')->setWidth(18);
        $sheet->getColumnDimension('D')->setWidth(18);
        $sheet->getColumnDimension('E')->setWidth(18);
        $sheet->getColumnDimension('F')->setWidth(12);
        $sheet->getColumnDimension('G')->setWidth(16);
        $sheet->getColumnDimension('H')->setWidth(22);
        $sheet->getColumnDimension('I')->setWidth(18);
        $sheet->freezePane('A6');
        $sheet->setAutoFilter('A5:I5');

        for ($row = 6; $row <= 500; $row++) {
            $sheet->getStyle("A{$row}:B{$row}")->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_TEXT);
        }
    }

    private function applyValidations(Worksheet $sheet): void
    {
        $genderValidation = new DataValidation();
        $genderValidation->setType(DataValidation::TYPE_LIST);
        $genderValidation->setFormula1('"M,F"');
        $genderValidation->setAllowBlank(false);
        $genderValidation->setShowDropDown(true);

        for ($row = 6; $row <= 500; $row++) {
            $sheet->setDataValidation("F{$row}", clone $genderValidation);
        }
    }

    private function isEmptyRow(array $row): bool
    {
        foreach ($row as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }

    private function buildRegistrationNumber(string $prefix, string $suffix): string
    {
        $prefix = strtoupper(trim($prefix));
        $suffix = preg_replace('/\D+/', '', $suffix);

        if ($prefix === '' || $suffix === '') {
            return '';
        }

        return sprintf('%s/%s', $prefix, str_pad($suffix, 4, '0', STR_PAD_LEFT));
    }

    private function friendlyColumnName(string $field): string
    {
        return match ($field) {
            'registration_prefix' => 'School_reg',
            'registration_suffix' => 'Student_reg',
            'first_name' => 'first_name',
            'last_name' => 'last_name',
            'gender' => 'gender',
            'parent_phone' => 'parent_phone',
            default => $field,
        };
    }

    private function buildSampleRows(?School $school, ?ClassLevel $classLevel, ?AcademicYear $academicYear, string $prefix): array
    {
        $nextSuffix = $this->nextAvailableSuffix($school, $classLevel, $academicYear, $prefix);

        return [
            [$prefix, str_pad((string) $nextSuffix, 4, '0', STR_PAD_LEFT), 'Amina', 'Juma', 'Hassan', 'F', '2009-04-10', 'Juma Hassan', '0712345678'],
            [$prefix, str_pad((string) ($nextSuffix + 1), 4, '0', STR_PAD_LEFT), 'John', '', 'Mwalimu', 'M', '2008-11-22', 'Peter Mwalimu', '0756789012'],
        ];
    }

    private function nextAvailableSuffix(?School $school, ?ClassLevel $classLevel, ?AcademicYear $academicYear, string $prefix): int
    {
        if (!$school || !$classLevel || !$academicYear) {
            return 1;
        }

        $existing = Student::where('school_id', $school->id)
            ->where('academic_year_id', $academicYear->id)
            ->where('current_class_level_id', $classLevel->id)
            ->where('registration_number', 'like', $prefix . '/%')
            ->pluck('registration_number')
            ->map(function (string $registrationNumber): int {
                $parts = explode('/', $registrationNumber);
                $suffix = (string) (end($parts) ?: '0');

                return (int) preg_replace('/\D+/', '', $suffix);
            })
            ->filter(fn (int $suffix) => $suffix > 0)
            ->sort()
            ->values();

        if ($existing->isEmpty()) {
            return 1;
        }

        return $existing->max() + 1;
    }
}
