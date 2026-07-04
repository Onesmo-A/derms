<?php

namespace App\Policies;

use App\Domains\Identity\Models\User;
use App\Domains\Student\Models\Student;

class StudentPolicy
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

    public function view(User $user, Student $student): bool
    {
        return $this->canAccessStudent($user, $student);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            'District Education Officer (DEO)',
            'Head of School',
            'Academic Master/Mistress',
        ]);
    }

    public function update(User $user, Student $student): bool
    {
        return $this->canAccessStudent($user, $student);
    }

    public function delete(User $user, Student $student): bool
    {
        return $user->hasAnyRole([
            'District Education Officer (DEO)',
            'Head of School',
        ]) && $this->canAccessStudent($user, $student);
    }

    protected function canAccessStudent(User $user, Student $student): bool
    {
        if ($user->hasRole('Regional Education Officer (REO)')) {
            return $user->region_id && $student->school?->district?->region_id === $user->region_id;
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer'])) {
            return $user->district_id && $student->school?->district_id === $user->district_id;
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher'])) {
            return $user->school_id && $student->school_id === $user->school_id;
        }

        return false;
    }
}
