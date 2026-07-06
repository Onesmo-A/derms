<?php

namespace App\Http\Controllers\Api;

use App\Domains\School\Models\School;
use App\Domains\Student\Models\AcademicYear;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\Student\Models\Student;
use App\Domains\Student\Services\StudentExcelImportService;
use App\Domains\Student\Services\StudentManagementService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Student\StudentBulkStoreRequest;
use App\Http\Requests\Api\Student\StudentIndexRequest;
use App\Http\Requests\Api\Student\StudentStoreRequest;
use App\Http\Requests\Api\Student\StudentUpdateRequest;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function __construct(
        private StudentManagementService $students,
        private StudentExcelImportService $excelImports,
    ) {}

    public function index(StudentIndexRequest $request)
    {
        $this->authorize('viewAny', Student::class);

        $perPage = $request->validated('per_page') ?? 25;

        return response()->json(
            $this->students->buildIndexQuery($request->validated(), $request->user())
                ->paginate($perPage)
        );
    }

    public function store(StudentStoreRequest $request, AuditLogger $auditLogger)
    {
        $this->authorize('create', Student::class);

        $student = $this->students->createStudent($request->validated());

        $auditLogger->log(
            action: 'student.created',
            description: 'Student created.',
            user: $request->user(),
            newValues: $student->toArray(),
            request: $request
        );

        return response()->json([
            'student' => $student->load(['school.district.region', 'academicYear', 'classLevel', 'class_level']),
            'message' => 'Student registered successfully.',
        ], 201);
    }

    public function show(string $id)
    {
        $student = Student::with(['school.district.region', 'academicYear', 'classLevel', 'class_level'])->findOrFail($id);
        $this->authorize('view', $student);

        return response()->json($student);
    }

    public function update(StudentUpdateRequest $request, string $id, AuditLogger $auditLogger)
    {
        $student = Student::findOrFail($id);
        $this->authorize('update', $student);

        $oldValues = $student->toArray();
        $student = $this->students->updateStudent($student, $request->validated());

        $auditLogger->log(
            action: 'student.updated',
            description: 'Student updated.',
            user: $request->user(),
            oldValues: $oldValues,
            newValues: $student->toArray(),
            request: $request
        );

        return response()->json([
            'student' => $student->load(['school.district.region', 'academicYear', 'classLevel', 'class_level']),
            'message' => 'Student profile updated successfully.',
        ]);
    }

    public function destroy(string $id, AuditLogger $auditLogger)
    {
        $student = Student::findOrFail($id);
        $this->authorize('delete', $student);

        $oldValues = $student->toArray();
        $this->students->deleteStudent($student);

        $auditLogger->log(
            action: 'student.deleted',
            description: 'Student soft-deleted.',
            user: auth()->user(),
            oldValues: $oldValues
        );

        return response()->json(['message' => 'Student deleted successfully.']);
    }

    public function bulkStore(StudentBulkStoreRequest $request, AuditLogger $auditLogger)
    {
        $this->authorize('create', Student::class);

        $result = $this->students->bulkCreate($request->validated());

        $auditLogger->log(
            action: 'student.bulk_created',
            description: 'Bulk registered ' . $result['inserted'] . ' students.',
            user: $request->user(),
            newValues: [
                'schoolId' => $request->validated('school_id'),
                'yearId' => $request->validated('academic_year_id'),
                'classId' => $request->validated('current_class_level_id'),
                'inserted' => $result['inserted'],
            ],
            request: $request
        );

        return response()->json([
            'message' => 'Successfully registered ' . $result['inserted'] . ' students.',
            'inserted' => $result['inserted'],
            'errors' => $result['errors'],
        ], 201);
    }

    public function importFile(Request $request)
    {
        $this->authorize('create', Student::class);

        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:10240',
            'school_id' => 'required|uuid|exists:schools,id',
            'academic_year_id' => 'required|uuid|exists:academic_years,id',
            'current_class_level_id' => 'required|uuid|exists:class_levels,id',
            'confirm' => 'sometimes|boolean',
        ]);

        $file = $request->file('file');
        $school = \App\Domains\School\Models\School::findOrFail($request->input('school_id'));
        $classLevel = ClassLevel::findOrFail($request->input('current_class_level_id'));
        $academicYear = AcademicYear::findOrFail($request->input('academic_year_id'));
        $rows = $this->excelImports->parseRows($file, $school, $classLevel, $academicYear);

        if (empty($rows)) {
            return response()->json(['message' => 'File is empty or unreadable.'], 422);
        }

        $validated = $this->excelImports->validateRows($rows, $school, $classLevel, $academicYear);
        $validRows = $validated['validRows'];
        $invalidRows = $validated['invalidRows'];

        if ($request->boolean('confirm')) {
            if (empty($validRows)) {
                return response()->json([
                    'message' => 'No valid students were found to import. The file only contains duplicates or invalid rows.',
                    'inserted' => 0,
                    'skipped' => count($invalidRows),
                    'invalid_rows' => $invalidRows,
                ], 200);
            }

            $materialized = $this->excelImports->materializeRows($validRows);
            $result = $this->students->commitImportedRows(
                $materialized,
                $request->input('school_id'),
                $request->input('academic_year_id'),
                $request->input('current_class_level_id')
            );

            $message = $result['inserted'] > 0
                ? 'Imported ' . $result['inserted'] . ' students successfully.'
                : ($result['skipped'] > 0
                    ? 'No new students were imported. All valid rows already exist in the database.'
                    : 'No valid students were imported.');

            return response()->json([
                'message' => $message,
                'inserted' => $result['inserted'],
                'skipped' => $result['skipped'],
            ], 201);
        }

        return response()->json([
            'total' => count($rows),
            'valid' => count($validRows),
            'invalid' => count($invalidRows),
            'valid_rows' => $validRows,
            'invalid_rows' => $invalidRows,
        ]);
    }

    public function validateStudentData(Request $request)
    {
        $this->authorize('create', Student::class);

        $validated = $request->validate([
            'school_id' => 'required|uuid|exists:schools,id',
            'academic_year_id' => 'nullable|uuid|exists:academic_years,id',
            'current_class_level_id' => 'nullable|uuid|exists:class_levels,id',
            'registration_number' => 'nullable|string|max:50',
            'registration_suffix' => 'nullable|string|max:4',
            'parent_phone' => 'nullable|string|max:20',
            'exclude_id' => 'nullable|uuid|exists:students,id',
        ]);

        $school = \App\Domains\School\Models\School::findOrFail($validated['school_id']);
        $payload = [];

        $classLevel = !empty($validated['current_class_level_id'])
            ? ClassLevel::find($validated['current_class_level_id'])
            : (!empty($validated['exclude_id']) ? Student::find($validated['exclude_id'])?->classLevel : null);

        $academicYearId = $validated['academic_year_id'] ?? (!empty($validated['exclude_id']) ? Student::find($validated['exclude_id'])?->academic_year_id : null);

        if (!empty($validated['registration_number']) || !empty($validated['registration_suffix'])) {
            $registrationNumber = strtoupper(trim((string) ($validated['registration_number'] ?? '')));
            if (preg_match('/^([SP]\d{4})\/F\d+\/(\d{4})$/', $registrationNumber, $matches)) {
                $registrationNumber = $matches[1] . '/' . $matches[2];
            }
            $suffix = preg_replace('/\D+/', '', (string) ($validated['registration_suffix'] ?? ''));

            if ($registrationNumber === '' && $suffix !== '') {
                if (!$classLevel) {
                    return response()->json([
                        'message' => 'Please select a class level before checking the registration number.',
                    ], 422);
                }

                $registrationNumber = $school->buildStudentRegistrationNumber($classLevel, $suffix);
            }

            if (!$classLevel) {
                return response()->json([
                    'message' => 'Please select a class level before checking the registration number.',
                ], 422);
            }

            if (empty($academicYearId)) {
                return response()->json([
                    'message' => 'Please select an academic year before checking the registration number.',
                ], 422);
            }

            [$prefixPart, $suffixPart] = array_pad(explode('/', $registrationNumber, 2), 2, '');
            $existsQuery = Student::query()
                ->where('school_id', $school->id)
                ->when(!empty($academicYearId), fn ($query) => $query->where('academic_year_id', $academicYearId))
                ->when($classLevel, fn ($query) => $query->where('current_class_level_id', $classLevel->id))
                ->where(function ($query) use ($registrationNumber, $prefixPart, $suffixPart) {
                    $query->where('registration_number', $registrationNumber);

                    if ($prefixPart !== '' && $suffixPart !== '') {
                        $query->orWhere('registration_number', 'like', $prefixPart . '/F%/' . $suffixPart);
                    }
                });

            if (!empty($validated['exclude_id'])) {
                $existsQuery->whereKeyNot($validated['exclude_id']);
            }

            $exists = $registrationNumber !== '' && $existsQuery->exists();
            $payload['registration_number'] = [
                'value' => $registrationNumber,
                'exists' => $exists,
                'message' => $exists
                    ? 'Registration number already exists for this school, class, and academic year.'
                    : 'Registration number is available for this school, class, and academic year.',
            ];
        }

        if (!empty($validated['parent_phone'])) {
            $phoneDigits = preg_replace('/\D+/', '', (string) $validated['parent_phone']);

            $phoneQuery = Student::query()
                ->whereRaw("regexp_replace(coalesce(parent_phone, ''), '\\D', '', 'g') = ?", [$phoneDigits]);

            if (!empty($validated['exclude_id'])) {
                $phoneQuery->where('id', '!=', $validated['exclude_id']);
            }

            $exists = $phoneDigits !== '' && $phoneQuery->exists();
            $payload['parent_phone'] = [
                'value' => $validated['parent_phone'],
                'exists' => $exists,
                'message' => $exists ? 'Parent phone already exists in the database.' : 'Parent phone is available.',
            ];
        }

        return response()->json($payload);
    }

    public function export(Request $request)
    {
        $this->authorize('viewAny', Student::class);

        return $this->students->exportStream($request->all(), $request->user());
    }

    public function downloadTemplate(Request $request)
    {
        $school = null;
        $classLevel = null;
        $academicYear = null;

        if ($request->filled('school_id')) {
            $school = School::find($request->input('school_id'));
        }

        if ($request->filled('current_class_level_id')) {
            $classLevel = ClassLevel::find($request->input('current_class_level_id'));
        }

        if ($request->filled('academic_year_id')) {
            $academicYear = AcademicYear::find($request->input('academic_year_id'));
        }

        return $this->excelImports->downloadTemplate($school, $classLevel, $academicYear);
    }

    public function promote(Request $request, string $id, AuditLogger $auditLogger)
    {
        $student = Student::findOrFail($id);
        $this->authorize('update', $student);

        $validated = $request->validate([
            'academic_year_id' => 'required|uuid|exists:academic_years,id',
            'current_class_level_id' => 'required|uuid|exists:class_levels,id',
        ]);

        $oldValues = $student->only(['academic_year_id', 'current_class_level_id', 'status']);
        $student = $this->students->promoteStudent($student, $validated);

        $auditLogger->log(
            action: 'student.promoted',
            description: 'Student promoted to class ' . $validated['current_class_level_id'] . '.',
            user: $request->user(),
            oldValues: $oldValues,
            newValues: $student->toArray(),
            request: $request
        );

        return response()->json([
            'student' => $student->load(['school.district.region', 'academicYear', 'classLevel', 'class_level']),
            'message' => 'Student promoted successfully.',
        ]);
    }

    public function transfer(Request $request, string $id, AuditLogger $auditLogger)
    {
        $validated = $request->validate([
            'school_id' => 'required|uuid|exists:schools,id',
            'reason' => 'nullable|string|max:500',
        ]);

        $student = Student::findOrFail($id);
        $this->authorize('update', $student);

        $oldValues = $student->only(['school_id', 'status']);
        $student = $this->students->transferStudent($student, $validated);

        $auditLogger->log(
            action: 'student.transferred',
            description: 'Student transferred to school ' . $validated['school_id'] . '. Reason: ' . ($validated['reason'] ?? 'N/A'),
            user: $request->user(),
            oldValues: $oldValues,
            newValues: $student->toArray(),
            request: $request
        );

        return response()->json([
            'student' => $student->load(['school.district.region', 'academicYear', 'classLevel', 'class_level']),
            'message' => 'Student transferred successfully.',
        ]);
    }

    public function duplicates(Request $request)
    {
        $this->authorize('viewAny', Student::class);

        $duplicates = $this->students->findDuplicates($request->all(), $request->user());

        return response()->json([
            'total_duplicates' => count($duplicates),
            'duplicates' => $duplicates,
        ]);
    }

    public function performance(string $id)
    {
        $bundle = $this->students->getPerformance($id);
        $this->authorize('view', $bundle['student']);

        return response()->json($bundle);
    }

    public function stats(Request $request)
    {
        return response()->json($this->students->getStats($request->user()));
    }

    public function academicYears()
    {
        return response()->json($this->students->academicYears());
    }

    public function classLevels()
    {
        return response()->json($this->students->classLevels());
    }
}
