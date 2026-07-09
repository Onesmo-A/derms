<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Return all roles with their permission mappings.
     */
    public function index(Request $request)
    {
        abort_unless($request->user()?->can('manage_roles'), 403);

        $roles = Role::with('permissions')
            ->orderBy('name')
            ->get()
            ->map(fn ($role) => [
                'id'          => $role->id,
                'name'        => $role->name,
                'permissions' => $role->permissions->pluck('name')->sort()->values(),
            ]);

        return response()->json($roles);
    }

    /**
     * Return all available permissions, grouped by category.
     */
    public function permissions(Request $request)
    {
        abort_unless($request->user()?->can('manage_permissions'), 403);

        $permissions = Permission::orderBy('name')->get()->pluck('name');

        // Group by prefix
        $grouped = $permissions->groupBy(function ($name) {
            $parts = explode('_', $name, 2);
            return match ($parts[0]) {
                'manage', 'create', 'edit', 'delete', 'view' => match (true) {
                    str_contains($name, 'user')        => 'User Management',
                    str_contains($name, 'region')      => 'Regions',
                    str_contains($name, 'district')    => 'Districts',
                    str_contains($name, 'school')      => 'Schools',
                    str_contains($name, 'student')     => 'Students',
                    str_contains($name, 'examination') => 'Examinations',
                    str_contains($name, 'report')      => 'Reports',
                    default                            => 'General',
                },
                'register', 'approve', 'bulk'   => 'Candidates / Students',
                'enter', 'import', 'verify'     => 'Marks',
                'process', 'publish', 'reprocess', 'unpublish' => 'Results',
                'generate', 'download', 'print' => 'Reports',
                'view'                          => 'Reporting',
                'send', 'run', 'export'         => 'AI / SMS',
                'backup', 'restore'             => 'Security',
                default                         => 'System',
            };
        });

        return response()->json($grouped);
    }

    /**
     * Return the permission-to-role mapping summary for display in the console.
     */
    public function hierarchy(Request $request)
    {
        abort_unless($request->user()?->can('manage_roles'), 403);

        $hierarchy = [
            'Super Administrator' => [
                'scope'       => 'Entire System',
                'color'       => 'red',
                'description' => 'Full unrestricted access to all modules, accounts, data, and configurations.',
            ],
            'Regional Education Officer (REO)' => [
                'scope'       => 'One Region',
                'color'       => 'blue',
                'description' => 'Manages all districts and schools within an assigned region.',
            ],
            'District Education Officer (DEO)' => [
                'scope'       => 'One District',
                'color'       => 'indigo',
                'description' => 'Manages all schools, teachers, and examinations within an assigned district.',
            ],
            'District Academic Officer' => [
                'scope'       => 'One District',
                'color'       => 'violet',
                'description' => 'Supports academic operations and examination processes within a district.',
            ],
            'Head of School' => [
                'scope'       => 'One School',
                'color'       => 'emerald',
                'description' => 'Manages students, teachers, and results for a single school.',
            ],
            'Academic Master/Mistress' => [
                'scope'       => 'One School',
                'color'       => 'teal',
                'description' => 'Coordinates academic activities and mark moderation within a school.',
            ],
            'Subject Teacher' => [
                'scope'       => 'Assigned Subjects',
                'color'       => 'cyan',
                'description' => 'Enters and manages marks for assigned subjects only.',
            ],
            'Student' => [
                'scope'       => 'Own Results',
                'color'       => 'yellow',
                'description' => 'Can view own result slips and examination history.',
            ],
            'Parent' => [
                'scope'       => 'Child Results Only',
                'color'       => 'orange',
                'description' => 'Can view results and receive SMS notifications for their child.',
            ],
        ];

        $roles = Role::with('permissions')->orderBy('name')->get();

        $result = collect($hierarchy)->map(function ($meta, $roleName) use ($roles) {
            $role = $roles->firstWhere('name', $roleName);
            return [
                'name'        => $roleName,
                'scope'       => $meta['scope'],
                'color'       => $meta['color'],
                'description' => $meta['description'],
                'permissions' => $role?->permissions->pluck('name')->sort()->values() ?? [],
                'users_count' => \App\Domains\Identity\Models\User::role($roleName)->count(),
            ];
        })->values();

        return response()->json($result);
    }
}
