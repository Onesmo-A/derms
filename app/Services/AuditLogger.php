<?php

namespace App\Services;

use App\Domains\Identity\Models\User;
use App\Domains\Identity\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogger
{
    /**
     * Log a user activity / audit event.
     */
    public function log(
        string $action,
        string $description,
        ?User $user = null,
        array $oldValues = [],
        array $newValues = [],
        ?Request $request = null,
        string $module = '',
        string $status = 'success'
    ): AuditLog {
        $actor = $user ?? auth()->user();

        [$browser, $device] = $this->parseUserAgent($request?->userAgent());

        return AuditLog::create([
            'user_id'    => $actor?->id,
            'module'     => $module ?: $this->guessModule($action),
            'action'     => $action,
            'description' => $description,
            'status'     => $status,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'browser'    => $browser,
            'device'     => $device,
            'old_values' => $oldValues ?: null,
            'new_values' => $newValues ?: null,
            'created_at' => now(),
        ]);
    }

    /**
     * Extract browser name and device type from a User-Agent string.
     *
     * @return array{string, string} [browser, device]
     */
    protected function parseUserAgent(?string $ua): array
    {
        if (!$ua) {
            return ['Unknown', 'Unknown'];
        }

        // Browser detection (simple, no library needed)
        $browser = 'Other';
        if (str_contains($ua, 'Edg/'))       $browser = 'Microsoft Edge';
        elseif (str_contains($ua, 'Chrome'))  $browser = 'Chrome';
        elseif (str_contains($ua, 'Firefox')) $browser = 'Firefox';
        elseif (str_contains($ua, 'Safari') && !str_contains($ua, 'Chrome')) $browser = 'Safari';
        elseif (str_contains($ua, 'MSIE') || str_contains($ua, 'Trident')) $browser = 'Internet Explorer';

        // Device/platform detection
        $device = 'Desktop';
        if (str_contains($ua, 'Mobile'))  $device = 'Mobile';
        elseif (str_contains($ua, 'Tablet') || str_contains($ua, 'iPad')) $device = 'Tablet';

        return [$browser, $device];
    }

    /**
     * Guess the module from the action string (e.g. "auth.login" → "Authentication").
     */
    protected function guessModule(string $action): string
    {
        $prefix = explode('.', $action)[0] ?? '';
        return match ($prefix) {
            'auth'     => 'Authentication',
            'user'     => 'Users',
            'school'   => 'Schools',
            'district' => 'Districts',
            'region'   => 'Regions',
            'student'  => 'Students',
            'exam'     => 'Examinations',
            'marks'    => 'Marks',
            'results'  => 'Results',
            'report'   => 'Reports',
            'sms'      => 'Notifications',
            default    => 'System',
        };
    }
}
