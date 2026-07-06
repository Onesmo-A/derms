<?php

namespace App\Domains\Student\Services;

use App\Domains\School\Models\School;
use App\Domains\Student\Models\AcademicYear;
use App\Domains\Student\Models\ClassLevel;
use App\Domains\Student\Models\Student;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentManagementService
{
    public function buildIndexQuery(array $filters, $user): Builder
    {
        $query = Student::with(['school.district.region', 'academicYear', 'classLevel', 'class_level']);
        app(\App\Services\AccessScopeService::class)->applyStudentScope($query, $user);

        $this->applyHierarchyFilters($query, $filters);

        return $query->orderBy('created_at', 'desc');
    }

    public function createStudent(array $data): Student
    {
        $data = $this->normalizeStudentRegistrationNumber($data);
        $this->assertRegistrationNumberAvailable(
            (string) ($data['school_id'] ?? ''),
            (string) ($data['academic_year_id'] ?? ''),
            (string) ($data['current_class_level_id'] ?? ''),
            (string) ($data['registration_number'] ?? '')
        );
        $student = Student::create($data);
        $this->refreshSchoolEnrollmentSummary($student->school_id);

        return $student;
    }

    public function updateStudent(Student $student, array $data): Student
    {
        $originalSchoolId = $student->school_id;
        $targetSchoolId = (string) ($data['school_id'] ?? $student->school_id);
        $targetAcademicYearId = (string) ($data['academic_year_id'] ?? $student->academic_year_id);
        $targetClassLevelId = (string) ($data['current_class_level_id'] ?? $student->current_class_level_id);
        $targetRegistrationNumber = (string) ($data['registration_number'] ?? $student->registration_number);

        if ($targetRegistrationNumber !== '') {
            $this->assertRegistrationNumberAvailable(
                $targetSchoolId,
                $targetAcademicYearId,
                $targetClassLevelId,
                $targetRegistrationNumber,
                $student->id
            );
        }

        $student->update($data);
        $this->refreshSchoolEnrollmentSummary($student->school_id);

        if ($originalSchoolId !== $student->school_id) {
            $this->refreshSchoolEnrollmentSummary($originalSchoolId);
        }

        return $student->fresh();
    }

    public function deleteStudent(Student $student): void
    {
        $schoolId = $student->school_id;
        $student->delete();
        $this->refreshSchoolEnrollmentSummary($schoolId);
    }

    public function bulkCreate(array $data): array
    {
        $schoolId = $data['school_id'];
        $yearId = $data['academic_year_id'];
        $classId = $data['current_class_level_id'];
        $studentsList = $data['students'];

        $inserted = 0;
        $errors = [];

        DB::transaction(function () use ($studentsList, $schoolId, $yearId, $classId, &$inserted, &$errors) {
            $school = School::find($schoolId);
            $classLevel = ClassLevel::find($classId);

            if (!$school || !$classLevel) {
                $errors[] = [
                    'row' => 0,
                    'field' => 'context',
                    'message' => 'School or class level context is missing.',
                ];
                return;
            }

            foreach ($studentsList as $index => $stu) {
                $registrationNumber = $this->normalizeRegistrationNumberFormat((string) ($stu['registration_number'] ?? ''));
                if ($registrationNumber === '') {
                    $registrationNumber = $school->buildStudentRegistrationNumber($classLevel, (string) preg_replace('/\D+/', '', $stu['registration_number'] ?? ''));
                }

                [$prefixPart, $suffixPart] = array_pad(explode('/', $registrationNumber, 2), 2, '');
                $exists = Student::where('school_id', $schoolId)
                    ->where('academic_year_id', $yearId)
                    ->where('current_class_level_id', $classId)
                    ->where(function ($query) use ($registrationNumber, $prefixPart, $suffixPart) {
                        $query->where('registration_number', $registrationNumber);

                        if ($prefixPart !== '' && $suffixPart !== '') {
                            $query->orWhere('registration_number', 'like', $prefixPart . '/F%/' . $suffixPart);
                        }
                    })
                    ->exists();

                if ($exists) {
                    $errors[] = [
                        'row' => $index + 1,
                        'field' => 'registration_number',
                        'message' => "Reg# {$registrationNumber} already exists for this school, class, and academic year.",
                        'data' => $stu,
                    ];
                    continue;
                }

                Student::create([
                    'id' => (string) Str::uuid(),
                    'school_id' => $schoolId,
                    'academic_year_id' => $yearId,
                    'current_class_level_id' => $classId,
                    'registration_number' => $registrationNumber,
                    'first_name' => $stu['first_name'],
                    'middle_name' => $stu['middle_name'] ?? null,
                    'last_name' => $stu['last_name'],
                    'gender' => $stu['gender'],
                    'date_of_birth' => $stu['date_of_birth'] ?? null,
                    'parent_name' => $stu['parent_name'] ?? null,
                    'parent_phone' => $stu['parent_phone'],
                    'status' => 'active',
                ]);
                $inserted++;
            }
        });

        $this->refreshSchoolEnrollmentSummary($schoolId);

        return compact('inserted', 'errors');
    }

    /**
     * Ensure the student registration number is normalized to the expected school prefix format.
     */
    private function normalizeStudentRegistrationNumber(array $data): array
    {
        if (!empty($data['registration_number'])) {
            $data['registration_number'] = $this->normalizeRegistrationNumberFormat((string) $data['registration_number']);
        }

        if (empty($data['registration_number']) && !empty($data['registration_suffix']) && !empty($data['school_id']) && !empty($data['current_class_level_id'])) {
            $school = School::find($data['school_id']);
            $classLevel = ClassLevel::find($data['current_class_level_id']);

            if ($school && $classLevel) {
                $suffix = preg_replace('/\D+/', '', (string) $data['registration_suffix']);
                $data['registration_number'] = $school->buildStudentRegistrationNumber($classLevel, $suffix);
            }
        }

        unset($data['registration_suffix']);

        return $data;
    }

    public function parseImportFile(UploadedFile $file): array
    {
        $ext = strtolower($file->getClientOriginalExtension());
        if (!in_array($ext, ['csv', 'txt'], true)) {
            return [
                'format' => $ext,
                'rows' => [],
            ];
        }

        $rows = [];
        $handle = fopen($file->getRealPath(), 'r');
        $header = null;
        while (($line = fgetcsv($handle)) !== false) {
            if (!$header) {
                $header = array_map('trim', $line);
                continue;
            }

            if (count($line) < 2) {
                continue;
            }

            $rows[] = array_combine($header, array_map('trim', $line));
        }
        fclose($handle);

        return [
            'format' => $ext,
            'rows' => $rows,
        ];
    }

    public function validateImportRows(array $rows): array
    {
        $validRows = [];
        $invalidRows = [];
        $requiredCols = ['registration_number', 'first_name', 'last_name', 'gender', 'parent_phone'];

        foreach ($rows as $i => $row) {
            $rowErrors = [];
            foreach ($requiredCols as $col) {
                if (empty($row[$col] ?? '')) {
                    $rowErrors[] = "Missing: {$col}";
                }
            }
            if (!empty($row['gender']) && !in_array(strtoupper($row['gender']), ['M', 'F'], true)) {
                $rowErrors[] = 'gender must be M or F';
            }
            $normalizedRegistrationNumber = $this->normalizeRegistrationNumberFormat((string) ($row['registration_number'] ?? ''));

            if (!empty($row['registration_number']) && !preg_match('/^[SP]\d{4}\/\d{4}$/', $normalizedRegistrationNumber)) {
                $rowErrors[] = 'registration_number must match the format S0101/0001';
            }
            if (!empty($row['date_of_birth']) && !strtotime($row['date_of_birth'])) {
                $rowErrors[] = 'date_of_birth format must be YYYY-MM-DD';
            }

            $row['_row'] = $i + 2;
            $row['_errors'] = $rowErrors;
            $row['_valid'] = empty($rowErrors);

            if ($row['_valid'] && $normalizedRegistrationNumber !== '') {
                $row['registration_number'] = $normalizedRegistrationNumber;
            }

            if ($row['_valid']) {
                $validRows[] = $row;
            } else {
                $invalidRows[] = $row;
            }
        }

        return compact('validRows', 'invalidRows');
    }

    public function commitImportedRows(array $validRows, string $schoolId, string $yearId, string $classId): array
    {
        $inserted = 0;
        $skipped = 0;
        $invalidRows = [];

        DB::transaction(function () use ($validRows, $schoolId, $yearId, $classId, &$inserted, &$skipped, &$invalidRows) {
            foreach ($validRows as $stu) {
                $registrationNumber = $this->normalizeRegistrationNumberFormat((string) ($stu['registration_number'] ?? ''));
                [$prefixPart, $suffixPart] = array_pad(explode('/', $registrationNumber, 2), 2, '');
                $exists = Student::where('school_id', $schoolId)
                    ->where('academic_year_id', $yearId)
                    ->where('current_class_level_id', $classId)
                    ->where(function ($query) use ($registrationNumber, $prefixPart, $suffixPart) {
                        $query->where('registration_number', $registrationNumber);

                        if ($prefixPart !== '' && $suffixPart !== '') {
                            $query->orWhere('registration_number', 'like', $prefixPart . '/F%/' . $suffixPart);
                        }
                    })
                    ->exists();

                if ($exists) {
                    $skipped++;
                    $invalidRows[] = array_merge($stu, ['_errors' => ['Duplicate reg# in selected school, class, and academic year']]);
                    continue;
                }

                Student::create([
                    'id' => (string) Str::uuid(),
                    'school_id' => $schoolId,
                    'academic_year_id' => $yearId,
                    'current_class_level_id' => $classId,
                    'registration_number' => $registrationNumber,
                    'first_name' => $stu['first_name'],
                    'middle_name' => $stu['middle_name'] ?? null,
                    'last_name' => $stu['last_name'],
                    'gender' => strtoupper($stu['gender']),
                    'date_of_birth' => !empty($stu['date_of_birth']) ? $stu['date_of_birth'] : null,
                    'parent_name' => $stu['parent_name'] ?? null,
                    'parent_phone' => $stu['parent_phone'],
                    'status' => 'active',
                ]);
                $inserted++;
            }
        });

        $this->refreshSchoolEnrollmentSummary($schoolId);

        return compact('inserted', 'skipped', 'invalidRows');
    }

    public function exportStream(array $filters, $user): StreamedResponse
    {
        $students = $this->buildIndexQuery($filters, $user)->get();
        $classLabel = null;
        if (!empty($filters['current_class_level_id'])) {
            $classLabel = ClassLevel::find($filters['current_class_level_id'])?->name;
        }

        $filenameParts = ['students_export'];
        if ($classLabel) {
            $filenameParts[] = Str::slug($classLabel);
        }
        $filenameParts[] = now()->format('Ymd_His');

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . implode('_', $filenameParts) . '.csv"',
            'Cache-Control' => 'no-cache, no-store',
        ];

        return response()->stream(function () use ($students) {
            $handle = fopen('php://output', 'w');
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

    public function downloadTemplate(): StreamedResponse
    {
        $filename = 'IDEMS_Student_Import_Template_' . now()->format('Ymd') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'no-cache, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, ['# IDEMS - Student Bulk Import Template']);
            fputcsv($handle, ['# DO NOT modify column headers (Row 7)']);
            fputcsv($handle, ['# Gender: Use M (Male) or F (Female) only']);
            fputcsv($handle, ['# date_of_birth format: YYYY-MM-DD (e.g. 2008-03-15)']);
            fputcsv($handle, ['# parent_phone: Include country code e.g. 0712345678']);
            fputcsv($handle, ['# Fields marked * are REQUIRED. Leave optional fields blank if unknown.']);
            fputcsv($handle, ['# registration_number format example: S0101/0001']);

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

            $samples = [
                ['S0101/0001', 'Amina', 'Juma', 'Hassan', 'F', '2009-04-10', 'Juma Hassan', '0712345678'],
                ['P0104/0001', 'John', '', 'Mwalimu', 'M', '2008-11-22', 'Peter Mwalimu', '0756789012'],
                ['S0105/0001', 'Fatuma', 'Ali', 'Mkumbwa', 'F', '2009-07-05', 'Ali Mkumbwa', '0789123456'],
            ];
            foreach ($samples as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, $headers);
    }

    public function promoteStudent(Student $student, array $validated): Student
    {
        $student->update([
            'academic_year_id' => $validated['academic_year_id'],
            'current_class_level_id' => $validated['current_class_level_id'],
        ]);

        return $student->fresh();
    }

    public function transferStudent(Student $student, array $validated): Student
    {
        $originalSchoolId = $student->school_id;
        $student->update([
            'school_id' => $validated['school_id'],
            'status' => 'transferred',
        ]);
        $this->refreshSchoolEnrollmentSummary($student->school_id);

        if ($originalSchoolId !== $student->school_id) {
            $this->refreshSchoolEnrollmentSummary($originalSchoolId);
        }

        return $student->fresh();
    }

    public function findDuplicates(array $filters, $user): array
    {
        $query = Student::with(['school.district.region', 'academicYear', 'classLevel', 'class_level']);
        app(\App\Services\AccessScopeService::class)->applyStudentScope($query, $user);
        $this->applyDuplicateFilters($query, $filters);

        $students = $query->select([
            'id', 'school_id', 'academic_year_id', 'current_class_level_id', 'registration_number', 'first_name', 'middle_name',
            'last_name', 'gender', 'date_of_birth', 'parent_phone', 'status',
        ])->get();

        $duplicates = [];
        foreach ($students->groupBy(fn ($student) => implode('|', [
            (string) $student->school_id,
            (string) $student->academic_year_id,
            (string) $student->current_class_level_id,
            (string) $student->registration_number,
        ])) as $key => $group) {
            if ($group->count() > 1) {
                $first = $group->first();
                $duplicates[] = [
                    'type' => 'duplicate_registration_number',
                    'label' => sprintf(
                        'Reg# %s (%s / %s / %s)',
                        $first->registration_number,
                        $first->school?->name ?? 'Unknown School',
                        $first->academicYear?->name ?? 'Unknown Year',
                        $first->classLevel?->name ?? 'Unknown Class'
                    ),
                    'count' => $group->count(),
                    'students' => $group->values(),
                    'risk_level' => 'high',
                ];
            }
        }

        foreach ($students->groupBy(fn ($s) => strtolower(trim("{$s->first_name} {$s->last_name}")) . '|' . ($s->date_of_birth ? $s->date_of_birth->format('Y-m-d') : '')) as $key => $group) {
            if ($group->count() > 1 && !str_ends_with($key, '|')) {
                $duplicates[] = [
                    'type' => 'duplicate_name_dob',
                    'label' => 'Same Name + DOB: ' . explode('|', $key)[0],
                    'count' => $group->count(),
                    'students' => $group->values(),
                    'risk_level' => 'high',
                ];
            }
        }

        foreach ($students->groupBy(fn ($s) => strtolower(trim("{$s->first_name} {$s->last_name}")) . '|' . trim($s->parent_phone ?? '')) as $key => $group) {
            if ($group->count() > 1 && !str_ends_with($key, '|')) {
                $duplicates[] = [
                    'type' => 'duplicate_name_phone',
                    'label' => 'Same Name + Phone: ' . explode('|', $key)[0],
                    'count' => $group->count(),
                    'students' => $group->values(),
                    'risk_level' => 'medium',
                ];
            }
        }

        return $duplicates;
    }

    public function getPerformance(string $studentId): array
    {
        $student = Student::with(['school.district.region', 'classLevel', 'class_level'])->findOrFail($studentId);

        $registrations = DB::table('examination_registrations as er')
            ->join('examinations as e', 'e.id', '=', 'er.examination_id')
            ->join('examination_types as et', 'et.id', '=', 'e.examination_type_id')
            ->join('class_levels as cl', 'cl.id', '=', 'er.class_level_id')
            ->leftJoin('student_exam_summaries as ses', 'ses.examination_registration_id', '=', 'er.id')
            ->where('er.student_id', $studentId)
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

        return [
            'student' => $student,
            'performance' => $registrations,
        ];
    }

    public function getStats($user): array
    {
        $query = Student::query();
        app(\App\Services\AccessScopeService::class)->applyStudentScope($query, $user);

        $total = (clone $query)->count();
        $male = (clone $query)->where('gender', 'M')->count();
        $female = (clone $query)->where('gender', 'F')->count();
        $active = (clone $query)->where('status', 'active')->count();
        $transferred = (clone $query)->where('status', 'transferred')->count();
        $completed = (clone $query)->where('status', 'completed')->count();

        $perSchool = School::withCount('students')
            ->orderByDesc('students_count')
            ->limit(20)
            ->get(['id', 'name'])
            ->filter(fn ($s) => $s->students_count > 0)
            ->take(10)
            ->map(fn ($s) => ['name' => $s->name, 'count' => $s->students_count])
            ->values();

        return compact('total', 'male', 'female', 'active', 'transferred', 'completed', 'perSchool');
    }

    public function academicYears(): Collection
    {
        return AcademicYear::orderBy('name', 'desc')->get();
    }

    public function classLevels(): Collection
    {
        return ClassLevel::orderBy('numeric_level')->get();
    }

    private function applyHierarchyFilters(Builder $query, array $filters): void
    {
        if (!empty($filters['region_id'])) {
            $query->whereHas('school.district', fn ($q) => $q->where('region_id', $filters['region_id']));
        }

        if (!empty($filters['district_id'])) {
            $query->whereHas('school', fn ($q) => $q->where('district_id', $filters['district_id']));
        }

        if (!empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (!empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (!empty($filters['current_class_level_id'])) {
            $query->where('current_class_level_id', $filters['current_class_level_id']);
        }

        if (!empty($filters['gender'])) {
            $query->where('gender', $filters['gender']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }
    }

    private function applyDuplicateFilters(Builder $query, array $filters): void
    {
        if (!empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        } elseif (!empty($filters['district_id'])) {
            $query->whereHas('school', fn ($q) => $q->where('district_id', $filters['district_id']));
        }
    }

    private function refreshSchoolEnrollmentSummary(?string $schoolId): void
    {
        if (!$schoolId) {
            return;
        }

        $school = School::find($schoolId);

        if ($school) {
            $school->refreshEnrollmentSummary();
        }
    }

    private function assertRegistrationNumberAvailable(
        string $schoolId,
        string $academicYearId,
        string $classLevelId,
        string $registrationNumber,
        ?string $ignoreStudentId = null
    ): void
    {
        $registrationNumber = $this->normalizeRegistrationNumberFormat($registrationNumber);

        if ($schoolId === '' || $academicYearId === '' || $classLevelId === '' || $registrationNumber === '') {
            return;
        }

        [$prefixPart, $suffixPart] = array_pad(explode('/', $registrationNumber, 2), 2, '');
        $query = Student::where('school_id', $schoolId)
            ->where('academic_year_id', $academicYearId)
            ->where('current_class_level_id', $classLevelId)
            ->where(function ($builder) use ($registrationNumber, $prefixPart, $suffixPart) {
                $builder->where('registration_number', $registrationNumber);

                if ($prefixPart !== '' && $suffixPart !== '') {
                    $builder->orWhere('registration_number', 'like', $prefixPart . '/F%/' . $suffixPart);
                }
            });

        if ($ignoreStudentId) {
            $query->where('id', '!=', $ignoreStudentId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'registration_number' => ['That registration number already exists in the selected school, class, and academic year.'],
            ]);
        }
    }

    private function normalizeRegistrationNumberFormat(string $registrationNumber): string
    {
        $registrationNumber = strtoupper(trim($registrationNumber));

        if ($registrationNumber === '') {
            return '';
        }

        if (preg_match('/^([SP]\d{4})\/F\d+\/(\d{4})$/', $registrationNumber, $matches)) {
            return $matches[1] . '/' . $matches[2];
        }

        if (preg_match('/^([SP]\d{4})\/(\d{4})$/', $registrationNumber, $matches)) {
            return $matches[1] . '/' . $matches[2];
        }

        return $registrationNumber;
    }
}
