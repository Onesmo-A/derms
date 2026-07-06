<?php

namespace App\Policies;

use App\Domains\Examination\Models\Examination;
use App\Domains\Identity\Models\User;

class ExaminationPolicy
{
    /**
     * Determine whether the user can view examinations.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            'Super Administrator',
            'Regional Education Officer (REO)',
            'District Education Officer (DEO)',
            'District Academic Officer',
            'Head of School',
            'Academic Master/Mistress',
            'Subject Teacher',
        ]);
    }

    /**
     * Determine whether the user can view a specific examination.
     */
    public function view(User $user, Examination $examination): bool
    {
        return $this->manage($user, $examination);
    }

    /**
     * Determine whether the user can create examinations.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            'Super Administrator',
            'Regional Education Officer (REO)',
            'District Education Officer (DEO)',
            'District Academic Officer',
        ]);
    }

    /**
     * Determine whether the user can update examinations.
     */
    public function update(User $user, Examination $examination): bool
    {
        return $this->manage($user, $examination);
    }

    /**
     * Determine whether the user can configure subjects.
     */
    public function configureSubjects(User $user, Examination $examination): bool
    {
        return $this->manage($user, $examination);
    }

    /**
     * Determine whether the user can register candidates.
     */
    public function registerCandidates(User $user, Examination $examination): bool
    {
        return $this->manage($user, $examination);
    }

    /**
     * Determine whether the user can process results.
     */
    public function processResults(User $user, Examination $examination): bool
    {
        return $this->manage($user, $examination);
    }

    /**
     * Determine whether the user can enter or edit marks.
     */
    public function enterMarks(User $user, Examination $examination): bool
    {
        return $this->manage($user, $examination);
    }

    /**
     * Centralized management check.
     */
    protected function manage(User $user, Examination $examination): bool
    {
        if ($user->hasRole('Super Administrator')) {
            return true;
        }

        if ($user->hasAnyRole(['Regional Education Officer (REO)', 'District Education Officer (DEO)', 'District Academic Officer'])) {
            return $user->district_id !== null;
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher'])) {
            return $user->school_id !== null;
        }

        return false;
    }
}
