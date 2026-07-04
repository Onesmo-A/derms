<?php

namespace App\Policies;

use App\Domains\Identity\Models\User;
use App\Domains\School\Models\School;

class SchoolPolicy
{
    /**
     * Super Administrator bypasses all checks.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('Super Administrator')) {
            return true;
        }
        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            'Regional Education Officer (REO)',
            'District Education Officer (DEO)',
            'District Academic Officer',
            'Head of School',
            'Academic Master/Mistress',
            'Subject Teacher',
        ]);
    }

    public function view(User $user, School $school): bool
    {
        return $this->withinScope($user, $school);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            'Regional Education Officer (REO)',
            'District Education Officer (DEO)',
        ]);
    }

    public function update(User $user, School $school): bool
    {
        return $this->withinScope($user, $school);
    }

    public function delete(User $user, School $school): bool
    {
        return $this->withinScope($user, $school);
    }

    protected function withinScope(User $user, School $school): bool
    {
        if ($user->hasRole('Regional Education Officer (REO)')) {
            return $user->region_id && $school->district?->region_id === $user->region_id;
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer'])) {
            return $user->district_id && $user->district_id === $school->district_id;
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher'])) {
            return $user->school_id && $user->school_id === $school->id;
        }

        return false;
    }
}
