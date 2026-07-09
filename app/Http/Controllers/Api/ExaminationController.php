<?php

namespace App\Http\Controllers\Api;

use App\Domains\Examination\Models\Examination;
use App\Domains\Examination\Models\ExaminationRegistration;
use App\Domains\Examination\Models\ExaminationSubject;
use App\Domains\Examination\Services\ExaminationCatalogService;
use App\Domains\Examination\Services\ExaminationManagementService;
use App\Domains\Examination\Services\ExaminationSetupService;
use App\Domains\Notification\Jobs\SendStudentResultSmsJob;
use App\Domains\Results\Jobs\ProcessExamResultsJob;
use App\Enums\ExaminationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Examination\ConfigureSubjectsRequest;
use App\Http\Requests\Api\Examination\ProcessResultsRequest;
use App\Http\Requests\Api\Examination\RegisterCandidatesRequest;
use App\Http\Requests\Api\Examination\StoreExaminationRequest;
use App\Http\Requests\Api\Examination\StoreGradingSystemRequest;
use App\Http\Requests\Api\Examination\UpdateExaminationRequest;
use App\Http\Requests\Api\Examination\UpdateExaminationStatusRequest;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExaminationController extends Controller
{
    public function __construct(
        private ExaminationCatalogService $catalogService,
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Examination::class);

        return response()->json($this->catalogService->list($request->all()));
    }

    public function store(StoreExaminationRequest $request, ExaminationManagementService $managementService)
    {
        $this->authorize('create', Examination::class);

        try {
            $exam = $managementService->createDraft($request->validated(), $request->user()->id);

            return response()->json([
                'examination' => $exam,
                'message' => 'Examination created successfully as draft.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create examination: ' . $e->getMessage()], 500);
        }
    }

    public function update(UpdateExaminationRequest $request, string $id, ExaminationManagementService $managementService)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);

        if (! in_array($exam->status, [ExaminationStatus::Draft, ExaminationStatus::RegistrationOpen], true)) {
            return response()->json([
                'message' => 'Examinations can only be edited while in draft or registration open state.',
            ], 422);
        }

        try {
            $exam = $managementService->updateDraft($exam, $request->validated());

            return response()->json([
                'examination' => $exam,
                'message' => 'Examination updated successfully.',
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to update examination: ' . $e->getMessage()], 500);
        }
    }

    public function show(string $id)
    {
        $exam = $this->catalogService->show($id);
        $this->authorize('view', $exam);

        return response()->json($exam);
    }

    public function updateStatus(
        UpdateExaminationStatusRequest $request,
        string $id,
        ExaminationManagementService $managementService
    ) {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);

        try {
            $exam = $managementService->transition($exam, $request->status);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'status' => $exam->status instanceof ExaminationStatus ? $exam->status->value : (string) $exam->status,
            'message' => 'Examination status changed to ' . ($exam->status instanceof ExaminationStatus ? $exam->status->value : (string) $exam->status) . '.',
        ]);
    }

    public function openRegistration(string $id, ExaminationManagementService $managementService, AuditLogger $auditLogger)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);

        $exam = $managementService->openRegistration($exam);

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

    public function closeRegistration(string $id, ExaminationManagementService $managementService, AuditLogger $auditLogger)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);

        $exam = $managementService->closeRegistration($exam);

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

    public function publishResults(string $id, ExaminationManagementService $managementService, AuditLogger $auditLogger)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);

        try {
            $exam = $managementService->publish($exam);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $registrations = ExaminationRegistration::where('examination_id', $exam->id)->pluck('id');
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

    public function unpublishResults(string $id, ExaminationManagementService $managementService, AuditLogger $auditLogger)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);

        try {
            $exam = $managementService->unpublish($exam);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

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

    public function processingStatus(string $id)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('view', $exam);

        return response()->json($this->catalogService->processingStatus($exam));
    }

    public function configureSubjects(ConfigureSubjectsRequest $request, string $id, ExaminationSetupService $setupService)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('configureSubjects', $exam);

        if (! in_array($exam->status, [ExaminationStatus::Draft, ExaminationStatus::RegistrationOpen], true)) {
            return response()->json([
                'message' => 'Subjects can only be configured while the examination is in draft or registration open state.',
            ], 422);
        }

        try {
            $classLevelId = $this->resolveExamClassLevelId($exam, $request->input('class_level_id'));
            $setupService->configureSubjects($exam, $classLevelId, $request->validated('subjects'));

            return response()->json(['message' => 'Examination subjects configured successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to configure subjects: ' . $e->getMessage()], 422);
        }
    }

    public function registerCandidates(RegisterCandidatesRequest $request, string $id, ExaminationSetupService $setupService)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('registerCandidates', $exam);

        if ($exam->status !== ExaminationStatus::RegistrationOpen) {
            return response()->json(['message' => 'Candidates can only be registered while registration is open.'], 422);
        }

        try {
            $validated = $request->validated();

            if (empty($validated['student_ids'] ?? []) && empty($validated['school_ids'] ?? [])) {
                return response()->json(['message' => 'Select eligible students or one or more schools first.'], 422);
            }

            $classLevelId = $this->resolveExamClassLevelId($exam, $validated['class_level_id'] ?? null);

            $byStudents = !empty($validated['student_ids'] ?? []);
            $registeredCount = $byStudents
                ? $setupService->registerSpecificCandidates($exam, $classLevelId, $validated['student_ids'])
                : $setupService->registerCandidates($exam, $classLevelId, $validated['school_ids']);

            return response()->json([
                'message' => $byStudents
                    ? "Successfully registered {$registeredCount} selected candidates."
                    : "Successfully registered {$registeredCount} candidates across selected schools.",
                'registered_count' => $registeredCount,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Candidate registration failed: ' . $e->getMessage()], 500);
        }
    }

    public function gradingSystems(ExaminationCatalogService $catalogService)
    {
        return response()->json($catalogService->gradingSystems());
    }

    public function storeGradingSystem(StoreGradingSystemRequest $request, ExaminationSetupService $setupService)
    {
        try {
            $gradingSystem = $setupService->createGradingSystem($request->validated());

            return response()->json([
                'grading_system' => $gradingSystem,
                'message' => 'Grading scheme created successfully.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to save grading scheme: ' . $e->getMessage()], 500);
        }
    }

    public function examTypes(ExaminationCatalogService $catalogService)
    {
        return response()->json($catalogService->examTypes());
    }

    public function curriculumSubjects(ExaminationCatalogService $catalogService)
    {
        return response()->json($catalogService->curriculumSubjects());
    }

    public function processResults(
        ProcessResultsRequest $request,
        string $id,
        ExaminationManagementService $managementService,
        AuditLogger $auditLogger
    ) {
        $exam = Examination::findOrFail($id);
        $this->authorize('processResults', $exam);

        if ($exam->status === ExaminationStatus::RegistrationClosed) {
            try {
                $exam = $managementService->openMarksEntry($exam);
            } catch (\Throwable $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        }

        if ($exam->status !== ExaminationStatus::MarksEntryOpen) {
            return response()->json(['message' => 'Results can only be processed after marks entry is ready.'], 422);
        }

        $classLevelId = $this->resolveExamClassLevelId($exam, $request->input('class_level_id'));

        if (app()->environment(['local', 'testing'])) {
            ProcessExamResultsJob::dispatchSync($exam->id, $classLevelId);
        } else {
            ProcessExamResultsJob::dispatch($exam->id, $classLevelId);
        }

        $auditLogger->log(
            action: 'examination.process.queue',
            description: 'Results processing queued.',
            user: $request->user(),
            newValues: [
                'examination_id' => $exam->id,
                'class_level_id' => $classLevelId,
            ],
            request: $request
        );

        return response()->json([
            'message' => 'Results processing queued successfully. Ranks and summaries will compile in the background.',
        ]);
    }

    public function destroy(string $id, AuditLogger $auditLogger)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('delete', $exam);

        $old = $exam->toArray();
        $exam->delete();

        $auditLogger->log(
            action: 'examination.deleted',
            description: 'Examination deleted: ' . $exam->name,
            user: auth()->user(),
            oldValues: $old
        );

        return response()->json(['message' => 'Examination deleted successfully.']);
    }

    public function getTimetable(string $id, ExaminationCatalogService $catalogService)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('view', $exam);

        return response()->json($catalogService->getTimetable($id));
    }

    public function updateTimetable(Request $request, string $id, AuditLogger $auditLogger, ExaminationCatalogService $catalogService)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);

        $request->validate([
            'schedules' => 'required|array',
            'schedules.*.examination_subject_id' => 'required|uuid',
            'schedules.*.exam_date' => 'nullable|date',
            'schedules.*.start_time' => 'nullable|string|max:10',
            'schedules.*.end_time' => 'nullable|string|max:10',
        ]);

        $catalogService->updateTimetable($request->schedules);

        $auditLogger->log(
            action: 'examination.timetable.updated',
            description: 'Timetable updated for exam: ' . $exam->name,
            user: $request->user(),
            newValues: ['examination_id' => $id]
        );

        return response()->json(['message' => 'Timetable updated successfully.']);
    }

    public function deleteTimetableItem(string $id, string $subjectId, AuditLogger $auditLogger)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('update', $exam);

        $schedule = ExaminationSubject::where('id', $subjectId)
            ->where('examination_id', $exam->id)
            ->firstOrFail();

        $old = $schedule->toArray();
        $schedule->delete();

        $auditLogger->log(
            action: 'examination.timetable.deleted',
            description: 'Timetable schedule deleted for exam: ' . $exam->name,
            user: auth()->user(),
            oldValues: $old,
            newValues: ['examination_id' => $id, 'deleted_subject_id' => $subjectId]
        );

        return response()->json(['message' => 'Timetable schedule removed successfully.']);
    }

    public function getCandidates(Request $request, string $id, ExaminationCatalogService $catalogService)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('view', $exam);

        return response()->json($catalogService->getCandidates($id, $request->all()));
    }

    public function getEligibleStudents(Request $request, string $id, ExaminationCatalogService $catalogService)
    {
        $exam = Examination::findOrFail($id);
        $this->authorize('view', $exam);

        return response()->json($catalogService->getEligibleStudents($id, $request->all()));
    }

    private function resolveExamClassLevelId(Examination $exam, ?string $requestedClassLevelId): string
    {
        $targetClassLevelId = $exam->target_class_level_id
            ?? $exam->targetClassLevel?->id
            ?? $exam->classLevels()->value('class_levels.id');

        if (!$targetClassLevelId) {
            throw new \RuntimeException('This examination does not have a target class level configured.');
        }

        if (!empty($requestedClassLevelId) && $requestedClassLevelId !== $targetClassLevelId) {
            throw new \RuntimeException('The selected class level does not match the target class level for this examination.');
        }

        return $targetClassLevelId;
    }
}
