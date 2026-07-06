<?php

namespace App\Services;

use App\Domains\Identity\Models\User;

class AccessScopeService
{
    public function applyRegionScope($query, User $user): void
    {
        if ($user->hasRole('Super Administrator')) {
            return;
        }

        if ($user->hasRole('Regional Education Officer (REO)') && $user->region_id) {
            $query->where('id', $user->region_id);
            return;
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer', 'Head of School', 'Academic Master/Mistress', 'Subject Teacher'])) {
            if ($user->district_id) {
                $query->whereHas('districts', fn ($q) => $q->where('id', $user->district_id));
                return;
            }

            if ($user->school_id) {
                $query->whereHas('districts.schools', fn ($q) => $q->where('id', $user->school_id));
                return;
            }
        }

        $query->whereRaw('1 = 0');
    }

    public function applyUserScope($query, User $user): void
    {
        if ($user->hasRole('Super Administrator')) {
            return;
        }

        if ($user->hasRole('Regional Education Officer (REO)') && $user->region_id) {
            $query->where('region_id', $user->region_id);
            return;
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer']) && $user->district_id) {
            $query->where('district_id', $user->district_id);
            return;
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher']) && $user->school_id) {
            $query->where('school_id', $user->school_id);
            return;
        }

        $query->whereRaw('1 = 0');
    }

    public function applySchoolScope($query, User $user): void
    {
        if ($user->hasRole('Super Administrator')) {
            return;
        }

        if ($user->hasRole('Regional Education Officer (REO)') && $user->region_id) {
            $query->whereHas('district', fn ($q) => $q->where('region_id', $user->region_id));
            return;
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer']) && $user->district_id) {
            $query->where('district_id', $user->district_id);
            return;
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher']) && $user->school_id) {
            $query->where('id', $user->school_id);
            return;
        }

        $query->whereRaw('1 = 0');
    }

    public function applyDistrictScope($query, User $user): void
    {
        if ($user->hasRole('Super Administrator')) {
            return;
        }

        if ($user->hasRole('Regional Education Officer (REO)') && $user->region_id) {
            $query->where('region_id', $user->region_id);
            return;
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer']) && $user->district_id) {
            $query->where('id', $user->district_id);
            return;
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher']) && $user->district_id) {
            $query->where('id', $user->district_id);
            return;
        }

        $query->whereRaw('1 = 0');
    }

    public function applyStudentScope($query, User $user): void
    {
        if ($user->hasRole('Super Administrator')) {
            return;
        }

        if ($user->hasRole('Regional Education Officer (REO)') && $user->region_id) {
            $query->whereHas('school.district', fn ($q) => $q->where('region_id', $user->region_id));
            return;
        }

        if ($user->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer']) && $user->district_id) {
            $query->whereHas('school', fn ($q) => $q->where('district_id', $user->district_id));
            return;
        }

        if ($user->hasAnyRole(['Head of School', 'Academic Master/Mistress', 'Subject Teacher']) && $user->school_id) {
            $query->where('school_id', $user->school_id);
            return;
        }

        $query->whereRaw('1 = 0');
    }

    public function canManageUser(User $actor, User $target): bool
    {
        if ($actor->hasRole('Super Administrator')) {
            return true;
        }

        if ($actor->hasRole('Regional Education Officer (REO)')) {
            return $actor->region_id && $target->region_id === $actor->region_id;
        }

        if ($actor->hasAnyRole(['District Education Officer (DEO)', 'District Academic Officer'])) {
            return $actor->district_id && $target->district_id === $actor->district_id;
        }

        if ($actor->hasRole('Head of School')) {
            return $actor->school_id && $target->school_id === $actor->school_id;
        }

        return false;
    }
}
