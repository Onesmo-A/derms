<?php

namespace App\Actions\Examination;

use App\Domains\Examination\Models\Examination;
use App\Enums\ExaminationStatus;
use RuntimeException;

class TransitionExaminationStatusAction
{
    /**
     * Transition an examination to a new lifecycle state.
     */
    public function handle(Examination $examination, string $targetStatus): Examination
    {
        $currentStatus = $examination->status instanceof ExaminationStatus
            ? $examination->status->value
            : (string) $examination->status;

        if ($currentStatus === $targetStatus) {
            return $examination;
        }

        if (! ExaminationStatus::canTransition($currentStatus, $targetStatus)) {
            throw new RuntimeException('Invalid examination status transition.');
        }

        $examination->update(['status' => $targetStatus]);

        return $examination->refresh();
    }
}
