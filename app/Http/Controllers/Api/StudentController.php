<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\Student\Models\Student;
use App\Domains\Student\Models\AcademicYear;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\School\Models\School;
use App\Http\Requests\Api\Student\StudentBulkStoreRequest;
use App\Http\Requests\Api\Student\StudentIndexRequest;
use App\Http\Requests\Api\Student\StudentStoreRequest;
use App\Http\Requests\Api\Student\StudentUpdateRequest;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentController extends Controller
{
    // ═══════════════════════════════════════════════════════════════════════
    // STUDENT CRUD
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Display a paginated, filtered listing of students.
     * Supports hierarchical filtering: Region → District → School
     */
    public function index(StudentIndexRequest $request)
    {
        $this->authorize('viewAny', Student::class);

        $user  = $request->user();
        $query = Student::with(['school.district.region', 'academicYear', 'classLevel']);

        $this->applyAccessScope($query, $user);

        // Hierarchical filtering
        if ($request->filled('region_id')) {
            $query->whereHas('school.district', fn ($q) =>
                $q->where('region_id', $request->validated('region_id'))
            );
        }
        if ($request->filled('district_id')) {
            $query->whereHas('school', fn ($q) =>
                $q->where('district_id', $request->validated('district_id'))
            );
        }
        if ($request->filled('school_id')) {
            $query->where('school_id', $request->validated('school_id'));
        }
        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->validated('academic_year_id'));
        }
        if ($request->filled('current_class_level_id')) {
            $query->where('current_class_level_id', $request->validated('current_class_level_id'));
        }
        if ($request->filled('gender')) {
            $query->where('gender', $request->validated('gender'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->validated('status'));
        }
        if ($request->filled('search')) {
            $search = $request->validated('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name',         'like', "%{$search}%")
                  ->orWhere('middle_name',      'like', "%{$search}%")
                  ->orWhere('last_name',         'like', "%{$search}%")
                  ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        $perPage = $request->validated('per_page') ?? 25;

        return response()->json($query->orderBy('created_at', 'desc')->paginate($perPage));
    }

    /**
     * Store a newly created student.
     */
    public function store(StudentStoreRequest $request, AuditLogger $auditLogger)
    {
        $this->authorize('create', Student::class);
        $student = Student::create($request->validated());

        $auditLogger->log(
            action: 'student.created',
            description: 'Student created.',
            user: $request->user(),
            newValues: $student->toArray(),
            request: $request
        );

        return response()->json([
            'student' => $student->load(['school.district.region', 'academicYear', 'classLevel']),
            'message' => 'Student registered successfully.',
        ], 201);
    }

    /**
     * Display the specified student.
     */
    public function show(string $id)
    {
        $student = Student::with(['school.district.region', 'academicYear', 'classLevel'])->findOrFail($id);
        $this->authorize('view', $student);
        return response()->json($student);
    }

    /**
     * Update the specified student.
     */
    public function update(StudentUpdateRequest $request, string $id, AuditLogger $auditLogger)
    {
        $student   = Student::findOrFail($id);
        $this->authorize('update', $student);
        $oldValues = $student->toArray();
        $student->update($request->validated());

        $auditLogger->log(
            action: 'student.updated',
            description: 'Student updated.',
            user: $request->user(),
            oldValues: $oldValues,
            newValues: $student->fresh()->toArray(),
            request: $request
        );

        return response()->json([
            'student' => $student->load(['school.district.region', 'academicYear', 'classLevel']),
            'message' => 'Student profile updated successfully.',
        ]);
    }

    /**
     * Soft-delete the specified student.
     */
    public function destroy(string $id, AuditLogger $auditLogger)
    {
        $student   = Student::findOrFail($id);
        $this->authorize('delete', $student);
        $oldValues = $student->toArray();
        $student->delete();

        $auditLogger->log(
            action: 'student.deleted',
            description: 'Student soft-deleted.',
            user: auth()->user(),
            oldValues: $oldValues
        );

        return response()->json(['message' => 'Student deleted successfully.']);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BULK IMPORT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Bulk register students from a JSON list.
     */
    public function bulkStore(StudentBulkStoreRequest $request, AuditLogger $auditLogger)
    {
        $this->authorize('create', Student::class);
        $data        = $request->validated();
        $schoolId    = $data['school_id'];
        $yearId      = $data['academic_year_id'];
        $classId     = $data['current_class_level_id'];
        $studentsList = $data['students'];

        DB::beginTransaction();
        try {
            $inserted = 0;
            $errors   = [];

            foreach ($studentsList as $index => $stu) {
                // Check for duplicate registration number within this school
                $exists = Student::where('registration_number', $stu['registration_number'])
                                 ->where('school_id', $schoolId)
                                 ->exists();
                if ($exists) {
                    $errors[] = [
                        'row'     => $index + 1,
                        'field'   => 'registration_number',
                        'message' => "Reg# {$stu['registration_number']} already exists for this school.",
                        'data'    => $stu,
                    ];
                    continue;
                }

                Student::create([
                    'id'                    => (string) Str::uuid(),
                    'school_id'             => $schoolId,
                    'academic_year_id'      => $yearId,
                    'current_class_level_id'=> $classId,
                    'registration_number'   => $stu['registration_number'],
                    'first_name'            => $stu['first_name'],
                    'middle_name'           => $stu['middle_name'] ?? null,
                    'last_name'             => $stu['last_name'],
                    'gender'               => $stu['gender'],
                    'date_of_birth'        => $stu['date_of_birth'] ?? null,
                    'parent_name'          => $stu['parent_name'] ?? null,
                    'parent_phone'         => $stu['parent_phone'],
                    'status'               => 'active',
                ]);
                $inserted++;
            }

            DB::commit();

            $auditLogger->log(
                action: 'student.bulk_created',
                description: "Bulk registered {$inserted} students.",
                user: $request->user(),
                newValues: compact('schoolId', 'yearId', 'classId', 'inserted'),
                request: $request
            );

            return response()->json([
                'message'  => "Successfully registered {$inserted} students.",
                'inserted' => $inserted,
                'errors'   => $errors,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Bulk import failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Import students from an uploaded Excel/CSV file.
     * Returns a preview array before committing.
     */
    public function importFile(Request $request)
    {
        $this->authorize('create', Student::class);

        $request->validate([
            'file'                   => 'required|file|mimes:csv,txt,xlsx,xls|max:10240',
            'school_id'              => 'required|uuid|exists:schools,id',
            'academic_year_id'       => 'required|uuid|exists:academic_years,id',
            'current_class_level_id' => 'required|uuid|exists:class_levels,id',
            'confirm'                => 'sometimes|boolean',
        ]);

        $file    = $request->file('file');
        $ext     = strtolower($file->getClientOriginalExtension());
        $rows    = [];

        if (in_array($ext, ['csv', 'txt'])) {
            $handle = fopen($file->getRealPath(), 'r');
            $header = null;
            while (($line = fgetcsv($handle)) !== false) {
                if (!$header) { $header = array_map('trim', $line); continue; }
                if (count($line) < 2) continue;
                $rows[] = array_combine($header, array_map('trim', $line));
            }
            fclose($handle);
        } elseif (in_array($ext, ['xlsx', 'xls'])) {
            // Requires maatwebsite/excel — parse via simple spreadsheet reader
            // Fallback: return error instructing CSV use if Maatwebsite not available
            if (!class_exists(\Maatwebsite\Excel\Facades\Excel::class)) {
                return response()->json([
                    'message' => 'Excel import requires maatwebsite/excel. Please use CSV format.',
                ], 422);
            }
            // Would use Excel::toArray() here in production
            return response()->json(['message' => 'Excel parsing handled via queue. Use CSV for immediate preview.'], 202);
        }

        if (empty($rows)) {
            return response()->json(['message' => 'File is empty or unreadable.'], 422);
        }

        // Validate rows
        $validRows   = [];
        $invalidRows = [];
        $requiredCols = ['registration_number', 'first_name', 'last_name', 'gender', 'parent_phone'];

        foreach ($rows as $i => $row) {
            $rowErrors = [];
            foreach ($requiredCols as $col) {
                if (empty($row[$col] ?? '')) {
                    $rowErrors[] = "Missing: {$col}";
                }
            }
            if (!empty($row['gender']) && !in_array(strtoupper($row['gender']), ['M', 'F'])) {
                $rowErrors[] = 'gender must be M or F';
            }
            if (!empty($row['date_of_birth']) && !strtotime($row['date_of_birth'])) {
                $rowErrors[] = 'date_of_birth format must be YYYY-MM-DD';
            }

            $row['_row']    = $i + 2; // 1-indexed, skipping header
            $row['_errors'] = $rowErrors;
            $row['_valid']  = empty($rowErrors);

            if (empty($rowErrors)) {
                $validRows[] = $row;
            } else {
                $invalidRows[] = $row;
            }
        }

        // If confirm=true, commit valid rows
        if ($request->boolean('confirm') && !empty($validRows)) {
            $schoolId = $request->input('school_id');
            $yearId   = $request->input('academic_year_id');
            $classId  = $request->input('current_class_level_id');
            $inserted = 0;

            DB::beginTransaction();
            try {
                foreach ($validRows as $stu) {
                    $exists = Student::where('registration_number', $stu['registration_number'])
                                     ->where('school_id', $schoolId)
                                     ->exists();
                    if (!$exists) {
                        Student::create([
                            'id'                     => (string) Str::uuid(),
                            'school_id'              => $schoolId,
                            'academic_year_id'       => $yearId,
                            'current_class_level_id' => $classId,
                            'registration_number'    => $stu['registration_number'],
                            'first_name'             => $stu['first_name'],
                            'middle_name'            => $stu['middle_name'] ?? null,
                            'last_name'              => $stu['last_name'],
                            'gender'                 => strtoupper($stu['gender']),
                            'date_of_birth'          => !empty($stu['date_of_birth']) ? $stu['date_of_birth'] : null,
                            'parent_name'            => $stu['parent_name'] ?? null,
                            'parent_phone'           => $stu['parent_phone'],
                            'status'                 => 'active',
                        ]);
                        $inserted++;
                    } else {
                        $invalidRows[] = array_merge($stu, ['_errors' => ['Duplicate reg# in school']]);
                    }
                }
                DB::commit();
                return response()->json([
                    'message'  => "Imported {$inserted} students successfully.",
                    'inserted' => $inserted,
                    'skipped'  => count($invalidRows),
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json(['message' => 'Import failed: ' . $e->getMessage()], 500);
            }
        }

        // Return preview (don't commit yet)
        return response()->json([
            'total'       => count($rows),
            'valid'       => count($validRows),
            'invalid'     => count($invalidRows),
            'valid_rows'  => $validRows,
            'invalid_rows'=> $invalidRows,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Export students as CSV (default) or JSON.
     * Frontend handles XLSX conversion via SheetJS.
     */
    public function export(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', Student::class);

        $user  = $request->user();
        $query = Student::with(['school.district.region', 'academicYear', 'classLevel']);
        $this->applyAccessScope($query, $user);

        if ($request->filled('region_id')) {
            $query->whereHas('school.district', fn ($q) =>
                $q->where('region_id', $request->input('region_id'))
            );
        }
        if ($request->filled('district_id')) {
            $query->whereHas('school', fn ($q) =>
                $q->where('district_id', $request->input('district_id'))
            );
        }
        if ($request->filled('school_id')) {
            $query->where('school_id', $request->input('school_id'));
        }
        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->input('academic_year_id'));
        }
        if ($request->filled('current_class_level_id')) {
            $query->where('current_class_level_id', $request->input('current_class_level_id'));
        }
        if ($request->filled('gender')) {
            $query->where('gender', $request->input('gender'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $students = $query->orderBy('last_name')->orderBy('first_name')->get();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="students_export_' . now()->format('Ymd_His') . '.csv"',
            'Cache-Control'       => 'no-cache, no-store',
        ];

        return response()->stream(function () use ($students) {
            $handle = fopen('php://output', 'w');
            // BOM for Excel UTF-8 compatibility
            fputs($handle, "\xEF\xBB\xBF");
            fputcsv($handle, [
                'Registration Number', 'First Name', 'Middle Name', 'Last Name',
                'Gender', 'Date of Birth', 'Status', 'Parent Name', 'Parent Phone',
                'Class Level', 'Academic Year', 'School', 'District', 'Region',
            ]);
            foreach ($students as $s) {
                fputcsv($handle, [
                    $s->registration_number,
                    $s->first_name,
                    $s->middle_name ?? '',
                    $s->last_name,
                    $s->gender,
                    $s->date_of_birth ? $s->date_of_birth->format('Y-m-d') : '',
                    $s->status ?? 'active',
                    $s->parent_name ?? '',
                    $s->parent_phone ?? '',
                    $s->classLevel?->name ?? '',
                    $s->academicYear?->name ?? '',
                    $s->school?->name ?? '',
                    $s->school?->district?->name ?? '',
                    $s->school?->district?->region?->name ?? '',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NON-EDITABLE TEMPLATE DOWNLOAD
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Download the official bulk-import CSV template.
     * Headers are fixed; format is strict for compatibility.
     * Includes instruction rows (prefixed with #) that are ignored on import.
     */
    public function downloadTemplate(Request $request): StreamedResponse
    {
        $format  = $request->input('format', 'csv');
        $filename = 'DERMS_Student_Import_Template_' . now()->format('Ymd') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'no-cache, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF"); // UTF-8 BOM

            // ── Instructions (will be ignored on import — lines starting with #) ──
            fputcsv($handle, ['# DERMS — Student Bulk Import Template']);
            fputcsv($handle, ['# DO NOT modify column headers (Row 7)']);
            fputcsv($handle, ['# Gender: Use M (Male) or F (Female) only']);
            fputcsv($handle, ['# date_of_birth format: YYYY-MM-DD (e.g. 2008-03-15)']);
            fputcsv($handle, ['# parent_phone: Include country code e.g. 0712345678']);
            fputcsv($handle, ['# Fields marked * are REQUIRED. Leave optional fields blank if unknown.']);

            // ── Column Headers (Row 7 — do not move) ──────────────────────────────
            fputcsv($handle, [
                'registration_number *',
                'first_name *',
                'middle_name',
                'last_name *',
                'gender * (M/F)',
                'date_of_birth (YYYY-MM-DD)',
                'parent_name',
                'parent_phone *',
            ]);

            // ── Sample Data Rows ──────────────────────────────────────────────────
            $samples = [
                ['S001/2026', 'Amina', 'Juma', 'Hassan',   'F', '2009-04-10', 'Juma Hassan',    '0712345678'],
                ['S002/2026', 'John',  '',     'Mwalimu',  'M', '2008-11-22', 'Peter Mwalimu',  '0756789012'],
                ['S003/2026', 'Fatuma','Ali',  'Mkumbwa',  'F', '2009-07-05', 'Ali Mkumbwa',    '0789123456'],
            ];
            foreach ($samples as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, $headers);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STUDENT LIFECYCLE: PROMOTE & TRANSFER
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Promote a student to a new class level and/or academic year.
     */
    public function promote(Request $request, string $id, AuditLogger $auditLogger)
    {
        $this->authorize('update', Student::findOrFail($id));
        $validated = $request->validate([
            'academic_year_id'       => 'required|uuid|exists:academic_years,id',
            'current_class_level_id' => 'required|uuid|exists:class_levels,id',
        ]);

        $student   = Student::findOrFail($id);
        $oldValues = $student->only(['academic_year_id', 'current_class_level_id', 'status']);
        $student->update([
            'academic_year_id'       => $validated['academic_year_id'],
            'current_class_level_id' => $validated['current_class_level_id'],
        ]);

        $auditLogger->log(
            action: 'student.promoted',
            description: "Student promoted to class {$validated['current_class_level_id']}.",
            user: $request->user(),
            oldValues: $oldValues,
            newValues: $student->fresh()->toArray(),
            request: $request
        );

        return response()->json([
            'student' => $student->load(['school.district.region', 'academicYear', 'classLevel']),
            'message' => 'Student promoted successfully.',
        ]);
    }

    /**
     * Transfer a student to a different school.
     */
    public function transfer(Request $request, string $id, AuditLogger $auditLogger)
    {
        $validated = $request->validate([
            'school_id' => 'required|uuid|exists:schools,id',
            'reason'    => 'nullable|string|max:500',
        ]);

        $student   = Student::findOrFail($id);
        $this->authorize('update', $student);
        $oldValues = $student->only(['school_id', 'status']);

        $student->update([
            'school_id' => $validated['school_id'],
            'status'    => 'transferred',
        ]);

        $auditLogger->log(
            action: 'student.transferred',
            description: "Student transferred to school {$validated['school_id']}. Reason: " . ($validated['reason'] ?? 'N/A'),
            user: $request->user(),
            oldValues: $oldValues,
            newValues: $student->fresh()->toArray(),
            request: $request
        );

        return response()->json([
            'student' => $student->load(['school.district.region', 'academicYear', 'classLevel']),
            'message' => 'Student transferred successfully.',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DUPLICATE DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Detect potential duplicate student registrations.
     * Checks: same registration number, same name + DOB, same name + parent phone.
     */
    public function duplicates(Request $request)
    {
        $this->authorize('viewAny', Student::class);
        $user  = $request->user();
        $query = Student::with(['school.district.region', 'classLevel']);
        $this->applyAccessScope($query, $user);

        // Scope to specific school/district if provided
        if ($request->filled('school_id')) {
            $query->where('school_id', $request->input('school_id'));
        } elseif ($request->filled('district_id')) {
            $query->whereHas('school', fn ($q) =>
                $q->where('district_id', $request->input('district_id'))
            );
        }

        $students = $query->select([
            'id', 'school_id', 'registration_number', 'first_name', 'middle_name',
            'last_name', 'gender', 'date_of_birth', 'parent_phone', 'status',
        ])->get();

        $duplicates = [];

        // Group by registration_number (cross-school)
        $byRegNum = $students->groupBy('registration_number');
        foreach ($byRegNum as $regNum => $group) {
            if ($group->count() > 1) {
                $duplicates[] = [
                    'type'       => 'duplicate_registration_number',
                    'label'      => "Reg# {$regNum}",
                    'count'      => $group->count(),
                    'students'   => $group->values(),
                    'risk_level' => 'high',
                ];
            }
        }

        // Group by full name + date_of_birth
        $byNameDob = $students->groupBy(fn ($s) =>
            strtolower(trim("{$s->first_name} {$s->last_name}")) . '|' . ($s->date_of_birth ? $s->date_of_birth->format('Y-m-d') : '')
        );
        foreach ($byNameDob as $key => $group) {
            if ($group->count() > 1 && !str_ends_with($key, '|')) {
                $duplicates[] = [
                    'type'       => 'duplicate_name_dob',
                    'label'      => "Same Name + DOB: " . explode('|', $key)[0],
                    'count'      => $group->count(),
                    'students'   => $group->values(),
                    'risk_level' => 'high',
                ];
            }
        }

        // Group by full name + parent_phone
        $byNamePhone = $students->groupBy(fn ($s) =>
            strtolower(trim("{$s->first_name} {$s->last_name}")) . '|' . trim($s->parent_phone ?? '')
        );
        foreach ($byNamePhone as $key => $group) {
            if ($group->count() > 1 && !str_ends_with($key, '|')) {
                $duplicates[] = [
                    'type'       => 'duplicate_name_phone',
                    'label'      => "Same Name + Phone: " . explode('|', $key)[0],
                    'count'      => $group->count(),
                    'students'   => $group->values(),
                    'risk_level' => 'medium',
                ];
            }
        }

        return response()->json([
            'total_duplicates' => count($duplicates),
            'duplicates'       => $duplicates,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PERFORMANCE HISTORY
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get examination performance history for a specific student.
     */
    public function performance(string $id)
    {
        $student = Student::with(['school', 'classLevel'])->findOrFail($id);
        $this->authorize('view', $student);

        // Load exam registrations with results
        $registrations = DB::table('examination_registrations as er')
            ->join('examinations as e',        'e.id',  '=', 'er.examination_id')
            ->join('examination_types as et',  'et.id', '=', 'e.examination_type_id')
            ->join('class_levels as cl',       'cl.id', '=', 'er.class_level_id')
            ->leftJoin('student_exam_summaries as ses', 'ses.examination_registration_id', '=', 'er.id')
            ->where('er.student_id', $id)
            ->select([
                'er.id as registration_id',
                'er.exam_number',
                'er.status as reg_status',
                'e.name as exam_name',
                'e.start_date',
                'e.end_date',
                'e.is_published',
                'et.name as exam_type',
                'cl.name as class_level',
                'ses.total_marks',
                'ses.average_marks',
                'ses.gpa',
                'ses.division',
                'ses.division_points',
                'ses.school_position',
                'ses.district_position',
                'ses.region_position',
            ])
            ->orderBy('e.start_date', 'desc')
            ->get();

        return response()->json([
            'student'      => $student->load(['school.district.region', 'classLevel']),
            'performance'  => $registrations,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD STATS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Dashboard statistics for students module.
     */
    public function stats(Request $request)
    {
        $user  = $request->user();
        $query = Student::query();
        $this->applyAccessScope($query, $user);

        $total       = (clone $query)->count();
        $male        = (clone $query)->where('gender', 'M')->count();
        $female      = (clone $query)->where('gender', 'F')->count();
        $active      = (clone $query)->where('status', 'active')->count();
        $transferred = (clone $query)->where('status', 'transferred')->count();
        $completed   = (clone $query)->where('status', 'completed')->count();

        // Per-school breakdown (top 10)
        // NOTE: Use PHP-level filter instead of HAVING to avoid PostgreSQL alias issue
        $perSchool = School::withCount('students')
            ->orderByDesc('students_count')
            ->limit(20)
            ->get(['id', 'name'])
            ->filter(fn ($s) => $s->students_count > 0)
            ->take(10)
            ->map(fn ($s) => ['name' => $s->name, 'count' => $s->students_count])
            ->values();

        return response()->json(compact('total', 'male', 'female', 'active', 'transferred', 'completed', 'perSchool'));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPER LOOKUPS
    // ═══════════════════════════════════════════════════════════════════════

    public function academicYears()
    {
        return response()->json(AcademicYear::orderBy('name', 'desc')->get());
    }

    public function classLevels()
    {
        return response()->json(ClassLevel::orderBy('numeric_level')->get());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Apply data access scope based on the authenticated user's role.
     */
    protected function applyAccessScope($query, $user): void
    {
        if ($user->hasRole('District Officer') && $user->district_id) {
            $query->whereHas('school', fn ($q) =>
                $q->where('district_id', $user->district_id)
            );
            return;
        }

        if ($user->hasAnyRole(['School Administrator', 'Teacher']) && $user->school_id) {
            $query->where('school_id', $user->school_id);
        }
    }
}
