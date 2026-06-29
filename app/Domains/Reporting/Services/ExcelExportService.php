<?php

namespace App\Domains\Reporting\Services;

use App\Domains\Examination\Models\Examination;
use App\Domains\Results\Models\Mark;
use App\Domains\Results\Models\StudentExamSummary;
use App\Domains\Results\Models\SchoolExamSummary;
use App\Domains\Results\Models\SubjectExamSummary;
use App\Domains\School\Models\School;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Collection;

/**
 * Excel export service for all DERMS report types.
 */
class ExcelExportService
{
    public function __construct(
        private ReportingDataService $reportingDataService,
    ) {}

    /**
     * Export Merit List to Excel download.
     */
    public function exportMeritList(
        Examination $exam,
        string $classLevelId,
        ?string $schoolId = null
    ) {
        $students = $this->reportingDataService->getMeritList($exam, $classLevelId, $schoolId);

        $fileName = 'Merit_List_' . str_replace(' ', '_', $exam->name) . '.xlsx';

        return Excel::download(
            new MeritListExport($students, $exam),
            $fileName
        );
    }

    /**
     * Export School Summary to Excel.
     */
    public function exportSchoolSummary(
        Examination $exam,
        string $schoolId,
        string $classLevelId
    ) {
        $bundle = $this->reportingDataService->getSchoolSummary($exam, $schoolId, $classLevelId);
        $school = $bundle['school'];
        $summary = $bundle['summary'];
        $subjectPerformance = $bundle['subjectPerformance'];

        $fileName = 'School_Summary_' . str_replace(' ', '_', $school->name) . '.xlsx';

        return Excel::download(
            new SchoolSummaryExport($school, $summary, $subjectPerformance, $exam),
            $fileName
        );
    }

    /**
     * Export District Summary to Excel.
     */
    public function exportDistrictSummary(Examination $exam, string $classLevelId)
    {
        $schools = $this->reportingDataService->getDistrictSummary($exam, $classLevelId);

        $fileName = 'District_Summary_' . str_replace(' ', '_', $exam->name) . '.xlsx';

        return Excel::download(
            new DistrictSummaryExport($schools, $exam),
            $fileName
        );
    }
}

// ──────────────────────────────────────────────────────
// Merit List Export (single sheet)
// ──────────────────────────────────────────────────────
class MeritListExport implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    public function __construct(
        private Collection $students,
        private Examination $exam,
    ) {}

    public function collection(): Collection
    {
        return $this->students->map(function ($s, $index) {
            return [
                'position'         => $index + 1,
                'exam_number'      => $s->exam_number,
                'student_name'     => strtoupper($s->first_name . ' ' . $s->last_name),
                'gender'           => $s->gender,
                'school'           => $s->school_name,
                'total_marks'      => $s->total_marks,
                'average_marks'    => round($s->average_marks, 2),
                'gpa'              => round($s->gpa, 4),
                'division_points'  => $s->division_points,
                'division'         => $s->division,
                'school_position'  => $s->school_position,
                'district_position' => $s->district_position,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Position', 'Exam Number', 'Student Name', 'Gender', 'School',
            'Total Marks', 'Average', 'GPA', 'Division Points', 'Division',
            'School Pos.', 'District Pos.',
        ];
    }

    public function title(): string
    {
        return 'Merit List';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '0F4C81']],
            ],
        ];
    }
}

// ──────────────────────────────────────────────────────
// School Summary Export (two sheets)
// ──────────────────────────────────────────────────────
class SchoolSummaryExport implements WithMultipleSheets
{
    public function __construct(
        private School $school,
        private SchoolExamSummary $summary,
        private Collection $subjectPerformance,
        private Examination $exam,
    ) {}

    public function sheets(): array
    {
        return [
            new SchoolOverviewSheet($this->school, $this->summary),
            new SubjectPerformanceSheet($this->subjectPerformance),
        ];
    }
}

class SchoolOverviewSheet implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    public function __construct(
        private School $school,
        private SchoolExamSummary $summary,
    ) {}

    public function collection(): Collection
    {
        return collect([[
            $this->school->name,
            $this->summary->registered_candidates,
            $this->summary->sat_candidates,
            $this->summary->absent_candidates,
            round($this->summary->pass_rate, 1) . '%',
            round($this->summary->total_gpa, 4),
            $this->summary->division_i_count,
            $this->summary->division_ii_count,
            $this->summary->division_iii_count,
            $this->summary->division_iv_count,
            $this->summary->division_zero_count,
            $this->summary->school_position_district,
        ]]);
    }

    public function headings(): array
    {
        return [
            'School', 'Registered', 'Sat', 'Absent', 'Pass Rate',
            'Avg GPA', 'Div I', 'Div II', 'Div III', 'Div IV', 'Div 0', 'District Position',
        ];
    }

    public function title(): string
    {
        return 'School Overview';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '0F4C81']],
            ],
        ];
    }
}

class SubjectPerformanceSheet implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    public function __construct(private Collection $subjectPerformance) {}

    public function collection(): Collection
    {
        return $this->subjectPerformance->map(function ($sp, $index) {
            $passed = $sp->sat_candidates - $sp->grade_f_count;
            $passRate = $sp->sat_candidates > 0 ? round($passed / $sp->sat_candidates * 100, 1) : 0;
            return [
                'num'          => $index + 1,
                'subject'      => $sp->subject->name ?? 'N/A',
                'registered'   => $sp->registered_candidates,
                'sat'          => $sp->sat_candidates,
                'pass_rate'    => $passRate . '%',
                'avg_marks'    => round($sp->average_score, 2),
                'avg_gpa'      => round($sp->gpa, 4),
            ];
        });
    }

    public function headings(): array
    {
        return ['#', 'Subject', 'Registered', 'Sat', 'Pass Rate', 'Avg Marks', 'Avg GPA'];
    }

    public function title(): string
    {
        return 'Subject Performance';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '198754']],
            ],
        ];
    }
}

// ──────────────────────────────────────────────────────
// District Summary Export (single sheet)
// ──────────────────────────────────────────────────────
class DistrictSummaryExport implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    public function __construct(
        private Collection $schools,
        private Examination $exam,
    ) {}

    public function collection(): Collection
    {
        return $this->schools->map(function ($s) {
            return [
                'position'    => $s->school_position_district,
                'school'      => strtoupper($s->school->name ?? 'N/A'),
                'candidates'  => $s->registered_candidates,
                'sat'         => $s->sat_candidates,
                'pass_rate'   => round($s->pass_rate, 1) . '%',
                'gpa'         => round($s->total_gpa, 4),
                'div1'        => $s->division_i_count,
                'div2'        => $s->division_ii_count,
                'div3'        => $s->division_iii_count,
                'div4'        => $s->division_iv_count,
                'div0'        => $s->division_zero_count,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Position', 'School Name', 'Candidates', 'Passed', 'Pass Rate',
            'Avg GPA', 'Div I', 'Div II', 'Div III', 'Div IV', 'Div 0',
        ];
    }

    public function title(): string
    {
        return 'District School Ranking';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '0F4C81']],
            ],
        ];
    }
}
