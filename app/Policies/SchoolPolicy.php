<?php

namespace App\Policies;

use App\Domains\Identity\Models\User;
use App\Domains\School\Models\School;

class SchoolPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            'Super Administrator',
            'District Officer',
            'School Administrator',
            'Teacher',
        ]);
    }

    public function view(User $user, School $school): bool
    {
        return $this->canManageDistrictScope($user, $school);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Super Administrator', 'District Officer']);
    }

    public function update(User $user, School $school): bool
    {
        return $this->canManageDistrictScope($user, $school);
    }

    public function delete(User $user, School $school): bool
    {
        return $user->hasRole('Super Administrator') || $this->canManageDistrictScope($user, $school);
    }

    protected function canManageDistrictScope(User $user, School $school): bool
    {
        if ($user->hasRole('Super Administrator')) {
            return true;
        }

        if ($user->hasRole('District Officer')) {
            return $user->district_id !== null && $user->district_id === $school->district_id;
        }

        if ($user->hasAnyRole(['School Administrator', 'Teacher'])) {
            return $user->school_id !== null && $user->school_id === $school->id;
        }

        return false;
    }
}
