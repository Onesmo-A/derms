<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HasAccessScoping;
use App\Domains\Identity\Models\User;
use App\Domains\School\Models\District;
use App\Domains\School\Models\Region;
use App\Domains\School\Models\School;
use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    use HasAccessScoping;

    /**
     * List users scoped to the authenticated user's organizational level.
     */
    public function index(Request $request)
    {
        $actor = $request->user();

        $query = User::with(['roles', 'permissions', 'region', 'district', 'school'])
            ->select('users.*');

        // Apply role-based scoping
        $this->applyUserScope($query, $actor);

        // Filters
        if ($request->filled('region_id')) {
            $query->where('region_id', $request->region_id);
        }
        if ($request->filled('district_id')) {
            $query->where('district_id', $request->district_id);
        }
        if ($request->filled('school_id')) {
            $query->where('school_id', $request->school_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('role')) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $request->role));
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q
                ->where('first_name', 'ilike', "%{$search}%")
                ->orWhere('last_name', 'ilike', "%{$search}%")
                ->orWhere('email', 'ilike', "%{$search}%")
            );
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 25);

        return response()->json($users);
    }

    /**
     * Create a new user account.
     */
    public function store(Request $request, AuditLogger $auditLogger)
    {
        $actor = $request->user();

        $validated = $request->validate([
            'first_name'    => 'required|string|max:100',
            'middle_name'   => 'nullable|string|max:100',
            'last_name'     => 'required|string|max:100',
            'email'         => 'required|email|unique:users,email',
            'phone'         => 'nullable|string|max:20',
            'password'      => 'required|string|min:8',
            'role'          => 'required|string|exists:roles,name',
            'region_id'     => 'nullable|uuid|exists:regions,id',
            'district_id'   => 'nullable|uuid|exists:districts,id',
            'school_id'     => 'nullable|uuid|exists:schools,id',
            'status'        => 'in:active,pending,inactive',
            'permissions'   => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $user = User::create([
            ...collect($validated)->except(['role', 'permissions'])->toArray(),
            'id'         => (string) Str::uuid(),
            'password'   => Hash::make($validated['password']),
            'status'     => $validated['status'] ?? 'active',
            'created_by' => $actor->id,
            'force_password_change' => true,
        ]);

        $user->assignRole($validated['role']);

        if (!empty($validated['permissions'])) {
            $user->syncPermissions($validated['permissions']);
        }

        $auditLogger->log(
            action: 'user.created',
            description: "Created user account: {$user->email}",
            user: $actor,
            newValues: ['email' => $user->email, 'role' => $validated['role']],
            request: $request
        );

        return response()->json([
            'user'    => $user->load(['roles', 'permissions', 'region', 'district', 'school']),
            'message' => 'User account created successfully.',
        ], 201);
    }

    /**
     * Show a single user with full details.
     */
    public function show(string $id)
    {
        $user = User::with(['roles', 'permissions', 'region', 'district', 'school', 'creator'])->findOrFail($id);
        return response()->json($user);
    }

    /**
     * Update user details.
     */
    public function update(Request $request, string $id, AuditLogger $auditLogger)
    {
        $actor = $request->user();
        $user  = User::findOrFail($id);

        $validated = $request->validate([
            'first_name'    => 'sometimes|required|string|max:100',
            'middle_name'   => 'nullable|string|max:100',
            'last_name'     => 'sometimes|required|string|max:100',
            'email'         => "sometimes|required|email|unique:users,email,{$id}",
            'phone'         => 'nullable|string|max:20',
            'region_id'     => 'nullable|uuid|exists:regions,id',
            'district_id'   => 'nullable|uuid|exists:districts,id',
            'school_id'     => 'nullable|uuid|exists:schools,id',
            'role'          => 'sometimes|required|string|exists:roles,name',
            'permissions'   => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $old = $user->toArray();
        $user->update(collect($validated)->except(['role', 'permissions'])->toArray());

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        if ($request->has('permissions')) {
            $user->syncPermissions($validated['permissions'] ?? []);
        }

        $auditLogger->log(
            action: 'user.updated',
            description: "Updated user account: {$user->email}",
            user: $actor,
            oldValues: $old,
            newValues: $user->fresh()->toArray(),
            request: $request
        );

        return response()->json([
            'user'    => $user->load(['roles', 'permissions', 'region', 'district', 'school']),
            'message' => 'User account updated successfully.',
        ]);
    }

    /**
     * Change user status (lock, unlock, suspend, activate, archive, deactivate).
     */
    public function changeStatus(Request $request, string $id, AuditLogger $auditLogger)
    {
        $actor  = $request->user();
        $user   = User::findOrFail($id);
        $validated = $request->validate([
            'status' => 'required|in:active,inactive,locked,suspended,archived,pending',
        ]);

        // Super Admin can only be managed by another Super Admin
        if ($user->hasRole('Super Administrator') && !$actor->hasRole('Super Administrator')) {
            return response()->json(['message' => 'Insufficient privileges.'], 403);
        }

        $old = $user->status;
        $user->update([
            'status' => $validated['status'],
            'failed_login_attempts' => $validated['status'] === 'active' ? 0 : $user->failed_login_attempts,
        ]);

        $auditLogger->log(
            action: 'user.status_changed',
            description: "User {$user->email} status changed from {$old} to {$validated['status']}.",
            user: $actor,
            oldValues: ['status' => $old],
            newValues: ['status' => $validated['status']],
            request: $request
        );

        return response()->json(['message' => "Account status updated to {$validated['status']}."]);
    }

    /**
     * Reset a user's password (sets a new password and forces change on next login).
     */
    public function resetPassword(Request $request, string $id, AuditLogger $auditLogger)
    {
        $actor = $request->user();
        $user  = User::findOrFail($id);

        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->update([
            'password'              => Hash::make($validated['password']),
            'force_password_change' => true,
            'failed_login_attempts' => 0,
            'status'                => $user->status === 'locked' ? 'active' : $user->status,
        ]);

        $auditLogger->log(
            action: 'user.password_reset',
            description: "Password reset for user: {$user->email}",
            user: $actor,
            request: $request
        );

        return response()->json(['message' => 'Password reset successfully. User will be required to change it on next login.']);
    }

    /**
     * Force password change on next login without setting a new password.
     */
    public function forcePasswordChange(string $id, AuditLogger $auditLogger)
    {
        $actor = auth()->user();
        $user  = User::findOrFail($id);

        $user->update(['force_password_change' => true]);

        $auditLogger->log(
            action: 'user.force_password_change',
            description: "Force password change set for: {$user->email}",
            user: $actor
        );

        return response()->json(['message' => 'User will be required to change their password on next login.']);
    }

    /**
     * Soft-delete a user.
     */
    public function destroy(string $id, AuditLogger $auditLogger)
    {
        $actor = auth()->user();
        $user  = User::findOrFail($id);

        if ($user->hasRole('Super Administrator')) {
            return response()->json(['message' => 'Super Administrator accounts cannot be deleted.'], 403);
        }

        $user->update(['status' => 'archived']);
        $user->delete();

        $auditLogger->log(
            action: 'user.archived',
            description: "User account archived: {$user->email}",
            user: $actor,
            oldValues: $user->toArray()
        );

        return response()->json(['message' => 'User account archived successfully.']);
    }

    /**
     * Return available scoping data (regions, districts, schools, roles) for user creation form.
     */
    public function formData(Request $request)
    {
        $actor = $request->user();

        // Super Admin sees all; others see their own scope
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

        $permissions = \Spatie\Permission\Models\Permission::orderBy('name')->pluck('name');

        return response()->json(compact('regions', 'districts', 'schools', 'roles', 'permissions'));
    }
}
