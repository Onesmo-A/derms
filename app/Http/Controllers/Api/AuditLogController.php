<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Return a paginated, filterable list of audit log entries.
     */
    public function index(Request $request)
    {
        $query = AuditLog::with('user')
            ->orderBy('created_at', 'desc');

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('action')) {
            $query->where('action', 'ilike', "%{$request->action}%");
        }
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q
                ->where('description', 'ilike', "%{$search}%")
                ->orWhere('action', 'ilike', "%{$search}%")
                ->orWhereHas('user', fn ($uq) => $uq->where('email', 'ilike', "%{$search}%"))
            );
        }

        $perPage = min((int) ($request->per_page ?? 25), 100);
        $logs    = $query->paginate($perPage);

        // Format each log for the UI
        $logs->getCollection()->transform(fn ($log) => [
            'id'          => $log->id,
            'user'        => $log->user ? [
                'id'    => $log->user->id,
                'name'  => $log->user->name,
                'email' => $log->user->email,
            ] : null,
            'module'      => $log->module,
            'action'      => $log->action,
            'description' => $log->description,
            'status'      => $log->status,
            'ip_address'  => $log->ip_address,
            'browser'     => $log->browser,
            'device'      => $log->device,
            'old_values'  => $log->old_values,
            'new_values'  => $log->new_values,
            'created_at'  => $log->created_at?->toIso8601String(),
            'time_ago'    => $log->created_at?->diffForHumans(),
        ]);

        return response()->json($logs);
    }

    /**
     * Return a single log entry for the detail modal.
     */
    public function show(string $id)
    {
        $log = AuditLog::with('user')->findOrFail($id);

        return response()->json([
            'id'          => $log->id,
            'user'        => $log->user ? [
                'id'    => $log->user->id,
                'name'  => $log->user->name,
                'email' => $log->user->email,
                'role'  => $log->user->getRoleNames()->first(),
            ] : null,
            'module'      => $log->module,
            'action'      => $log->action,
            'description' => $log->description,
            'status'      => $log->status,
            'ip_address'  => $log->ip_address,
            'user_agent'  => $log->user_agent,
            'browser'     => $log->browser,
            'device'      => $log->device,
            'old_values'  => $log->old_values,
            'new_values'  => $log->new_values,
            'created_at'  => $log->created_at?->toIso8601String(),
            'time_ago'    => $log->created_at?->diffForHumans(),
        ]);
    }

    /**
     * Return live activity feed — last 20 entries across all modules.
     */
    public function live()
    {
        $logs = AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'user_email'  => $log->user?->email ?? 'system',
                'user_name'   => $log->user?->name ?? 'System',
                'module'      => $log->module,
                'action'      => $log->action,
                'description' => $log->description,
                'status'      => $log->status,
                'ip_address'  => $log->ip_address,
                'browser'     => $log->browser,
                'device'      => $log->device,
                'time_ago'    => $log->created_at?->diffForHumans(),
                'created_at'  => $log->created_at?->toIso8601String(),
            ]);

        return response()->json($logs);
    }

    /**
     * Return distinct module names for filter dropdowns.
     */
    public function modules()
    {
        $modules = AuditLog::distinct()->whereNotNull('module')->orderBy('module')->pluck('module');
        return response()->json($modules);
    }
}
