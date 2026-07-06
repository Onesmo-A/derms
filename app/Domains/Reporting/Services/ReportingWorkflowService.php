<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Examination\Models\Examination;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportingWorkflowService
{
    public function __construct(
        private PdfReportService $pdfService,
        private ExcelExportService $excelService,
        private ReportingDataService $dataService,
    ) {}

    public function getMeritList(string $examId, ?string $classLevelId, ?string $schoolId, ?string $districtId = null, ?string $regionId = null): mixed
    {
        $exam = Examination::findOrFail($examId);

        return $this->dataService->getMeritList($exam, $classLevelId, $schoolId, $districtId, $regionId);
    }

    public function exportMeritListPdf(string $examId, ?string $classLevelId, ?string $schoolId, ?string $districtId = null, ?string $regionId = null)
    {
        $exam = Examination::findOrFail($examId);

        return $this->pdfService->generateMeritListPdf($exam, $classLevelId, $schoolId, $districtId, $regionId);
    }

    public function exportMeritListExcel(string $examId, ?string $classLevelId, ?string $schoolId, ?string $districtId = null, ?string $regionId = null)
    {
        $exam = Examination::findOrFail($examId);

        return $this->excelService->exportMeritList($exam, $classLevelId, $schoolId, $districtId, $regionId);
    }

    public function exportMeritListCsv(string $examId, ?string $classLevelId, ?string $schoolId, ?string $districtId = null, ?string $regionId = null): StreamedResponse
    {
        $exam = Examination::findOrFail($examId);
        $list = $this->dataService->getMeritListQuery($examId, $classLevelId, $schoolId, $districtId, $regionId)->get();

        $response = new StreamedResponse(function () use ($list) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'Exam Number', 'Student Name', 'Gender', 'School Name',
                'Total Marks', 'Average Marks', 'GPA', 'Division Points',
                'Division', 'School Rank', 'District Rank',
            ]);

            foreach ($list as $row) {
                fputcsv($handle, [
                    $row->exam_number,
                    $row->first_name . ' ' . $row->last_name,
                    $row->gender,
                    $row->school_name,
                    $row->total_marks,
                    $row->average_marks,
                    $row->gpa,
                    $row->division_points,
                    $row->division,
                    $row->school_position,
                    $row->district_position,
                ]);
            }

            fclose($handle);
        });

        $fileName = 'Merit_List_' . str_replace(' ', '_', $exam->name) . '.csv';
        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $fileName . '"');

        return $response;
    }

    public function getStudentSlip(string $examId, string $registrationId): array
    {
        return $this->dataService->getStudentSlip($examId, $registrationId);
    }

    public function exportStudentSlipPdf(string $examId, string $registrationId)
    {
        return $this->pdfService->generateStudentSlip($examId, $registrationId);
    }

    public function getSchoolSummary(string $examId, string $schoolId, string $classLevelId): array
    {
        $exam = Examination::findOrFail($examId);

        return $this->dataService->getSchoolSummary($exam, $schoolId, $classLevelId);
    }

    public function exportSchoolSummaryPdf(string $examId, string $schoolId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);

        return $this->pdfService->generateSchoolSummaryPdf($exam, $schoolId, $classLevelId);
    }

    public function exportSchoolSummaryExcel(string $examId, string $schoolId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);

        return $this->excelService->exportSchoolSummary($exam, $schoolId, $classLevelId);
    }

    public function getDistrictSummary(string $examId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);

        return $this->dataService->getDistrictSummary($exam, $classLevelId);
    }

    public function exportDistrictSummaryPdf(string $examId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);

        return $this->pdfService->generateDistrictSummaryPdf($exam, $classLevelId);
    }

    public function exportDistrictSummaryExcel(string $examId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);

        return $this->excelService->exportDistrictSummary($exam, $classLevelId);
    }
}
