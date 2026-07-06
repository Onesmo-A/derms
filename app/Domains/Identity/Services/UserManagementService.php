<?php

namespace App\Domains\Identity\Services;

use App\Domains\Identity\Models\User;
use App\Domains\School\Models\District;
use App\Domains\School\Models\Region;
use App\Domains\School\Models\School;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserManagementService
{
    public function buildIndexQuery(array $filters, $actor): Builder
    {
        $query = User::with(['roles', 'permissions', 'region', 'district', 'school'])
            ->select('users.*');

        app(\App\Services\AccessScopeService::class)->applyUserScope($query, $actor);

        if (!empty($filters['region_id'])) {
            $query->where('region_id', $filters['region_id']);
        }
        if (!empty($filters['district_id'])) {
            $query->where('district_id', $filters['district_id']);
        }
        if (!empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['role'])) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $filters['role']));
        }
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(fn ($q) => $q
                ->where('first_name', 'ilike', "%{$search}%")
                ->orWhere('last_name', 'ilike', "%{$search}%")
                ->orWhere('email', 'ilike', "%{$search}%")
            );
        }

        return $query->orderBy('created_at', 'desc');
    }

    public function createUser(array $validated, $actor): User
    {
        $user = User::create([
            ...collect($validated)->except(['role', 'permissions'])->toArray(),
            'id' => (string) Str::uuid(),
            'password' => Hash::make($validated['password']),
            'status' => $validated['status'] ?? 'active',
            'created_by' => $actor->id,
            'force_password_change' => true,
        ]);

        $user->assignRole($validated['role']);

        if (!empty($validated['permissions'])) {
            $user->syncPermissions($validated['permissions']);
        }

        return $user->fresh(['roles', 'permissions', 'region', 'district', 'school']);
    }

    public function updateUser(User $user, array $validated): User
    {
        $user->update(collect($validated)->except(['role', 'permissions'])->toArray());

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        if (array_key_exists('permissions', $validated)) {
            $user->syncPermissions($validated['permissions'] ?? []);
        }

        return $user->fresh(['roles', 'permissions', 'region', 'district', 'school']);
    }

    public function changeStatus(User $user, string $status): User
    {
        $user->update([
            'status' => $status,
            'failed_login_attempts' => $status === 'active' ? 0 : $user->failed_login_attempts,
        ]);

        return $user->fresh();
    }

    public function resetPassword(User $user, string $password): User
    {
        $user->update([
            'password' => Hash::make($password),
            'force_password_change' => true,
            'failed_login_attempts' => 0,
            'status' => $user->status === 'locked' ? 'active' : $user->status,
        ]);

        return $user->fresh();
    }

    public function forcePasswordChange(User $user): User
    {
        $user->update(['force_password_change' => true]);

        return $user->fresh();
    }

    public function archive(User $user): void
    {
        $user->update(['status' => 'archived']);
        $user->delete();
    }

    public function formData($actor): array
    {
        $regions = $actor->hasRole('Super Administrator')
            ? Region::orderBy('name')->get(['id', 'name'])
            : Region::where('id', $actor->region_id)->get(['id', 'name']);

        $districts = $actor->hasRole('Super Administrator')
            ? District::with('region')->orderBy('name')->get(['id', 'name', 'region_id'])
            : District::where($actor->district_id ? 'id' : 'region_id', $actor->district_id ?? $actor->region_id)
                ->orderBy('name')->get(['id', 'name', 'region_id']);

        $schools = $actor->hasRole('Super Administrator')
            ? School::with('district')->orderBy('name')->get(['id', 'name', 'district_id'])
            : School::when($actor->school_id, fn ($q) => $q->where('id', $actor->school_id))
                ->when(!$actor->school_id && $actor->district_id, fn ($q) => $q->where('district_id', $actor->district_id))
                ->orderBy('name')->get(['id', 'name', 'district_id']);

        $roles = Role::orderBy('name')->get(['id', 'name']);
        $permissions = Permission::orderBy('name')->pluck('name');

        return compact('regions', 'districts', 'schools', 'roles', 'permissions');
    }
}
