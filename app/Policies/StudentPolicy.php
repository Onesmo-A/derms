<?php

namespace App\Policies;

use App\Domains\Identity\Models\User;
use App\Domains\Student\Models\Student;

class StudentPolicy
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

    public function view(User $user, Student $student): bool
    {
        return $this->canAccessStudent($user, $student);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            'Super Administrator',
            'District Officer',
            'School Administrator',
            'Teacher',
        ]);
    }

    public function update(User $user, Student $student): bool
    {
        return $this->canAccessStudent($user, $student);
    }

    public function delete(User $user, Student $student): bool
    {
        return $this->canAccessStudent($user, $student);
    }

    protected function canAccessStudent(User $user, Student $student): bool
    {
        if ($user->hasRole('Super Administrator')) {
            return true;
        }

        if ($user->hasRole('District Officer')) {
            return $user->district_id !== null && $student->school?->district_id === $user->district_id;
        }

        if ($user->hasAnyRole(['School Administrator', 'Teacher'])) {
            return $user->school_id !== null && $student->school_id === $user->school_id;
        }

        return false;
    }
}
