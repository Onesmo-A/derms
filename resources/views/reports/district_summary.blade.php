<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>District Summary - {{ $exam->name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 9px; color: #1a1a2e; }
        .container { width: 100%; padding: 15px; }

        .header { text-align: center; border-bottom: 3px solid #0F4C81; padding-bottom: 12px; margin-bottom: 15px; }
        .header h1 { font-size: 16px; color: #0F4C81; text-transform: uppercase; letter-spacing: 2px; }
        .header h2 { font-size: 13px; color: #198754; margin-top: 3px; }
        .header h3 { font-size: 10px; color: #555; font-weight: normal; margin-top: 2px; }

        .stats-bar { display: table; width: 100%; margin-bottom: 15px; }
        .stat-item { display: table-cell; text-align: center; padding: 10px; background: #f0f4f8; border: 1px solid #ddd; }
        .stat-number { font-size: 20px; font-weight: bold; color: #0F4C81; display: block; }
        .stat-label { font-size: 7px; color: #666; text-transform: uppercase; letter-spacing: 1px; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        thead th {
            background: #0F4C81; color: white; padding: 6px 4px;
            text-align: center; font-size: 8px; text-transform: uppercase;
            letter-spacing: 0.3px; border: 1px solid #0a3a66;
        }
        tbody td { padding: 5px 4px; text-align: center; border: 1px solid #ddd; font-size: 8px; }
        tbody tr:nth-child(even) { background: #f8f9fa; }
        .school-name-col { text-align: left !important; font-weight: 600; }

        .rank-1 { background: #d4edda !important; }
        .rank-2 { background: #d1ecf1 !important; }
        .rank-3 { background: #fff3cd !important; }

        .footer { margin-top: 15px; padding-top: 10px; border-top: 2px solid #0F4C81; font-size: 8px; color: #666; }
    </style>
</head>
<body>
    <div class="container">

        {{-- HEADER --}}
        <div class="header">
            <h1>{{ $exam->name }}</h1>
            <h2>District School Ranking Summary</h2>
            <h3>All Schools Performance Comparison</h3>
        </div>

        {{-- DISTRICT STATISTICS --}}
        @php
            $totalSchools = $schools->count();
            $totalCandidates = $schools->sum('total_candidates');
            $totalPassed = $schools->sum('total_passed');
            $districtPassRate = $totalCandidates > 0 ? round($totalPassed / $totalCandidates * 100, 1) : 0;
            $totalDiv1 = $schools->sum('div1_count');
            $totalDiv2 = $schools->sum('div2_count');
            $totalDiv3 = $schools->sum('div3_count');
            $totalDiv4 = $schools->sum('div4_count');
            $totalDiv0 = $schools->sum('div0_count');
        @endphp

        <div class="stats-bar">
            <div class="stat-item">
                <span class="stat-number">{{ $totalSchools }}</span>
                <span class="stat-label">Schools</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">{{ $totalCandidates }}</span>
                <span class="stat-label">Candidates</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" style="color: #198754;">{{ $districtPassRate }}%</span>
                <span class="stat-label">Pass Rate</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" style="color: #198754;">{{ $totalDiv1 }}</span>
                <span class="stat-label">Div I</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" style="color: #0F4C81;">{{ $totalDiv2 }}</span>
                <span class="stat-label">Div II</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" style="color: #D4AF37;">{{ $totalDiv3 }}</span>
                <span class="stat-label">Div III</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" style="color: #fd7e14;">{{ $totalDiv4 }}</span>
                <span class="stat-label">Div IV</span>
            </div>
            <div class="stat-item">
                <span class="stat-number" style="color: #dc3545;">{{ $totalDiv0 }}</span>
                <span class="stat-label">Div 0</span>
            </div>
        </div>

        {{-- SCHOOL RANKING TABLE --}}
        <table>
            <thead>
                <tr>
                    <th style="width: 4%;">Pos</th>
                    <th style="width: 25%; text-align: left;">School Name</th>
                    <th style="width: 7%;">Total</th>
                    <th style="width: 7%;">Passed</th>
                    <th style="width: 8%;">Pass %</th>
                    <th style="width: 8%;">GPA</th>
                    <th style="width: 6%;">Div I</th>
                    <th style="width: 6%;">Div II</th>
                    <th style="width: 6%;">Div III</th>
                    <th style="width: 6%;">Div IV</th>
                    <th style="width: 6%;">Div 0</th>
                </tr>
            </thead>
            <tbody>
                @foreach($schools as $schoolSummary)
                @php
                    $pos = $schoolSummary->school_position_district;
                    $rowClass = '';
                    if ($pos === 1) $rowClass = 'rank-1';
                    elseif ($pos === 2) $rowClass = 'rank-2';
                    elseif ($pos === 3) $rowClass = 'rank-3';
                @endphp
                <tr class="{{ $rowClass }}">
                    <td style="font-weight: bold;">{{ $pos }}</td>
                    <td class="school-name-col">{{ strtoupper($schoolSummary->school->name ?? 'N/A') }}</td>
                    <td>{{ $schoolSummary->total_candidates }}</td>
                    <td>{{ $schoolSummary->total_passed }}</td>
                    <td style="font-weight: bold; color: {{ $schoolSummary->pass_rate >= 50 ? '#198754' : '#dc3545' }};">
                        {{ number_format($schoolSummary->pass_rate, 1) }}%
                    </td>
                    <td>{{ number_format($schoolSummary->average_gpa, 4) }}</td>
                    <td style="color: #198754; font-weight: bold;">{{ $schoolSummary->div1_count }}</td>
                    <td style="color: #0F4C81;">{{ $schoolSummary->div2_count }}</td>
                    <td style="color: #D4AF37;">{{ $schoolSummary->div3_count }}</td>
                    <td style="color: #fd7e14;">{{ $schoolSummary->div4_count }}</td>
                    <td style="color: #dc3545;">{{ $schoolSummary->div0_count }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        {{-- FOOTER --}}
        <div class="footer">
            <p>Generated by DERMS on {{ $generated_at }} | {{ $exam->name }}</p>
            <p>District Examination & Results Management System &copy; {{ date('Y') }}</p>
        </div>
    </div>
</body>
</html>
