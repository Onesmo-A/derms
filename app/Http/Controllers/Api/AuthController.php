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
    private const MAX_FAILED_ATTEMPTS = 5;

    /**
     * Authenticate user and issue Sanctum token.
     */
    public function login(LoginRequest $request, AuditLogger $auditLogger)
    {
        $user = User::where('email', $request->email)->first();

        // Unknown email
        if (! $user) {
            $auditLogger->log(
                action: 'auth.login.failed',
                description: 'Login failed: email not found.',
                newValues: ['email' => $request->email],
                request: $request,
                status: 'failed'
            );
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Account is locked
        if ($user->status === 'locked') {
            return response()->json([
                'message' => 'Your account has been locked due to too many failed login attempts. Please contact the administrator.'
            ], 403);
        }

        // Account is suspended / inactive
        if (in_array($user->status, ['suspended', 'inactive', 'archived'])) {
            return response()->json([
                'message' => 'Your account is currently ' . $user->status . '. Please contact the administrator.'
            ], 403);
        }

        // Wrong password
        if (! Hash::check($request->password, $user->password)) {
            $attempts = $user->failed_login_attempts + 1;

            $updateData = ['failed_login_attempts' => $attempts];
            if ($attempts >= self::MAX_FAILED_ATTEMPTS) {
                $updateData['status'] = 'locked';
            }
            $user->update($updateData);

            $auditLogger->log(
                action: 'auth.login.failed',
                description: "Failed login attempt {$attempts} of " . self::MAX_FAILED_ATTEMPTS . '.',
                user: $user,
                newValues: ['attempts' => $attempts],
                request: $request,
                status: 'failed'
            );

            if ($attempts >= self::MAX_FAILED_ATTEMPTS) {
                return response()->json([
                    'message' => 'Account locked after ' . self::MAX_FAILED_ATTEMPTS . ' failed attempts. Contact your administrator.'
                ], 403);
            }

            $remaining = self::MAX_FAILED_ATTEMPTS - $attempts;
            throw ValidationException::withMessages([
                'email' => ["Invalid credentials. {$remaining} attempt(s) remaining before account lock."],
            ]);
        }

        // Success — reset counters and record last login
        $user->update([
            'failed_login_attempts' => 0,
            'last_login_at' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $roleName = $user->getRoleNames()->first() ?? 'Subject Teacher';
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();

        $auditLogger->log(
            action: 'auth.login.success',
            description: 'User logged in successfully.',
            user: $user,
            newValues: ['role' => $roleName],
            request: $request,
            status: 'success'
        );

        return response()->json([
            'token' => $token,
            'user'  => $this->formatUser($user, $roleName, $permissions),
            'message' => 'Login successful.',
        ]);
    }

    /**
     * Revoke the current authenticated user's token.
     */
    public function logout(Request $request, AuditLogger $auditLogger)
    {
        $request->user()->currentAccessToken()->delete();

        $auditLogger->log(
            action: 'auth.logout',
            description: 'User logged out.',
            user: $request->user(),
            request: $request
        );

        return response()->json(['message' => 'Successfully logged out.']);
    }

    /**
     * Fetch the authenticated user profile with roles and permissions.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $roleName = $user->getRoleNames()->first() ?? 'Subject Teacher';
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();

        return response()->json($this->formatUser($user, $roleName, $permissions));
    }

    /**
     * Format a user object for API responses.
     */
    private function formatUser(User $user, string $role, array $permissions): array
    {
        return [
            'id'                   => $user->id,
            'first_name'           => $user->first_name,
            'middle_name'          => $user->middle_name,
            'last_name'            => $user->last_name,
            'name'                 => $user->name,
            'email'                => $user->email,
            'phone'                => $user->phone,
            'role'                 => $role,
            'permissions'          => $permissions,
            'region_id'            => $user->region_id,
            'district_id'          => $user->district_id,
            'school_id'            => $user->school_id,
            'status'               => $user->status,
            'force_password_change' => $user->force_password_change,
            'last_login_at'        => $user->last_login_at?->toIso8601String(),
        ];
    }
}
