<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domains\Student\Models\Student;
use App\Domains\Student\Models\AcademicYear;
use App\Domains\Student\Models\ClassLevel;
use App\Http\Requests\Api\Student\StudentBulkStoreRequest;
use App\Http\Requests\Api\Student\StudentIndexRequest;
use App\Http\Requests\Api\Student\StudentStoreRequest;
use App\Http\Requests\Api\Student\StudentUpdateRequest;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    /**
     * Display a listing of students (paginated and filtered).
     */
    public function index(StudentIndexRequest $request)
    {
        $this->authorize('viewAny', Student::class);

        $user = $request->user();
        $query = Student::with(['school', 'academicYear', 'classLevel']);

        $this->applyAccessScope($query, $user);

        if ($request->filled('school_id')) {
            $query->where('school_id', $request->validated('school_id'));
        }

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->validated('academic_year_id'));
        }

        if ($request->filled('current_class_level_id')) {
            $query->where('current_class_level_id', $request->validated('current_class_level_id'));
        }

        if ($request->filled('search')) {
            $search = $request->validated('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('middle_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Store a newly created student in the database.
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
            'student' => $student->load(['school', 'academicYear', 'classLevel']),
            'message' => 'Student registered successfully.'
        ], 201);
    }

    /**
     * Display the specified student profile.
     */
    public function show(string $id)
    {
        $student = Student::with(['school', 'academicYear', 'classLevel'])->findOrFail($id);
        $this->authorize('view', $student);

        return response()->json($student);
    }

    /**
     * Update the specified student in the database.
     */
    public function update(StudentUpdateRequest $request, string $id, AuditLogger $auditLogger)
    {
        $student = Student::findOrFail($id);
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
            'student' => $student->load(['school', 'academicYear', 'classLevel']),
            'message' => 'Student profile updated successfully.'
        ]);
    }

    /**
     * Remove the specified student (Soft Delete).
     */
    public function destroy(string $id, AuditLogger $auditLogger)
    {
        $student = Student::findOrFail($id);
        $this->authorize('delete', $student);
        $oldValues = $student->toArray();
        $student->delete();

        $auditLogger->log(
            action: 'student.deleted',
            description: 'Student deleted.',
            user: auth()->user(),
            oldValues: $oldValues
        );

        return response()->json([
            'message' => 'Student deleted successfully.'
        ]);
    }

    /**
     * Bulk register students (bulk upload JSON list).
     */
    public function bulkStore(StudentBulkStoreRequest $request, AuditLogger $auditLogger)
    {
        $this->authorize('create', Student::class);
        $data = $request->validated();
        $schoolId = $data['school_id'];
        $yearId = $data['academic_year_id'];
        $classId = $data['current_class_level_id'];
        $studentsList = $data['students'];

        DB::beginTransaction();

        try {
            $inserted = 0;
            foreach ($studentsList as $stu) {
                Student::create([
                    'id' => (string) Str::uuid(),
                    'school_id' => $schoolId,
                    'academic_year_id' => $yearId,
                    'current_class_level_id' => $classId,
                    'registration_number' => $stu['registration_number'],
                    'first_name' => $stu['first_name'],
                    'middle_name' => $stu['middle_name'] ?? null,
                    'last_name' => $stu['last_name'],
                    'gender' => $stu['gender'],
                    'parent_name' => $stu['parent_name'] ?? null,
                    'parent_phone' => $stu['parent_phone'],
                ]);
                $inserted++;
            }

            DB::commit();

            $auditLogger->log(
                action: 'student.bulk_created',
                description: 'Students bulk registered.',
                user: $request->user(),
                newValues: [
                    'school_id' => $schoolId,
                    'academic_year_id' => $yearId,
                    'current_class_level_id' => $classId,
                    'inserted' => $inserted,
                ],
                request: $request
            );

            return response()->json([
                'message' => "Successfully registered {$inserted} students in bulk."
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Bulk student registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all active academic years.
     */
    public function academicYears()
    {
        return response()->json(AcademicYear::orderBy('name', 'desc')->get());
    }

    /**
     * Get all class levels.
     */
    public function classLevels()
    {
        return response()->json(ClassLevel::orderBy('numeric_level')->get());
    }

    /**
     * Apply data access scope based on the authenticated user's role.
     */
    protected function applyAccessScope($query, $user): void
    {
        if ($user->hasRole('District Officer') && $user->district_id) {
            $query->whereHas('school', function ($schoolQuery) use ($user) {
                $schoolQuery->where('district_id', $user->district_id);
            });

            return;
        }

        if ($user->hasAnyRole(['School Administrator', 'Teacher']) && $user->school_id) {
            $query->where('school_id', $user->school_id);
        }
    }
}
