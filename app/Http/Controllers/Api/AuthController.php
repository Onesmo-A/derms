<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\LoginRequest;
use App\Domains\Identity\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Authenticate user and issue Sanctum token.
     */
    public function login(LoginRequest $request, AuditLogger $auditLogger)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            $auditLogger->log(
                action: 'auth.login.failed',
                description: 'Failed login attempt.',
                newValues: ['email' => $request->email],
                request: $request
            );

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== 'active') {
            $auditLogger->log(
                action: 'auth.login.blocked',
                description: 'Login blocked because the account is not active.',
                user: $user,
                newValues: ['status' => $user->status],
                request: $request
            );

            return response()->json([
                'message' => 'Your account is currently ' . $user->status . '.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Fetch user's role and list of permissions
        $roleName = $user->getRoleNames()->first() ?? 'Teacher'; // Default fallback role
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();

        $auditLogger->log(
            action: 'auth.login.success',
            description: 'User logged in successfully.',
            user: $user,
            newValues: [
                'role' => $roleName,
                'permissions_count' => count($permissions),
            ],
            request: $request
        );

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $roleName,
                'permissions' => $permissions,
                'school_id' => $user->school_id,
                'district_id' => $user->district_id,
            ],
            'message' => 'Login successful.'
        ]);
    }

    /**
     * Revoke the current authenticated user's token.
     */
    public function logout(\Illuminate\Http\Request $request, AuditLogger $auditLogger)
    {
        // Revoke the token that was used to authenticate the request
        $request->user()->currentAccessToken()->delete();

        $auditLogger->log(
            action: 'auth.logout',
            description: 'User logged out.',
            user: $request->user(),
            request: $request
        );

        return response()->json([
            'message' => 'Successfully logged out.'
        ]);
    }

    /**
     * Fetch the authenticated user profile with roles and permissions.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $roleName = $user->getRoleNames()->first() ?? 'Teacher';
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $roleName,
            'permissions' => $permissions,
            'school_id' => $user->school_id,
            'district_id' => $user->district_id,
        ]);
    }
}
