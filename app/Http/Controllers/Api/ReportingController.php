<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\Examination\Models\Examination;
use App\Domains\Reporting\Services\PdfReportService;
use App\Domains\Reporting\Services\ExcelExportService;
use App\Domains\Reporting\Services\ReportingDataService;
use App\Http\Requests\Api\Reporting\DistrictSummaryRequest;
use App\Http\Requests\Api\Reporting\MeritListRequest;
use App\Http\Requests\Api\Reporting\SchoolSummaryRequest;
use App\Http\Requests\Api\Reporting\StudentSlipRequest;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportingController extends Controller
{
    public function __construct(
        private PdfReportService $pdfService,
        private ExcelExportService $excelService,
        private ReportingDataService $dataService,
    ) {}

    // ──────────────────────────────────────────────
    // MERIT LIST
    // ──────────────────────────────────────────────

    /**
     * Fetch Merit List as JSON.
     */
    public function getMeritList(MeritListRequest $request, string $examId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $criteria = $request->toData($examId);

        return response()->json(
            $this->dataService->getMeritList($exam, $criteria->classLevelId, $criteria->schoolId)
        );
    }

    /**
     * Download Merit List as PDF.
     */
    public function exportMeritListPdf(MeritListRequest $request, string $examId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);

        $criteria = $request->toData($examId);
        $pdf = $this->pdfService->generateMeritListPdf(
            $exam,
            $criteria->classLevelId,
            $criteria->schoolId
        );

        $fileName = 'Merit_List_' . str_replace(' ', '_', $exam->name) . '.pdf';

        return $pdf->download($fileName);
    }

    /**
     * Download Merit List as Excel (.xlsx).
     */
    public function exportMeritListExcel(MeritListRequest $request, string $examId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);

        $criteria = $request->toData($examId);
        return $this->excelService->exportMeritList(
            $exam,
            $criteria->classLevelId,
            $criteria->schoolId
        );
    }

    /**
     * Download Merit List as CSV (legacy fallback).
     */
    public function exportMeritListCsv(MeritListRequest $request, string $examId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $criteria = $request->toData($examId);
        $list = $this->dataService->getMeritListQuery($examId, $criteria->classLevelId, $criteria->schoolId)->get();

        $response = new StreamedResponse(function () use ($list) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'Exam Number', 'Student Name', 'Gender', 'School Name',
                'Total Marks', 'Average Marks', 'GPA', 'Division Points',
                'Division', 'School Rank', 'District Rank'
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
                    $row->district_position
                ]);
            }

            fclose($handle);
        });

        $fileName = 'Merit_List_' . str_replace(' ', '_', $exam->name) . '.csv';
        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $fileName . '"');

        return $response;
    }

    // ──────────────────────────────────────────────
    // STUDENT RESULT SLIP
    // ──────────────────────────────────────────────

    /**
     * Fetch student results slip as JSON.
     */
    public function getStudentSlip(StudentSlipRequest $request, string $examId, string $registrationId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $request->toData($examId, $registrationId);

        return response()->json(
            $this->dataService->getStudentSlip($examId, $registrationId)
        );
    }

    /**
     * Download student result slip as PDF.
     */
    public function exportStudentSlipPdf(string $examId, string $registrationId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);

        $pdf = $this->pdfService->generateStudentSlip($examId, $registrationId);

        $fileName = 'Student_Slip_' . $registrationId . '.pdf';

        return $pdf->download($fileName);
    }

    // ──────────────────────────────────────────────
    // SCHOOL SUMMARY
    // ──────────────────────────────────────────────

    /**
     * Fetch school aggregate summary as JSON.
     */
    public function getSchoolSummary(SchoolSummaryRequest $request, string $examId, string $schoolId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $request->toData($examId, $schoolId, $classLevelId);

        return response()->json(
            $this->dataService->getSchoolSummary($exam, $schoolId, $classLevelId)
        );
    }

    /**
     * Download school summary as PDF.
     */
    public function exportSchoolSummaryPdf(string $examId, string $schoolId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);

        $pdf = $this->pdfService->generateSchoolSummaryPdf($exam, $schoolId, $classLevelId);

        $fileName = 'School_Summary_' . $schoolId . '.pdf';

        return $pdf->download($fileName);
    }

    /**
     * Download school summary as Excel.
     */
    public function exportSchoolSummaryExcel(string $examId, string $schoolId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);

        return $this->excelService->exportSchoolSummary($exam, $schoolId, $classLevelId);
    }

    // ──────────────────────────────────────────────
    // DISTRICT SUMMARY
    // ──────────────────────────────────────────────

    /**
     * Fetch district aggregate summaries as JSON.
     */
    public function getDistrictSummary(DistrictSummaryRequest $request, string $examId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $request->toData($examId, $classLevelId);

        return response()->json(
            $this->dataService->getDistrictSummary($exam, $classLevelId)
        );
    }

    /**
     * Download district summary as PDF.
     */
    public function exportDistrictSummaryPdf(string $examId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);

        $pdf = $this->pdfService->generateDistrictSummaryPdf($exam, $classLevelId);

        $fileName = 'District_Summary_' . str_replace(' ', '_', $exam->name) . '.pdf';

        return $pdf->download($fileName);
    }

    /**
     * Download district summary as Excel.
     */
    public function exportDistrictSummaryExcel(string $examId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);

        return $this->excelService->exportDistrictSummary($exam, $classLevelId);
    }
}
