<?php

namespace App\Concerns;

use App\Domains\Identity\Models\User;

/**
 * Centralized RBAC + Scope-based query filtering.
 *
 * Apply this trait to any controller or service that needs to
 * filter database queries based on the authenticated user's role and
 * organizational scope (Region → District → School).
 */
trait HasAccessScoping
{
    /**
     * Apply organizational scope filter to a user query.
     * Super Admin → sees all. REO → own region. DEO/District Academic → own district. School+ → own school.
     */
    protected function applyUserScope($query, User $user): void
    {
        if ($user->hasRole('Super Administrator')) {
            return; // Unrestricted
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

        // Deny all for unknown roles
        $query->whereRaw('1 = 0');
    }

    /**
     * Apply scope filter to a schools query.
     */
    protected function applySchoolScope($query, User $user): void
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

    /**
     * Apply scope filter to a districts query.
     */
    protected function applyDistrictScope($query, User $user): void
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

    /**
     * Apply scope filter to a student query (school-based relationship).
     */
    protected function applyStudentScope($query, User $user): void
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

    /**
     * Check if the authenticated user can manage another user account.
     * A user can only create/edit users in their own or lower scope.
     */
    protected function canManageUser(User $actor, User $target): bool
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
