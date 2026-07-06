<?php

namespace App\Domains\Examination\Services;

use App\Actions\Examination\TransitionExaminationStatusAction;
use App\Domains\Examination\Models\Examination;
use App\Enums\ExaminationStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExaminationManagementService
{
    public function __construct(
        private TransitionExaminationStatusAction $transitionStatusAction,
    ) {
    }

    /**
     * Create an examination draft and attach its target class level.
     */
    public function createDraft(array $data, string $createdById): Examination
    {
        return DB::transaction(function () use ($data, $createdById): Examination {
            $classLevelId = $this->resolveClassLevelId($data);

            $exam = Examination::create([
                'id' => (string) Str::uuid(),
                'academic_year_id' => $data['academic_year_id'],
                'examination_type_id' => $data['examination_type_id'],
                'target_class_level_id' => $classLevelId,
                'code' => $data['code'],
                'name' => $data['name'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'status' => ExaminationStatus::Draft->value,
                'created_by' => $createdById,
            ]);

            $this->syncTargetClassLevel($exam, $classLevelId);

            return $exam->load(['academicYear', 'examinationType', 'targetClassLevel', 'classLevels']);
        });
    }

    /**
     * Update an examination draft and re-sync its target class level.
     */
    public function updateDraft(Examination $examination, array $data): Examination
    {
        return DB::transaction(function () use ($examination, $data): Examination {
            $classLevelId = $this->resolveClassLevelId($data);

            $examination->update([
                'academic_year_id' => $data['academic_year_id'],
                'examination_type_id' => $data['examination_type_id'],
                'target_class_level_id' => $classLevelId,
                'code' => $data['code'],
                'name' => $data['name'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
            ]);

            $this->syncTargetClassLevel($examination, $classLevelId);

            return $examination->load(['academicYear', 'examinationType', 'targetClassLevel', 'classLevels']);
        });
    }

    /**
     * Resolve the single class level for an exam from new or legacy payloads.
     */
    private function resolveClassLevelId(array $data): string
    {
        $classLevelId = $data['class_level_id'] ?? null;

        if (!empty($classLevelId)) {
            return (string) $classLevelId;
        }

        $legacyIds = array_values(array_filter($data['class_level_ids'] ?? []));
        if (!empty($legacyIds[0])) {
            return (string) $legacyIds[0];
        }

        throw new \InvalidArgumentException('A target class level is required.');
    }

    /**
     * Sync examination class level while preserving the UUID primary key on the pivot table.
     */
    private function syncTargetClassLevel(Examination $examination, string $classLevelId): void
    {
        $now = now();

        DB::table('examination_class_levels')
            ->where('examination_id', $examination->id)
            ->delete();

        DB::table('examination_class_levels')->insert([
            'id' => (string) Str::uuid(),
            'examination_id' => $examination->id,
            'class_level_id' => $classLevelId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * Move an examination to a supported lifecycle state.
     */
    public function transition(Examination $examination, string $targetStatus): Examination
    {
        return $this->transitionStatusAction->handle($examination, $targetStatus);
    }

    /**
     * Open registration for an examination.
     */
    public function openRegistration(Examination $examination): Examination
    {
        return $this->transition($examination, ExaminationStatus::RegistrationOpen->value);
    }

    /**
     * Close registration for an examination.
     */
    public function closeRegistration(Examination $examination): Examination
    {
        return $this->transition($examination, ExaminationStatus::RegistrationClosed->value);
    }

    /**
     * Open marks entry for an examination.
     */
    public function openMarksEntry(Examination $examination): Examination
    {
        return $this->transition($examination, ExaminationStatus::MarksEntryOpen->value);
    }

    /**
     * Mark processed results as published.
     */
    public function publish(Examination $examination): Examination
    {
        if ($examination->status !== ExaminationStatus::Processed) {
            throw new \RuntimeException('Only processed examinations can be published.');
        }

        return $this->transition($examination, ExaminationStatus::Published->value);
    }

    /**
     * Revert published results back to processed.
     */
    public function unpublish(Examination $examination): Examination
    {
        if ($examination->status !== ExaminationStatus::Published) {
            throw new \RuntimeException('Only published examinations can be unpublished.');
        }

        return $this->transition($examination, ExaminationStatus::Processed->value);
    }
}
