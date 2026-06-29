<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>School Summary - {{ $school->name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 10px; color: #1a1a2e; line-height: 1.5; }
        .container { width: 100%; max-width: 750px; margin: 0 auto; padding: 20px; }

        .header { text-align: center; border-bottom: 3px solid #0F4C81; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { font-size: 16px; color: #0F4C81; text-transform: uppercase; letter-spacing: 2px; }
        .header h2 { font-size: 13px; color: #198754; margin-top: 3px; }
        .header h3 { font-size: 11px; color: #555; font-weight: normal; margin-top: 2px; }

        .section-title {
            background: #0F4C81; color: white; padding: 6px 12px; margin: 15px 0 10px;
            font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
        }

        .info-grid { display: table; width: 100%; margin-bottom: 15px; }
        .info-row { display: table-row; }
        .info-label { display: table-cell; width: 35%; padding: 4px 8px; font-weight: bold; color: #0F4C81; background: #f0f4f8; border: 1px solid #ddd; }
        .info-value { display: table-cell; width: 65%; padding: 4px 8px; border: 1px solid #ddd; }

        /* Summary Cards */
        .cards { display: table; width: 100%; margin-bottom: 15px; }
        .card { display: table-cell; text-align: center; padding: 12px 8px; border: 1px solid #ddd; }
        .card-number { font-size: 24px; font-weight: bold; display: block; }
        .card-label { font-size: 8px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .card-green { color: #198754; }
        .card-blue { color: #0F4C81; }
        .card-red { color: #dc3545; }

        /* Division Breakdown */
        .div-bar { display: table; width: 100%; margin-bottom: 15px; }
        .div-item { display: table-cell; text-align: center; padding: 8px; color: white; font-weight: bold; }
        .div-count { font-size: 18px; display: block; }
        .div-label { font-size: 8px; text-transform: uppercase; }

        /* Subject Table */
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        thead th {
            background: #0F4C81; color: white; padding: 6px 4px;
            text-align: center; font-size: 9px; text-transform: uppercase;
            border: 1px solid #0a3a66;
        }
        tbody td { padding: 5px 4px; text-align: center; border: 1px solid #ddd; font-size: 9px; }
        tbody tr:nth-child(even) { background: #f8f9fa; }
        .subject-name-col { text-align: left !important; font-weight: 600; }

        .footer { margin-top: 25px; padding-top: 10px; border-top: 2px solid #0F4C81; font-size: 8px; color: #666; }
    </style>
</head>
<body>
    <div class="container">

        {{-- HEADER --}}
        <div class="header">
            <h1>{{ strtoupper($school->name) }}</h1>
            <h2>School Performance Summary</h2>
            <h3>{{ $exam->name }}</h3>
        </div>

        {{-- SCHOOL INFO --}}
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">School Name</div>
                <div class="info-value">{{ $school->name }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Registration Number</div>
                <div class="info-value">{{ $school->registration_number ?? 'N/A' }}</div>
            </div>
            @if($school->district)
            <div class="info-row">
                <div class="info-label">District</div>
                <div class="info-value">{{ $school->district->name }}</div>
            </div>
            @endif
            <div class="info-row">
                <div class="info-label">Examination</div>
                <div class="info-value">{{ $exam->name }}</div>
            </div>
        </div>

        {{-- SUMMARY CARDS --}}
        <div class="section-title">Overall Performance</div>

        <div class="cards">
            <div class="card">
                <span class="card-number card-blue">{{ $summary->total_candidates }}</span>
                <span class="card-label">Total Candidates</span>
            </div>
            <div class="card">
                <span class="card-number card-green">{{ $summary->total_passed }}</span>
                <span class="card-label">Passed</span>
            </div>
            <div class="card">
                <span class="card-number card-red">{{ $summary->total_candidates - $summary->total_passed }}</span>
                <span class="card-label">Failed</span>
            </div>
            <div class="card">
                <span class="card-number card-green">{{ number_format($summary->pass_rate, 1) }}%</span>
                <span class="card-label">Pass Rate</span>
            </div>
            <div class="card">
                <span class="card-number card-blue">{{ number_format($summary->average_gpa, 4) }}</span>
                <span class="card-label">School GPA</span>
            </div>
        </div>

        {{-- DIVISION BREAKDOWN --}}
        <div class="section-title">Division Breakdown</div>

        <div class="div-bar">
            <div class="div-item" style="background: #198754;">
                <span class="div-count">{{ $summary->div1_count }}</span>
                <span class="div-label">Div I</span>
            </div>
            <div class="div-item" style="background: #0F4C81;">
                <span class="div-count">{{ $summary->div2_count }}</span>
                <span class="div-label">Div II</span>
            </div>
            <div class="div-item" style="background: #D4AF37;">
                <span class="div-count">{{ $summary->div3_count }}</span>
                <span class="div-label">Div III</span>
            </div>
            <div class="div-item" style="background: #fd7e14;">
                <span class="div-count">{{ $summary->div4_count }}</span>
                <span class="div-label">Div IV</span>
            </div>
            <div class="div-item" style="background: #dc3545;">
                <span class="div-count">{{ $summary->div0_count }}</span>
                <span class="div-label">Div 0</span>
            </div>
        </div>

        {{-- DISTRICT POSITION --}}
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">District Position</div>
                <div class="info-value" style="font-weight: bold; font-size: 14px; color: #0F4C81;">
                    {{ $summary->school_position_district ?? 'N/A' }}
                </div>
            </div>
        </div>

        {{-- SUBJECT PERFORMANCE --}}
        @if($subject_performance->count() > 0)
        <div class="section-title">Subject Performance Analysis</div>

        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 28%; text-align: left;">Subject</th>
                    <th style="width: 10%;">Students Sat</th>
                    <th style="width: 10%;">Passed</th>
                    <th style="width: 12%;">Pass Rate (%)</th>
                    <th style="width: 12%;">Avg Marks</th>
                    <th style="width: 12%;">Avg GPA</th>
                </tr>
            </thead>
            <tbody>
                @foreach($subject_performance as $index => $sp)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td class="subject-name-col">{{ $sp->subject->name ?? 'N/A' }}</td>
                    <td>{{ $sp->total_sat }}</td>
                    <td>{{ $sp->total_passed }}</td>
                    <td>
                        @php $subPassRate = $sp->total_sat > 0 ? round($sp->total_passed / $sp->total_sat * 100, 1) : 0; @endphp
                        <span style="color: {{ $subPassRate >= 50 ? '#198754' : '#dc3545' }}; font-weight: bold;">
                            {{ $subPassRate }}%
                        </span>
                    </td>
                    <td>{{ number_format($sp->average_marks, 2) }}</td>
                    <td>{{ number_format($sp->average_gpa, 4) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif

        {{-- FOOTER --}}
        <div class="footer">
            <p>Generated by DERMS on {{ $generated_at }}</p>
            <p>District Examination & Results Management System &copy; {{ date('Y') }}</p>
        </div>
    </div>
</body>
</html>
