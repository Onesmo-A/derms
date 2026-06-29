<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Merit List - {{ $exam->name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 9px; color: #1a1a2e; }

        .container { width: 100%; padding: 15px; }

        .header { text-align: center; border-bottom: 3px solid #0F4C81; padding-bottom: 12px; margin-bottom: 15px; }
        .header h1 { font-size: 16px; color: #0F4C81; text-transform: uppercase; letter-spacing: 2px; }
        .header h2 { font-size: 12px; color: #198754; margin-top: 3px; }
        .header h3 { font-size: 10px; color: #555; font-weight: normal; margin-top: 2px; }

        .meta-info { margin-bottom: 12px; font-size: 9px; }
        .meta-info span { margin-right: 20px; }
        .meta-info strong { color: #0F4C81; }

        table { width: 100%; border-collapse: collapse; }
        thead th {
            background: #0F4C81; color: white; padding: 6px 4px;
            text-align: center; font-size: 8px; text-transform: uppercase;
            letter-spacing: 0.3px; border: 1px solid #0a3a66;
        }
        tbody td {
            padding: 4px 3px; text-align: center; border: 1px solid #ddd; font-size: 8px;
        }
        tbody tr:nth-child(even) { background: #f8f9fa; }
        .student-name { text-align: left !important; font-weight: 600; white-space: nowrap; }
        .rank-1 { background: #d4edda !important; font-weight: bold; }
        .rank-2 { background: #d1ecf1 !important; }
        .rank-3 { background: #fff3cd !important; }

        .div-1 { color: #198754; font-weight: bold; }
        .div-2 { color: #0F4C81; font-weight: bold; }
        .div-3 { color: #D4AF37; font-weight: bold; }
        .div-4 { color: #fd7e14; font-weight: bold; }
        .div-0 { color: #dc3545; font-weight: bold; }

        .footer { margin-top: 15px; padding-top: 10px; border-top: 2px solid #0F4C81; font-size: 8px; color: #666; }
        .page-break { page-break-after: always; }

        .stats-bar { display: table; width: 100%; margin-bottom: 12px; }
        .stat-item { display: table-cell; text-align: center; padding: 8px; background: #f0f4f8; border: 1px solid #ddd; }
        .stat-number { font-size: 18px; font-weight: bold; color: #0F4C81; display: block; }
        .stat-label { font-size: 7px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    </style>
</head>
<body>
    <div class="container">

        {{-- HEADER --}}
        <div class="header">
            <h1>{{ $exam->name }}</h1>
            <h2>MERIT LIST (Ranked Students)</h2>
            @if($school)
                <h3>{{ strtoupper($school->name) }}</h3>
            @else
                <h3>DISTRICT-WIDE RANKING</h3>
            @endif
        </div>

        {{-- META INFO --}}
        <div class="meta-info">
            <span><strong>Total Students:</strong> {{ $students->count() }}</span>
            <span><strong>Generated:</strong> {{ $generated_at }}</span>
            @if($school)
                <span><strong>School:</strong> {{ $school->name }}</span>
            @endif
        </div>

        {{-- STATISTICS BAR --}}
        @php
            $totalStudents = $students->count();
            $div1 = $students->where('division', 'I')->count();
            $div2 = $students->where('division', 'II')->count();
            $div3 = $students->where('division', 'III')->count();
            $div4 = $students->where('division', 'IV')->count();
            $div0 = $students->where('division', '0')->count();
            $passRate = $totalStudents > 0 ? round(($div1 + $div2 + $div3 + $div4) / $totalStudents * 100, 1) : 0;
        @endphp

        <div class="stats-bar">
            <div class="stat-item">
                <span class="stat-number">{{ $totalStudents }}</span>
                <span class="stat-label">Total</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" style="color: #198754;">{{ $div1 }}</span>
                <span class="stat-label">Div I</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" style="color: #0F4C81;">{{ $div2 }}</span>
                <span class="stat-label">Div II</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" style="color: #D4AF37;">{{ $div3 }}</span>
                <span class="stat-label">Div III</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" style="color: #fd7e14;">{{ $div4 }}</span>
                <span class="stat-label">Div IV</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" style="color: #dc3545;">{{ $div0 }}</span>
                <span class="stat-label">Div 0</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">{{ $passRate }}%</span>
                <span class="stat-label">Pass Rate</span>
            </div>
        </div>

        {{-- MERIT TABLE --}}
        <table>
            <thead>
                <tr>
                    <th style="width: 4%;">Pos</th>
                    <th style="width: 10%;">Exam No.</th>
                    <th style="width: 22%; text-align: left;">Student Name</th>
                    <th style="width: 5%;">Sex</th>
                    <th style="width: 18%; text-align: left;">School</th>
                    <th style="width: 8%;">Total</th>
                    <th style="width: 8%;">Average</th>
                    <th style="width: 7%;">GPA</th>
                    <th style="width: 5%;">Pts</th>
                    <th style="width: 6%;">Div</th>
                    <th style="width: 7%;">Sch Pos</th>
                </tr>
            </thead>
            <tbody>
                @foreach($students as $index => $student)
                @php
                    $rowClass = '';
                    $position = $index + 1;
                    if ($position === 1) $rowClass = 'rank-1';
                    elseif ($position === 2) $rowClass = 'rank-2';
                    elseif ($position === 3) $rowClass = 'rank-3';

                    $divClass = match($student->division) {
                        'I' => 'div-1', 'II' => 'div-2', 'III' => 'div-3',
                        'IV' => 'div-4', default => 'div-0',
                    };
                @endphp
                <tr class="{{ $rowClass }}">
                    <td style="font-weight: bold;">{{ $position }}</td>
                    <td>{{ $student->exam_number }}</td>
                    <td class="student-name">{{ strtoupper($student->first_name . ' ' . $student->last_name) }}</td>
                    <td>{{ $student->gender }}</td>
                    <td style="text-align: left; font-size: 7px;">{{ $student->school_name }}</td>
                    <td>{{ number_format($student->total_marks, 1) }}</td>
                    <td>{{ number_format($student->average_marks, 2) }}</td>
                    <td>{{ number_format($student->gpa, 4) }}</td>
                    <td>{{ $student->division_points }}</td>
                    <td class="{{ $divClass }}">{{ $student->division }}</td>
                    <td>{{ $student->school_position }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        {{-- FOOTER --}}
        <div class="footer">
            <p>Generated by DERMS on {{ $generated_at }} | Examination: {{ $exam->name }}</p>
            <p>District Examination & Results Management System &copy; {{ date('Y') }}</p>
        </div>
    </div>
</body>
</html>
