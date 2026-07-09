<?php

namespace App\Http\Controllers\Api;

use App\Domains\Identity\Models\User;
use App\Domains\Identity\Services\UserManagementService;
use App\Http\Controllers\Controller;
use App\Services\AccessScopeService;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        private UserManagementService $users,
        private AccessScopeService $scopes,
    ) {}

    public function index(Request $request)
    {
        $actor = $request->user();
        abort_unless($actor->can('view_users'), 403);
        $perPage = $request->input('per_page', 25);

        return response()->json(
            $this->users->buildIndexQuery($request->all(), $actor)->paginate($perPage)
        );
    }

    public function store(Request $request, AuditLogger $auditLogger)
    {
        $actor = $request->user();
        abort_unless($actor->can('create_user'), 403);

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'role' => 'required|string|exists:roles,name',
            'region_id' => 'nullable|uuid|exists:regions,id',
            'district_id' => 'nullable|uuid|exists:districts,id',
            'school_id' => 'nullable|uuid|exists:schools,id',
            'status' => 'in:active,pending,inactive',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $user = $this->users->createUser($validated, $actor);

        $auditLogger->log(
            action: 'user.created',
            description: "Created user account: {$user->email}",
            user: $actor,
            newValues: ['email' => $user->email, 'role' => $validated['role']],
            request: $request
        );

        return response()->json([
            'user' => $user,
            'message' => 'User account created successfully.',
        ], 201);
    }

    public function show(string $id)
    {
        $actor = request()->user();
        abort_unless($actor->can('view_users'), 403);

        $user = User::with(['roles', 'permissions', 'region', 'district', 'school', 'creator'])->findOrFail($id);
        abort_unless($this->scopes->canManageUser($actor, $user) || $actor->id === $user->id, 403);

        return response()->json($user);
    }

    public function update(Request $request, string $id, AuditLogger $auditLogger)
    {
        $actor = $request->user();
        abort_unless($actor->can('edit_user'), 403);
        $user = User::findOrFail($id);
        abort_unless($this->scopes->canManageUser($actor, $user) || $actor->id === $user->id, 403);

        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'email' => "sometimes|required|email|unique:users,email,{$id}",
            'phone' => 'nullable|string|max:20',
            'region_id' => 'nullable|uuid|exists:regions,id',
            'district_id' => 'nullable|uuid|exists:districts,id',
            'school_id' => 'nullable|uuid|exists:schools,id',
            'role' => 'sometimes|required|string|exists:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $old = $user->toArray();
        $user = $this->users->updateUser($user, $validated);

        $auditLogger->log(
            action: 'user.updated',
            description: "Updated user account: {$user->email}",
            user: $actor,
            oldValues: $old,
            newValues: $user->fresh()->toArray(),
            request: $request
        );

        return response()->json([
            'user' => $user,
            'message' => 'User account updated successfully.',
        ]);
    }

    public function changeStatus(Request $request, string $id, AuditLogger $auditLogger)
    {
        $actor = $request->user();
        abort_unless($actor->can('manage_users'), 403);
        $user = User::findOrFail($id);
        abort_unless($this->scopes->canManageUser($actor, $user), 403);

        $validated = $request->validate([
            'status' => 'required|in:active,inactive,locked,suspended,archived,pending',
        ]);

        if ($user->hasRole('Super Administrator') && ! $actor->hasRole('Super Administrator')) {
            return response()->json(['message' => 'Insufficient privileges.'], 403);
        }

        $old = $user->status;
        $user = $this->users->changeStatus($user, $validated['status']);

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

    public function resetPassword(Request $request, string $id, AuditLogger $auditLogger)
    {
        $actor = $request->user();
        abort_unless($actor->can('reset_password'), 403);
        $user = User::findOrFail($id);
        abort_unless($this->scopes->canManageUser($actor, $user) || $actor->id === $user->id, 403);

        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $this->users->resetPassword($user, $validated['password']);

        $auditLogger->log(
            action: 'user.password_reset',
            description: "Password reset for user: {$user->email}",
            user: $actor,
            request: $request
        );

        return response()->json(['message' => 'Password reset successfully. User will be required to change it on next login.']);
    }

    public function forcePasswordChange(string $id, AuditLogger $auditLogger)
    {
        $actor = auth()->user();
        abort_unless($actor?->can('reset_password'), 403);
        $user = User::findOrFail($id);
        abort_unless($this->scopes->canManageUser($actor, $user), 403);

        $this->users->forcePasswordChange($user);

        $auditLogger->log(
            action: 'user.force_password_change',
            description: "Force password change set for: {$user->email}",
            user: $actor
        );

        return response()->json(['message' => 'User will be required to change their password on next login.']);
    }

    public function destroy(string $id, AuditLogger $auditLogger)
    {
        $actor = auth()->user();
        abort_unless($actor->can('delete_user'), 403);
        $user = User::findOrFail($id);
        abort_unless($this->scopes->canManageUser($actor, $user), 403);

        if ($user->hasRole('Super Administrator')) {
            return response()->json(['message' => 'Super Administrator accounts cannot be deleted.'], 403);
        }

        $oldValues = $user->toArray();
        $this->users->archive($user);

        $auditLogger->log(
            action: 'user.archived',
            description: "User account archived: {$user->email}",
            user: $actor,
            oldValues: $oldValues
        );

        return response()->json(['message' => 'User account archived successfully.']);
    }

    public function formData(Request $request)
    {
        abort_unless($request->user()->can('create_user') || $request->user()->can('edit_user') || $request->user()->can('manage_users'), 403);
        return response()->json($this->users->formData($request->user()));
    }
}
