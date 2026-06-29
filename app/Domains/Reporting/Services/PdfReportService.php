<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Examination\Models\Examination;
use App\Domains\School\Models\School;
use Barryvdh\DomPDF\Facade\Pdf;

class PdfReportService
{
    public function __construct(
        private ReportingDataService $reportingDataService,
    ) {}

    /**
     * Generate a single student result slip PDF.
     */
    public function generateStudentSlip(string $examId, string $registrationId): \Barryvdh\DomPDF\PDF
    {
        $data = $this->reportingDataService->getStudentSlip($examId, $registrationId);

        $data['generated_at'] = now()->format('d M Y H:i');

        return Pdf::loadView('reports.student_slip', $data)
            ->setPaper('a4', 'portrait')
            ->setOption('dpi', 150);
    }

    /**
     * Generate Merit List PDF for a class level within an exam.
     */
    public function generateMeritListPdf(
        Examination $exam,
        string $classLevelId,
        ?string $schoolId = null
    ): \Barryvdh\DomPDF\PDF {
        $students = $this->reportingDataService->getMeritList($exam, $classLevelId, $schoolId);
        $data = [
            'exam' => $exam,
            'students' => $students,
            'school' => $schoolId ? School::find($schoolId) : null,
            'generated_at' => now()->format('d M Y H:i'),
        ];

        return Pdf::loadView('reports.merit_list', $data)
            ->setPaper('a4', 'landscape')
            ->setOption('dpi', 150);
    }

    /**
     * Generate School Performance Summary PDF.
     */
    public function generateSchoolSummaryPdf(
        Examination $exam,
        string $schoolId,
        string $classLevelId
    ): \Barryvdh\DomPDF\PDF {
        $dataBundle = $this->reportingDataService->getSchoolSummary($exam, $schoolId, $classLevelId);

        $data = [
            'exam' => $exam,
            'school' => $dataBundle['school'],
            'summary' => $dataBundle['summary'],
            'subject_performance' => $dataBundle['subjectPerformance'],
            'generated_at' => now()->format('d M Y H:i'),
        ];

        return Pdf::loadView('reports.school_summary', $data)
            ->setPaper('a4', 'portrait')
            ->setOption('dpi', 150);
    }

    /**
     * Generate District Summary PDF (all schools ranked).
     */
    public function generateDistrictSummaryPdf(
        Examination $exam,
        string $classLevelId
    ): \Barryvdh\DomPDF\PDF {
        $schools = $this->reportingDataService->getDistrictSummary($exam, $classLevelId);

        $data = [
            'exam' => $exam,
            'schools' => $schools,
            'generated_at' => now()->format('d M Y H:i'),
        ];

        return Pdf::loadView('reports.district_summary', $data)
            ->setPaper('a4', 'landscape')
            ->setOption('dpi', 150);
    }
}
