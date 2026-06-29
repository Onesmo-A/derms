<?php

namespace App\Services;

use App\Domains\Identity\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogger
{
    public function log(
        string $action,
        string $description,
        ?User $user = null,
        array $oldValues = [],
        array $newValues = [],
        ?Request $request = null
    ): AuditLog {
        $actor = $user ?? auth()->user();

        return AuditLog::create([
            'user_id' => $actor?->id,
            'action' => $action,
            'description' => $description,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'old_values' => $oldValues ?: null,
            'new_values' => $newValues ?: null,
            'created_at' => now(),
        ]);
    }
}
