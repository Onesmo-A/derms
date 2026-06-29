<?php

namespace App\Http\Controllers\Api;

use App\Actions\Examination\TransitionExaminationStatusAction;
use App\Http\Controllers\Controller;
use App\Enums\ExaminationStatus;
use App\Enums\ExaminationRegistrationStatus;
use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Examination\Models\GradingSystem;
use App\Domains\Examination\Models\GradingSystemDetail;
use App\Domains\Examination\Models\ExaminationType;
use App\Domains\Examination\Models\Subject;
use App\Domains\Results\Jobs\ProcessExamResultsJob;
use App\Domains\Notification\Jobs\SendStudentResultSmsJob;
use App\Domains\Student\Models\Student;
use App\Domains\School\Models\School;
use App\Http\Requests\Api\Examination\ConfigureSubjectsRequest;
use App\Http\Requests\Api\Examination\ProcessResultsRequest;
use App\Http\Requests\Api\Examination\RegisterCandidatesRequest;
use App\Http\Requests\Api\Examination\StoreExaminationRequest;
use App\Http\Requests\Api\Examination\StoreGradingSystemRequest;
use App\Http\Requests\Api\Examination\UpdateExaminationStatusRequest;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExaminationController extends Controller
{
    /**
     * Display a listing of examinations.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Examination::class);

        $query = Examination::with(['academicYear', 'examinationType', 'classLevels']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    /**
     * Store a new examination definition (Draft).
     */
    public function store(StoreExaminationRequest $request)
    {
        $this->authorize('create', Examination::class);

        DB::beginTransaction();

        try {
            $exam = Examination::create([
                'id' => (string) Str::uuid(),
                'academic_year_id' => $request->academic_year_id,
                'examination_type_id' => $request->examination_type_id,
                'name' => $request->name,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'status' => ExaminationStatus::Draft->value,
                'created_by' => $request->user()->id,
            ]);

            $exam->classLevels()->sync($request->class_level_ids);

            DB::commit();

            return response()->json([
                'examination' => $exam->load(['academicYear', 'examinationType', 'classLevels']),
                'message' => 'Examination created successfully as draft.'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create examination: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display examination details.
     */
    public function show(string $id)
    {
        $exam = Examination::with([
            'academicYear',
            'examinationType',
            'classLevels',
            'examinationSubjects.subject',
            'examinationSubjects.classLevel'
        ])->findOrFail($id);

        $this->authorize('view', $exam);

        return response()->json($exam);
    }

    /**
     * Update examination status (phase transitions).
     */
    public function updateStatus(
        UpdateExaminationStatusRequest $request,
        string $id,
        TransitionExaminationStatusAction $transitionAction
    )
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);

        try {
            $exam = $transitionAction->handle($exam, $request->status);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'status' => $exam->status,
            'message' => "Examination status changed to {$exam->status}."
        ]);
    }

    /**
     * Open registration for an exam.
     */
    public function openRegistration(string $id, TransitionExaminationStatusAction $transitionAction, AuditLogger $auditLogger)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);
        $exam = $transitionAction->handle($exam, ExaminationStatus::RegistrationOpen->value);
        $auditLogger->log(
            action: 'examination.status.open_registration',
            description: 'Registration opened.',
            user: auth()->user(),
            newValues: ['examination_id' => $exam->id, 'status' => $exam->status->value]
        );

        return response()->json([
            'status' => $exam->status->value,
            'message' => 'Registration opened successfully.',
        ]);
    }

    /**
     * Close registration for an exam.
     */
    public function closeRegistration(string $id, TransitionExaminationStatusAction $transitionAction, AuditLogger $auditLogger)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);
        $exam = $transitionAction->handle($exam, ExaminationStatus::RegistrationClosed->value);
        $auditLogger->log(
            action: 'examination.status.close_registration',
            description: 'Registration closed.',
            user: auth()->user(),
            newValues: ['examination_id' => $exam->id, 'status' => $exam->status->value]
        );

        return response()->json([
            'status' => $exam->status->value,
            'message' => 'Registration closed successfully.',
        ]);
    }

    /**
     * Publish processed results and queue parent SMS notifications.
     */
    public function publishResults(string $id, TransitionExaminationStatusAction $transitionAction, AuditLogger $auditLogger)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);

        if ($exam->status !== ExaminationStatus::Processed) {
            return response()->json([
                'message' => 'Only processed examinations can be published.',
            ], 422);
        }

        $exam = $transitionAction->handle($exam, ExaminationStatus::Published->value);

        $registrations = \App\Domains\Examination\Models\ExaminationRegistration::where('examination_id', $exam->id)
            ->pluck('id');

        foreach ($registrations as $registrationId) {
            if (app()->environment(['local', 'testing'])) {
                SendStudentResultSmsJob::dispatchSync($registrationId);
            } else {
                SendStudentResultSmsJob::dispatch($registrationId);
            }
        }

        $auditLogger->log(
            action: 'examination.publish',
            description: 'Results were published and SMS queued.',
            user: auth()->user(),
            newValues: [
                'examination_id' => $exam->id,
                'queued_sms_jobs' => $registrations->count(),
            ]
        );

        return response()->json([
            'status' => $exam->status->value,
            'message' => 'Results published successfully and SMS notifications queued.',
        ]);
    }

    /**
     * Revert published results back to processed.
     */
    public function unpublishResults(string $id, TransitionExaminationStatusAction $transitionAction, AuditLogger $auditLogger)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);

        if ($exam->status !== ExaminationStatus::Published) {
            return response()->json([
                'message' => 'Only published examinations can be unpublished.',
            ], 422);
        }

        $exam = $transitionAction->handle($exam, ExaminationStatus::Processed->value);
        $auditLogger->log(
            action: 'examination.unpublish',
            description: 'Published results reverted to processed.',
            user: auth()->user(),
            newValues: ['examination_id' => $exam->id, 'status' => $exam->status->value]
        );

        return response()->json([
            'status' => $exam->status->value,
            'message' => 'Results reverted to processed state.',
        ]);
    }

    /**
     * Get processing status for an examination.
     */
    public function processingStatus(string $id)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('view', $exam);

        return response()->json([
            'examination_id' => $exam->id,
            'status' => $exam->status->value,
        ]);
    }

    /**
     * Configure subjects for an examination (Max marks, pass marks, and theory/practical weights).
     */
    public function configureSubjects(ConfigureSubjectsRequest $request, string $id)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('configureSubjects', $exam);

        if (! in_array($exam->status, [ExaminationStatus::Draft, ExaminationStatus::RegistrationOpen], true)) {
            return response()->json([
                'message' => 'Subjects can only be configured while the examination is in draft or registration open state.'
            ], 422);
        }

        $classLevelId = $request->class_level_id;
        $subjectsList = $request->subjects;

        DB::beginTransaction();

        try {
            // Remove previous subject configuration for this class level
            ExaminationSubject::where('examination_id', $exam->id)
                ->where('class_level_id', $classLevelId)
                ->delete();

            foreach ($subjectsList as $sub) {
                // Ensure weights sum up to 100%
                $p1 = $sub['paper_one_weight'];
                $p2 = $sub['paper_two_weight'];
                if (($p1 + $p2) !== 100.0 && ($p1 + $p2) !== 100) {
                    throw new \Exception("Paper 1 and Paper 2 weights must sum up to exactly 100%.");
                }

                ExaminationSubject::create([
                    'id' => (string) Str::uuid(),
                    'examination_id' => $exam->id,
                    'class_level_id' => $classLevelId,
                    'subject_id' => $sub['subject_id'],
                    'max_marks' => $sub['max_marks'],
                    'pass_marks' => $sub['pass_marks'],
                    'paper_one_weight' => $p1,
                    'paper_two_weight' => $p2,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Examination subjects configured successfully.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to configure subjects: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Candidate Registration Flow: Automated generation of candidate numbers.
     */
    public function registerCandidates(RegisterCandidatesRequest $request, string $id)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('registerCandidates', $exam);

        if ($exam->status !== ExaminationStatus::RegistrationOpen) {
            return response()->json([
                'message' => 'Candidates can only be registered while registration is open.'
            ], 422);
        }

        $schoolIds = $request->school_ids;
        $classLevelId = $request->class_level_id;
        $academicYearName = $exam->academicYear->name;

        DB::beginTransaction();

        try {
            $registeredCount = 0;

            foreach ($schoolIds as $schoolId) {
                $school = School::findOrFail($schoolId);

                // Fetch all students in this school at this class level
                $students = Student::where('school_id', $schoolId)
                    ->where('current_class_level_id', $classLevelId)
                    ->where('status', 'active')
                    ->get();

                foreach ($students as $student) {
                    // Check if already registered
                    $exists = ExaminationRegistration::where('examination_id', $exam->id)
                        ->where('student_id', $student->id)
                        ->first();

                    if ($exists) {
                        continue;
                    }

                    // Generate next sequential index for the school's candidate number
                    // Format: SchoolRegNumber/CandidateIndex/Year -> e.g. S0101/0001/2026
                    $candidateIndex = ExaminationRegistration::join('students', 'examination_registrations.student_id', '=', 'students.id')
                        ->where('examination_registrations.examination_id', $exam->id)
                        ->where('students.school_id', $schoolId)
                        ->count() + 1;

                    $paddedIndex = str_pad($candidateIndex, 4, '0', STR_PAD_LEFT);
                    $examNumber = "{$school->registration_number}/{$paddedIndex}/{$academicYearName}";

                    ExaminationRegistration::create([
                        'id' => (string) Str::uuid(),
                        'examination_id' => $exam->id,
                        'student_id' => $student->id,
                        'class_level_id' => $classLevelId,
                        'exam_number' => $examNumber,
                        'status' => ExaminationRegistrationStatus::Registered->value,
                    ]);

                    $registeredCount++;
                }
            }

            DB::commit();

            return response()->json([
                'message' => "Successfully registered {$registeredCount} candidates across selected schools."
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Candidate registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get list of grading systems.
     */
    public function gradingSystems()
    {
        return response()->json(GradingSystem::with('details')->get());
    }

    /**
     * Save/Configure grading system with grade details.
     */
    public function storeGradingSystem(StoreGradingSystemRequest $request)
    {
        DB::beginTransaction();

        try {
            $gradingSystem = GradingSystem::create([
                'id' => (string) Str::uuid(),
                'name' => $request->name,
                'class_level_id' => $request->class_level_id,
                'type' => $request->type,
            ]);

            foreach ($request->details as $detail) {
                GradingSystemDetail::create([
                    'id' => (string) Str::uuid(),
                    'grading_system_id' => $gradingSystem->id,
                    'grade' => $detail['grade'],
                    'min_score' => $detail['min_score'],
                    'max_score' => $detail['max_score'],
                    'points' => $detail['points'],
                    'min_points' => $detail['min_points'] ?? null,
                    'max_points' => $detail['max_points'] ?? null,
                    'description' => $detail['description'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'grading_system' => $gradingSystem->load('details'),
                'message' => 'Grading scheme created successfully.'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to save grading scheme: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all exam types (Pre-mock, Mock, Series).
     */
    public function examTypes()
    {
        return response()->json(ExaminationType::all());
    }

    /**
     * Get listing of curriculum subjects.
     */
    public function curriculumSubjects()
    {
        return response()->json(Subject::all());
    }

    /**
     * Trigger background results processing job.
     */
    public function processResults(
        ProcessResultsRequest $request,
        string $id,
        TransitionExaminationStatusAction $transitionAction,
        AuditLogger $auditLogger
    )
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('processResults', $exam);

        if ($exam->status === ExaminationStatus::RegistrationClosed) {
            try {
                $exam = $transitionAction->handle($exam, ExaminationStatus::MarksEntryOpen->value);
            } catch (\Throwable $e) {
                return response()->json([
                    'message' => $e->getMessage(),
                ], 422);
            }
        }

        if ($exam->status !== ExaminationStatus::MarksEntryOpen) {
            return response()->json([
                'message' => 'Results can only be processed after marks entry is ready.'
            ], 422);
        }

        if (app()->environment(['local', 'testing'])) {
            ProcessExamResultsJob::dispatchSync($exam->id, $request->class_level_id);
        } else {
            ProcessExamResultsJob::dispatch($exam->id, $request->class_level_id);
        }

        $auditLogger->log(
            action: 'examination.process.queue',
            description: 'Results processing queued.',
            user: $request->user(),
            newValues: [
                'examination_id' => $exam->id,
                'class_level_id' => $request->class_level_id,
            ],
            request: $request
        );

        return response()->json([
            'message' => 'Results processing queued successfully. Ranks and summaries will compile in the background.'
        ]);
    }
}
