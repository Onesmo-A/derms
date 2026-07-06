<?php

namespace App\Http\Controllers\Api;

use App\Domains\Examination\Models\Examination;
use App\Domains\Reporting\Services\ReportingWorkflowService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Reporting\DistrictSummaryRequest;
use App\Http\Requests\Api\Reporting\MeritListRequest;
use App\Http\Requests\Api\Reporting\SchoolSummaryRequest;
use App\Http\Requests\Api\Reporting\StudentSlipRequest;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportingController extends Controller
{
    public function __construct(
        private ReportingWorkflowService $reports,
    ) {}

    public function getMeritList(MeritListRequest $request, string $examId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $criteria = $request->toData($examId);

        return response()->json(
            $this->reports->getMeritList($examId, $criteria->classLevelId, $criteria->schoolId, $criteria->districtId, $criteria->regionId)
        );
    }

    public function exportMeritListPdf(MeritListRequest $request, string $examId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $criteria = $request->toData($examId);
        $pdf = $this->reports->exportMeritListPdf($examId, $criteria->classLevelId, $criteria->schoolId, $criteria->districtId, $criteria->regionId);

        $fileName = 'Merit_List_' . str_replace(' ', '_', $exam->name) . '.pdf';

        return $pdf->download($fileName);
    }

    public function exportMeritListExcel(MeritListRequest $request, string $examId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $criteria = $request->toData($examId);

        return $this->reports->exportMeritListExcel($examId, $criteria->classLevelId, $criteria->schoolId, $criteria->districtId, $criteria->regionId);
    }

    public function exportMeritListCsv(MeritListRequest $request, string $examId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $criteria = $request->toData($examId);

        return $this->reports->exportMeritListCsv($examId, $criteria->classLevelId, $criteria->schoolId, $criteria->districtId, $criteria->regionId);
    }

    public function getStudentSlip(StudentSlipRequest $request, string $examId, string $registrationId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $request->toData($examId, $registrationId);

        return response()->json($this->reports->getStudentSlip($examId, $registrationId));
    }

    public function exportStudentSlipPdf(string $examId, string $registrationId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $pdf = $this->reports->exportStudentSlipPdf($examId, $registrationId);

        return $pdf->download('Student_Slip_' . $registrationId . '.pdf');
    }

    public function getSchoolSummary(SchoolSummaryRequest $request, string $examId, string $schoolId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $request->toData($examId, $schoolId, $classLevelId);

        return response()->json($this->reports->getSchoolSummary($examId, $schoolId, $classLevelId));
    }

    public function exportSchoolSummaryPdf(string $examId, string $schoolId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $pdf = $this->reports->exportSchoolSummaryPdf($examId, $schoolId, $classLevelId);

        return $pdf->download('School_Summary_' . $schoolId . '.pdf');
    }

    public function exportSchoolSummaryExcel(string $examId, string $schoolId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);

        return $this->reports->exportSchoolSummaryExcel($examId, $schoolId, $classLevelId);
    }

    public function getDistrictSummary(DistrictSummaryRequest $request, string $examId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $request->toData($examId, $classLevelId);

        return response()->json($this->reports->getDistrictSummary($examId, $classLevelId));
    }

    public function exportDistrictSummaryPdf(string $examId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);
        $pdf = $this->reports->exportDistrictSummaryPdf($examId, $classLevelId);

        return $pdf->download('District_Summary_' . str_replace(' ', '_', $exam->name) . '.pdf');
    }

    public function exportDistrictSummaryExcel(string $examId, string $classLevelId)
    {
        $exam = Examination::findOrFail($examId);
        $this->authorize('view', $exam);

        return $this->reports->exportDistrictSummaryExcel($examId, $classLevelId);
    }
}
