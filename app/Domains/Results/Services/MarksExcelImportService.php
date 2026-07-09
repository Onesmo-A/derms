<?php

namespace App\Domains\Results\Services;

use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Results\Models\Mark;
use App\Domains\School\Models\School;
use App\Enums\ExaminationRegistrationStatus;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Protection;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MarksExcelImportService
{
    private const TEMPLATE_VERSION = '1.0';
    private const INSTRUCTIONS_SHEET = 'Instructions';
    private const DATA_SHEET = 'Marks Import';
    private const META_SHEET = '__Meta';

    public function downloadTemplate(ExaminationSubject $examSubject, ?School $school = null): StreamedResponse
    {
        $examSubject->loadMissing(['examination', 'classLevel', 'subject']);

        $roster = $this->buildRoster($examSubject, $school);
        $meta = $this->buildMetaPayload($examSubject, $school, $roster);
        $layout = $this->buildLayout($examSubject->hasPracticalComponent());

        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()
            ->setCreator(config('app.name', 'IDEMS'))
            ->setTitle('IDEMS Marks Import Template')
            ->setSubject('Secure marks import template');

        $security = $spreadsheet->getSecurity();
        $sheetPassword = substr($meta['signature'], 0, 16);
        if (method_exists($security, 'setLockStructure')) {
            $security->setLockStructure(true);
        }
        if (method_exists($security, 'setLockWindows')) {
            $security->setLockWindows(true);
        }
        if (method_exists($security, 'setWorkbookPassword')) {
            $security->setWorkbookPassword($sheetPassword);
        }

        $instructions = $spreadsheet->getActiveSheet();
        $instructions->setTitle(self::INSTRUCTIONS_SHEET);
        $instructions->fromArray([
            ['IDEMS Marks Import Template'],
            ['Use only the unlocked marks cells on the data sheet.'],
            ['Paper 1 scores must stay between 0 and 100.'],
            ['Paper 2 scores must stay between 0 and 50 for practical subjects.'],
            ['Do not add, remove, rename, or reorder sheets or columns.'],
            ['Any structure change, hidden row tampering, or context mismatch will be rejected by the server.'],
            ['Template scope: ' . $this->scopeLabel($examSubject, $school)],
        ], null, 'A1');
        $instructions->getStyle('A1:A7')->getFont()->setBold(true);
        $instructions->getColumnDimension('A')->setWidth(120);
        $instructions->getStyle('A1:A7')->getAlignment()->setWrapText(true);
        if (method_exists($instructions->getProtection(), 'setPassword')) {
            $instructions->getProtection()->setPassword($sheetPassword);
        }
        $instructions->getProtection()->setSheet(true);
        $instructions->getProtection()->setFormatCells(false);

        $dataSheet = new Worksheet($spreadsheet, self::DATA_SHEET);
        $spreadsheet->addSheet($dataSheet, 1);
        $metaSheet = new Worksheet($spreadsheet, self::META_SHEET);
        $spreadsheet->addSheet($metaSheet, 2);

        $this->writeMetaSheet($metaSheet, $meta);
        $this->writeDataSheet($dataSheet, $examSubject, $school, $roster, $layout, $sheetPassword);

        $metaSheet->setSheetState(Worksheet::SHEETSTATE_VERYHIDDEN);

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');

        $filename = sprintf(
            'IDEMS_Marks_Import_Template_%s.xlsx',
            now()->format('Y-m-d')
        );

        return response()->streamDownload(function () use ($writer): void {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function parseTemplate(UploadedFile $file, ExaminationSubject $examSubject, ?School $school = null): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $meta = $this->readMetaSheet($spreadsheet);
        if (empty($meta)) {
            throw new \RuntimeException('The uploaded workbook is not the official IDEMS marks template for this selected context.');
        }

        $signature = (string) ($meta['signature'] ?? '');
        $storedMeta = $meta;
        unset($storedMeta['signature']);

        if ($signature === '' || !hash_equals($this->sign($storedMeta), $signature)) {
            throw new \RuntimeException('The workbook metadata has been modified or is not the official IDEMS template.');
        }

        $sheet = $spreadsheet->getSheetByName(self::DATA_SHEET) ?? $spreadsheet->getActiveSheet();
        $layout = $this->buildLayout($examSubject->hasPracticalComponent());
        $headers = $layout['headers'];

        if (($meta['template_version'] ?? '') !== self::TEMPLATE_VERSION) {
            throw new \RuntimeException('This workbook template version is not supported.');
        }

        if (($meta['examination_subject_id'] ?? '') !== $examSubject->id) {
            throw new \RuntimeException('This workbook was generated for a different subject.');
        }

        if ((string) ($meta['school_id'] ?? '') !== (string) ($school?->id ?? '')) {
            throw new \RuntimeException('This workbook was generated for a different school context.');
        }

        if (($meta['has_practical'] ?? false) !== (bool) $layout['has_practical']) {
            throw new \RuntimeException('This workbook practical/non-practical configuration does not match the selected subject.');
        }

        $headerRow = 5;
        foreach ($headers as $index => $header) {
            $cell = Coordinate::stringFromColumnIndex($index + 1) . $headerRow;
            $value = trim((string) $sheet->getCell($cell)->getValue());
            if ($value !== $header) {
                throw new \RuntimeException("Template structure changed. Expected '{$header}' at {$cell}.");
            }
        }

        $roster = $this->buildRoster($examSubject, $school)->keyBy('examination_registration_id');
        $expectedRosterSignature = $this->sign($this->rosterSignaturePayload($examSubject, $school, $roster->values()));
        if (($meta['roster_signature'] ?? '') !== $expectedRosterSignature) {
            throw new \RuntimeException('The candidate roster in the workbook does not match the official protected roster.');
        }

        $dataRows = [];
        $maxRow = max($sheet->getHighestDataRow(), $headerRow);

        for ($row = $headerRow + 1; $row <= $maxRow; $row++) {
            if ($this->isEmptyTemplateRow($sheet, $row, $layout['visibleColumns'])) {
                continue;
            }

            $registrationId = trim((string) $sheet->getCell($layout['columns']['registration_id'] . $row)->getValue());
            $signature = trim((string) $sheet->getCell($layout['columns']['row_signature'] . $row)->getValue());
            $expectedSignature = $this->rowSignature($examSubject, $school, $registrationId);

            if ($registrationId === '' || $signature === '' || !hash_equals($expectedSignature, $signature)) {
                throw new \RuntimeException("Row {$row} is tampered or missing its protected identifiers.");
            }

            $candidate = $roster->get($registrationId);
            if (! $candidate) {
                throw new \RuntimeException("Row {$row} references a candidate that is not part of the selected exam context.");
            }

            $examNumber = trim((string) $sheet->getCell($layout['columns']['exam_number'] . $row)->getValue());
            $candidateName = trim((string) $sheet->getCell($layout['columns']['candidate_name'] . $row)->getValue());

            if ($examNumber !== (string) $candidate['exam_number']) {
                throw new \RuntimeException("Row {$row} exam number does not match the selected candidate roster.");
            }

            $expectedName = $candidate['student_name'];
            if (mb_strtolower($candidateName) !== mb_strtolower($expectedName)) {
                throw new \RuntimeException("Row {$row} candidate name does not match the protected roster.");
            }

            $absent = strtoupper(trim((string) $sheet->getCell($layout['columns']['absent'] . $row)->getValue()));
            $absent = in_array($absent, ['Y', 'YES', '1', 'TRUE'], true);

            $paperOneRaw = trim((string) $sheet->getCell($layout['columns']['paper_one_score'] . $row)->getValue());
            $paperTwoRaw = $layout['has_practical']
                ? trim((string) $sheet->getCell($layout['columns']['paper_two_score'] . $row)->getValue())
                : '';

            $errors = [];
            $paperOne = null;
            $paperTwo = null;

            if (! $absent) {
                if ($paperOneRaw === '') {
                    $errors[] = 'Paper 1 is required.';
                } elseif (!is_numeric($paperOneRaw) || (float) $paperOneRaw < 0 || (float) $paperOneRaw > 100) {
                    $errors[] = 'Paper 1 must be between 0 and 100.';
                } else {
                    $paperOne = round((float) $paperOneRaw, 2);
                }

                if ($layout['has_practical']) {
                    if ($paperTwoRaw === '') {
                        $errors[] = 'Paper 2 is required for practical subjects.';
                    } elseif (!is_numeric($paperTwoRaw) || (float) $paperTwoRaw < 0 || (float) $paperTwoRaw > 50) {
                        $errors[] = 'Paper 2 must be between 0 and 50.';
                    } else {
                        $paperTwo = round((float) $paperTwoRaw, 2);
                    }
                }
            } elseif ($paperOneRaw !== '' || $paperTwoRaw !== '') {
                $errors[] = 'Leave marks blank when a candidate is marked absent.';
            }

            if ($errors !== []) {
                throw new \RuntimeException("Row {$row}: " . implode(' ', $errors));
            }

            $dataRows[] = [
                'examination_registration_id' => $registrationId,
                'student_name' => $candidate['student_name'],
                'exam_number' => $candidate['exam_number'],
                'registration_status' => $absent
                    ? ExaminationRegistrationStatus::Absent->value
                    : ExaminationRegistrationStatus::Registered->value,
                'paper_one_score' => $paperOne,
                'paper_two_score' => $layout['has_practical'] ? $paperTwo : null,
            ];
        }

        if ($dataRows === []) {
            throw new \RuntimeException('The worksheet does not contain any importable mark rows.');
        }

        if ($roster->count() !== count($dataRows)) {
            throw new \RuntimeException('The uploaded workbook has a different number of candidates than the official template.');
        }

        return [
            'meta' => $meta,
            'rows' => $dataRows,
            'candidate_count' => count($dataRows),
            'has_practical' => $layout['has_practical'],
        ];
    }

    private function writeDataSheet(Worksheet $sheet, ExaminationSubject $examSubject, ?School $school, Collection $roster, array $layout, string $sheetPassword): void
    {
        $sheet->setTitle(self::DATA_SHEET);
        $sheet->fromArray([[$this->scopeLabel($examSubject, $school)]], null, 'A1');
        $sheet->fromArray([['Only fill the yellow cells. The rest are locked and validated by the server.']], null, 'A2');
        $sheet->fromArray([$layout['headers']], null, 'A5');

        $sheet->mergeCells('A1:' . $layout['lastColumn'] . '1');
        $sheet->mergeCells('A2:' . $layout['lastColumn'] . '2');
        $sheet->getStyle('A1:' . $layout['lastColumn'] . '1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A2:' . $layout['lastColumn'] . '2')->getFont()->setBold(true);
        $sheet->getStyle('A1:' . $layout['lastColumn'] . '2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A1:' . $layout['lastColumn'] . '2')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle('A1:' . $layout['lastColumn'] . '2')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F8FAFC');
        $sheet->getStyle('A5:' . $layout['lastColumn'] . '5')->getFont()->setBold(true);
        $sheet->getStyle('A5:' . $layout['lastColumn'] . '5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A5:' . $layout['lastColumn'] . '5')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle('A5:' . $layout['lastColumn'] . '5')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('DCE6F1');
        $sheet->getStyle('A5:' . $layout['lastColumn'] . max(6, 5 + $roster->count()))
            ->getAlignment()
            ->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension(1)->setRowHeight(24);
        $sheet->getRowDimension(2)->setRowHeight(22);
        $sheet->getRowDimension(5)->setRowHeight(24);
        $sheet->getColumnDimension('A')->setWidth(18);
        $sheet->getColumnDimension('B')->setWidth(28);
        $sheet->getColumnDimension('C')->setWidth(18);
        $sheet->getColumnDimension('D')->setWidth($layout['has_practical'] ? 18 : 14);
        $sheet->getColumnDimension('E')->setWidth($layout['has_practical'] ? 14 : 24);
        if ($layout['has_practical']) {
            $sheet->getColumnDimension('F')->setWidth(24);
            $sheet->getColumnDimension('G')->setWidth(24);
        } else {
            $sheet->getColumnDimension('E')->setWidth(24);
            $sheet->getColumnDimension('F')->setWidth(24);
        }
        $sheet->freezePane('A6');
        $sheet->setAutoFilter('A5:' . $layout['lastColumn'] . '5');

        $rowNumber = 6;
        foreach ($roster as $row) {
            $sheet->setCellValue($layout['columns']['exam_number'] . $rowNumber, $row['exam_number']);
            $sheet->setCellValue($layout['columns']['candidate_name'] . $rowNumber, $row['student_name']);
            $sheet->setCellValue($layout['columns']['paper_one_score'] . $rowNumber, $row['paper_one_score'] ?? '');
            if ($layout['has_practical']) {
                $sheet->setCellValue($layout['columns']['paper_two_score'] . $rowNumber, $row['paper_two_score'] ?? '');
            }
            $sheet->setCellValue($layout['columns']['absent'] . $rowNumber, '');
            $sheet->setCellValue($layout['columns']['registration_id'] . $rowNumber, $row['examination_registration_id']);
            $sheet->setCellValue($layout['columns']['row_signature'] . $rowNumber, $this->rowSignature($examSubject, $school, $row['examination_registration_id']));

            $this->styleDataRow($sheet, $rowNumber, $layout);
            $this->applyRowValidation($sheet, $rowNumber, $layout);

            $rowNumber++;
        }

        foreach ($layout['hiddenColumns'] as $column) {
            $sheet->getColumnDimension($column)->setVisible(false);
        }

        foreach ($layout['editableColumns'] as $column) {
            $sheet->getStyle("{$column}6:{$column}" . ($rowNumber - 1))
                ->getProtection()
                ->setLocked(Protection::PROTECTION_UNPROTECTED);
            $sheet->getStyle("{$column}6:{$column}" . ($rowNumber - 1))
                ->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()
                ->setRGB('FFF2CC');
        }

        $sheet->getProtection()->setSheet(true);
        if (method_exists($sheet->getProtection(), 'setPassword')) {
            $sheet->getProtection()->setPassword($sheetPassword);
        }
        $sheet->getProtection()->setSort(true);
        $sheet->getProtection()->setInsertRows(false);
        $sheet->getProtection()->setDeleteRows(false);
        $sheet->getProtection()->setFormatCells(false);
        $sheet->getProtection()->setFormatColumns(false);
        $sheet->getProtection()->setFormatRows(false);
    }

    private function writeMetaSheet(Worksheet $sheet, array $meta): void
    {
        $sheet->setTitle(self::META_SHEET);
        $sheet->fromArray([
            ['key', 'value'],
        ], null, 'A1');

        $row = 2;
        foreach ($meta as $key => $value) {
            $sheet->setCellValueExplicit("A{$row}", (string) $key, DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("B{$row}", is_bool($value) ? ($value ? 'true' : 'false') : (string) $value, DataType::TYPE_STRING);
            $row++;
        }

        $sheet->getColumnDimension('A')->setWidth(28);
        $sheet->getColumnDimension('B')->setWidth(120);
    }

    private function buildRoster(ExaminationSubject $examSubject, ?School $school = null): Collection
    {
        $exam = $examSubject->examination;

        $registrations = ExaminationRegistration::with(['student'])
            ->where('examination_id', $exam->id)
            ->where('class_level_id', $examSubject->class_level_id)
            ->where('status', '!=', ExaminationRegistrationStatus::Disqualified->value)
            ->when($school, function ($query, School $school): void {
                $query->whereHas('student', function ($studentQuery) use ($school): void {
                    $studentQuery->where('school_id', $school->id);
                });
            })
            ->whereHas('student', function ($query) use ($examSubject): void {
                $query->whereHas('subjectRegistrations', function ($subjectQuery) use ($examSubject): void {
                    $subjectQuery->where('academic_year_id', $examSubject->examination->academic_year_id)
                        ->where('class_level_id', $examSubject->class_level_id)
                        ->where('subject_id', $examSubject->subject_id)
                        ->where('status', 'registered');
                });
            })
            ->orderBy('exam_number')
            ->get();

        $existingMarks = Mark::where('examination_subject_id', $examSubject->id)
            ->whereIn('examination_registration_id', $registrations->pluck('id'))
            ->get()
            ->keyBy('examination_registration_id');

        return $registrations->map(function (ExaminationRegistration $registration) use ($existingMarks): array {
            $mark = $existingMarks->get($registration->id);

            return [
                'examination_registration_id' => $registration->id,
                'student_name' => trim($registration->student->first_name . ' ' . $registration->student->last_name),
                'exam_number' => $registration->exam_number,
                'paper_one_score' => $mark?->paper_one_score,
                'paper_two_score' => $mark?->paper_two_score,
            ];
        });
    }

    private function buildMetaPayload(ExaminationSubject $examSubject, ?School $school, Collection $roster): array
    {
        $payload = [
            'template_version' => self::TEMPLATE_VERSION,
            'examination_id' => $examSubject->examination_id,
            'examination_subject_id' => $examSubject->id,
            'class_level_id' => $examSubject->class_level_id,
            'subject_id' => $examSubject->subject_id,
            'school_id' => $school?->id ?? '',
            'candidate_count' => $roster->count(),
            'has_practical' => $examSubject->hasPracticalComponent(),
            'generated_at' => now()->toIso8601String(),
        ];

        $payload['roster_signature'] = $this->sign($this->rosterSignaturePayload($examSubject, $school, $roster));
        $payload['signature'] = $this->sign($payload);

        return $payload;
    }

    private function readMetaSheet(Spreadsheet $spreadsheet): array
    {
        $sheet = $spreadsheet->getSheetByName(self::META_SHEET);
        if (! $sheet) {
            return [];
        }

        $meta = [];
        $row = 2;
        while (true) {
            $key = trim((string) $sheet->getCell("A{$row}")->getValue());
            $value = trim((string) $sheet->getCell("B{$row}")->getValue());
            if ($key === '') {
                break;
            }
            $meta[$key] = match ($key) {
                'candidate_count' => (int) $value,
                'has_practical' => in_array(strtolower($value), ['1', 'true', 'yes'], true),
                default => $value,
            };
            $row++;
        }

        return $meta;
    }

    private function buildLayout(bool $hasPractical): array
    {
        if ($hasPractical) {
            return [
                'has_practical' => true,
                'headers' => [
                    'Exam Number',
                    'Candidate Name',
                    'Paper 1 (/100)',
                    'Paper 2 (/50)',
                    'Absent (Y/N)',
                    'Registration ID',
                    'Row Signature',
                ],
                'columns' => [
                    'exam_number' => 'A',
                    'candidate_name' => 'B',
                    'paper_one_score' => 'C',
                    'paper_two_score' => 'D',
                    'absent' => 'E',
                    'registration_id' => 'F',
                    'row_signature' => 'G',
                ],
                'editableColumns' => ['C', 'D', 'E'],
                'hiddenColumns' => ['F', 'G'],
                'visibleColumns' => ['A', 'B', 'C', 'D', 'E'],
                'lastColumn' => 'G',
            ];
        }

        return [
            'has_practical' => false,
            'headers' => [
                'Exam Number',
                'Candidate Name',
                'Paper 1 (/100)',
                'Absent (Y/N)',
                'Registration ID',
                'Row Signature',
            ],
            'columns' => [
                'exam_number' => 'A',
                'candidate_name' => 'B',
                'paper_one_score' => 'C',
                'absent' => 'D',
                'registration_id' => 'E',
                'row_signature' => 'F',
            ],
            'editableColumns' => ['C', 'D'],
            'hiddenColumns' => ['E', 'F'],
            'visibleColumns' => ['A', 'B', 'C', 'D'],
            'lastColumn' => 'F',
        ];
    }

    private function styleDataRow(Worksheet $sheet, int $rowNumber, array $layout): void
    {
        $sheet->getStyle("A{$rowNumber}:" . $layout['lastColumn'] . $rowNumber)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
        $sheet->getStyle("A{$rowNumber}:{$layout['lastColumn']}{$rowNumber}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle("A{$rowNumber}:B{$rowNumber}")->getProtection()->setLocked(Protection::PROTECTION_PROTECTED);
    }

    private function applyRowValidation(Worksheet $sheet, int $rowNumber, array $layout): void
    {
        $absentValidation = new DataValidation();
        $absentValidation->setType(DataValidation::TYPE_LIST);
        $absentValidation->setFormula1('"N,Y"');
        $absentValidation->setAllowBlank(true);
        $absentValidation->setShowDropDown(true);
        $sheet->setDataValidation($layout['columns']['absent'] . $rowNumber, $absentValidation);

        $paperOneValidation = new DataValidation();
        $paperOneValidation->setType(DataValidation::TYPE_DECIMAL);
        $paperOneValidation->setOperator(DataValidation::OPERATOR_BETWEEN);
        $paperOneValidation->setFormula1('0');
        $paperOneValidation->setFormula2('100');
        $paperOneValidation->setAllowBlank(true);
        $paperOneValidation->setShowErrorMessage(true);
        $sheet->setDataValidation($layout['columns']['paper_one_score'] . $rowNumber, $paperOneValidation);

        if ($layout['has_practical']) {
            $paperTwoValidation = new DataValidation();
            $paperTwoValidation->setType(DataValidation::TYPE_DECIMAL);
            $paperTwoValidation->setOperator(DataValidation::OPERATOR_BETWEEN);
            $paperTwoValidation->setFormula1('0');
            $paperTwoValidation->setFormula2('50');
            $paperTwoValidation->setAllowBlank(true);
            $paperTwoValidation->setShowErrorMessage(true);
            $sheet->setDataValidation($layout['columns']['paper_two_score'] . $rowNumber, $paperTwoValidation);
        }
    }

    private function isEmptyTemplateRow(Worksheet $sheet, int $row, array $visibleColumns): bool
    {
        foreach ($visibleColumns as $column) {
            if (trim((string) $sheet->getCell($column . $row)->getValue()) !== '') {
                return false;
            }
        }

        return true;
    }

    private function rosterSignaturePayload(ExaminationSubject $examSubject, ?School $school, Collection $roster): array
    {
        return [
            'template_version' => self::TEMPLATE_VERSION,
            'examination_subject_id' => $examSubject->id,
            'school_id' => $school?->id ?? '',
            'candidate_ids' => $roster->pluck('examination_registration_id')->values()->all(),
        ];
    }

    private function rowSignature(ExaminationSubject $examSubject, ?School $school, string $registrationId): string
    {
        return $this->sign([
            'template_version' => self::TEMPLATE_VERSION,
            'examination_subject_id' => $examSubject->id,
            'school_id' => $school?->id ?? '',
            'registration_id' => $registrationId,
        ]);
    }

    private function sign(array $payload): string
    {
        $secret = (string) config('app.key', 'idems-marks-import');
        return hash_hmac('sha256', json_encode($payload, JSON_UNESCAPED_SLASHES), $secret);
    }

    private function scopeLabel(ExaminationSubject $examSubject, ?School $school): string
    {
        $exam = $examSubject->examination;

        return sprintf(
            '%s | %s | %s | %s%s',
            $exam->name,
            $examSubject->classLevel?->name ?? 'Unknown class',
            $examSubject->subject?->name ?? 'Unknown subject',
            $school?->name ?? 'All schools',
            $examSubject->hasPracticalComponent() ? ' | Theory + Practical' : ' | Theory only'
        );
    }
}

