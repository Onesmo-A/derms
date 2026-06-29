<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Student Result Slip - {{ $registration->student->first_name }} {{ $registration->student->last_name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 11px; color: #1a1a2e; line-height: 1.5; }

        .container { width: 100%; max-width: 750px; margin: 0 auto; padding: 20px; }

        /* Header */
        .header { text-align: center; border-bottom: 3px solid #0F4C81; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { font-size: 18px; color: #0F4C81; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
        .header h2 { font-size: 14px; color: #198754; margin-bottom: 2px; }
        .header h3 { font-size: 12px; color: #555; font-weight: normal; }
        .coat-of-arms { font-size: 32px; margin-bottom: 8px; display: block; }

        /* Info Panels */
        .info-grid { display: table; width: 100%; margin-bottom: 20px; }
        .info-row { display: table-row; }
        .info-label { display: table-cell; width: 35%; padding: 4px 8px; font-weight: bold; color: #0F4C81; background: #f0f4f8; border: 1px solid #ddd; }
        .info-value { display: table-cell; width: 65%; padding: 4px 8px; border: 1px solid #ddd; }

        /* Results Table */
        .results-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .results-table thead th {
            background: #0F4C81; color: white; padding: 8px 6px;
            text-align: center; font-size: 10px; text-transform: uppercase;
            letter-spacing: 0.5px; border: 1px solid #0a3a66;
        }
        .results-table tbody td {
            padding: 6px; text-align: center; border: 1px solid #ddd; font-size: 10px;
        }
        .results-table tbody tr:nth-child(even) { background: #f8f9fa; }
        .results-table tbody tr:hover { background: #e8f0fe; }
        .subject-name { text-align: left !important; font-weight: 600; }

        /* Grade Colors */
        .grade-a { color: #198754; font-weight: bold; }
        .grade-b { color: #0F4C81; font-weight: bold; }
        .grade-c { color: #D4AF37; font-weight: bold; }
        .grade-d { color: #fd7e14; font-weight: bold; }
        .grade-f { color: #dc3545; font-weight: bold; }

        /* Summary Box */
        .summary-box {
            background: linear-gradient(135deg, #0F4C81 0%, #1a6abd 100%);
            color: white; padding: 15px; border-radius: 4px; margin-bottom: 20px;
        }
        .summary-box h3 { font-size: 13px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 5px; }
        .summary-grid { display: table; width: 100%; }
        .summary-item { display: table-cell; text-align: center; padding: 5px; }
        .summary-number { font-size: 22px; font-weight: bold; display: block; }
        .summary-label { font-size: 9px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }

        /* Division Badge */
        .division-badge {
            display: inline-block; padding: 4px 16px; border-radius: 20px;
            font-weight: bold; font-size: 14px; margin-top: 5px;
        }
        .div-1 { background: #198754; color: white; }
        .div-2 { background: #0F4C81; color: white; }
        .div-3 { background: #D4AF37; color: white; }
        .div-4 { background: #fd7e14; color: white; }
        .div-0 { background: #dc3545; color: white; }

        /* Footer */
        .footer {
            margin-top: 30px; padding-top: 15px; border-top: 2px solid #0F4C81;
            font-size: 9px; color: #666;
        }
        .signature-line { display: table; width: 100%; margin-top: 30px; }
        .signature-col { display: table-cell; width: 33%; text-align: center; padding: 0 10px; }
        .signature-col .line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; font-size: 9px; }

        /* Watermark */
        .watermark {
            position: fixed; top: 40%; left: 20%; font-size: 60px; color: rgba(15,76,129,0.05);
            transform: rotate(-30deg); font-weight: bold; z-index: -1;
        }
    </style>
</head>
<body>
    <div class="watermark">DERMS</div>
    <div class="container">

        {{-- HEADER --}}
        <div class="header">
            <span class="coat-of-arms">🇹🇿</span>
            <h1>{{ $registration->examination->name }}</h1>
            <h2>Student Result Slip</h2>
            <h3>District Examination & Results Management System (DERMS)</h3>
        </div>

        {{-- STUDENT INFO --}}
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Student Name</div>
                <div class="info-value">{{ strtoupper($registration->student->first_name . ' ' . $registration->student->last_name) }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Exam Number</div>
                <div class="info-value">{{ $registration->exam_number }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Gender</div>
                <div class="info-value">{{ $registration->student->gender === 'M' ? 'Male' : 'Female' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">School</div>
                <div class="info-value">{{ strtoupper($registration->student->school->name) }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Class Level</div>
                <div class="info-value">{{ $registration->classLevel->name }}</div>
            </div>
            @if($registration->student->school->district)
            <div class="info-row">
                <div class="info-label">District</div>
                <div class="info-value">{{ $registration->student->school->district->name }}</div>
            </div>
            @endif
        </div>

        {{-- RESULTS TABLE --}}
        <table class="results-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 8%;">Code</th>
                    <th style="width: 25%; text-align: left;">Subject</th>
                    <th style="width: 10%;">Paper 1</th>
                    <th style="width: 10%;">Paper 2</th>
                    <th style="width: 12%;">Final Score</th>
                    <th style="width: 10%;">Grade</th>
                    <th style="width: 10%;">Points</th>
                    <th style="width: 10%;">Remark</th>
                </tr>
            </thead>
            <tbody>
                @foreach($marks as $index => $mark)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $mark->subject_code }}</td>
                    <td class="subject-name">{{ $mark->subject_name }}</td>
                    <td>
                        @if($mark->is_absent)
                            <span style="color: #dc3545;">ABS</span>
                        @else
                            {{ $mark->paper1_marks !== null ? number_format($mark->paper1_marks, 1) : '-' }}
                        @endif
                    </td>
                    <td>
                        @if($mark->paper2_marks !== null && !$mark->is_absent)
                            {{ number_format($mark->paper2_marks, 1) }}
                        @else
                            -
                        @endif
                    </td>
                    <td style="font-weight: bold;">
                        @if($mark->is_absent)
                            <span style="color: #dc3545;">ABS</span>
                        @elseif($mark->is_disqualified)
                            <span style="color: #dc3545;">DISQ</span>
                        @else
                            {{ number_format($mark->final_marks, 1) }}
                        @endif
                    </td>
                    <td>
                        @php
                            $gradeClass = match(strtoupper($mark->grade ?? '')) {
                                'A' => 'grade-a',
                                'B+', 'B' => 'grade-b',
                                'C' => 'grade-c',
                                'D' => 'grade-d',
                                'F' => 'grade-f',
                                default => '',
                            };
                        @endphp
                        <span class="{{ $gradeClass }}">{{ $mark->grade ?? '-' }}</span>
                    </td>
                    <td>{{ $mark->points ?? '-' }}</td>
                    <td>
                        @if($mark->is_absent)
                            <span style="color: #dc3545; font-size: 9px;">ABSENT</span>
                        @elseif($mark->is_disqualified)
                            <span style="color: #dc3545; font-size: 9px;">DISQUALIFIED</span>
                        @elseif(($mark->points ?? 5) <= 2)
                            <span style="color: #198754; font-size: 9px;">PASS</span>
                        @else
                            <span style="color: #dc3545; font-size: 9px;">{{ ($mark->points ?? 5) <= 4 ? 'PASS' : 'FAIL' }}</span>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>

        {{-- SUMMARY --}}
        @if($summary)
        <div class="summary-box">
            <h3>PERFORMANCE SUMMARY</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-number">{{ number_format($summary->total_marks, 1) }}</span>
                    <span class="summary-label">Total Marks</span>
                </div>
                <div class="summary-item">
                    <span class="summary-number">{{ number_format($summary->average_marks, 2) }}</span>
                    <span class="summary-label">Average</span>
                </div>
                <div class="summary-item">
                    <span class="summary-number">{{ number_format($summary->gpa, 4) }}</span>
                    <span class="summary-label">GPA</span>
                </div>
                <div class="summary-item">
                    <span class="summary-number">{{ $summary->division_points }}</span>
                    <span class="summary-label">Division Points</span>
                </div>
                <div class="summary-item">
                    @php
                        $divClass = match($summary->division) {
                            'I' => 'div-1', 'II' => 'div-2', 'III' => 'div-3',
                            'IV' => 'div-4', default => 'div-0',
                        };
                    @endphp
                    <span class="division-badge {{ $divClass }}">DIV {{ $summary->division }}</span>
                    <span class="summary-label" style="margin-top: 5px; display: block;">Division</span>
                </div>
            </div>
        </div>

        {{-- RANKING --}}
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">School Position</div>
                <div class="info-value" style="font-weight: bold; color: #0F4C81;">
                    {{ $summary->school_position ?? 'N/A' }}
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">District Position</div>
                <div class="info-value" style="font-weight: bold; color: #198754;">
                    {{ $summary->district_position ?? 'N/A' }}
                </div>
            </div>
        </div>
        @endif

        {{-- SIGNATURES --}}
        <div class="signature-line">
            <div class="signature-col">
                <div class="line">Head Teacher</div>
            </div>
            <div class="signature-col">
                <div class="line">Academic Master</div>
            </div>
            <div class="signature-col">
                <div class="line">Official Stamp</div>
            </div>
        </div>

        {{-- FOOTER --}}
        <div class="footer">
            <p>Generated by DERMS on {{ $generated_at }} | This is a computer-generated document.</p>
            <p style="margin-top: 3px;">District Examination & Results Management System &copy; {{ date('Y') }}</p>
        </div>

    </div>
</body>
</html>
