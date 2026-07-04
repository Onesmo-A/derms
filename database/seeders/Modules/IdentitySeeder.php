<?php

namespace Database\Seeders\Modules;

use App\Domains\Identity\Models\User;
use App\Domains\School\Models\District;
use App\Domains\School\Models\Region;
use App\Domains\School\Models\School;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class IdentitySeeder extends Seeder
{
    public function run(): void
    {
        // ─────────────────────────────────────────────────────────────
        // 1. GRANULAR PERMISSIONS
        // ─────────────────────────────────────────────────────────────
        $permissionGroups = [
            // User Management
            'manage_users', 'create_user', 'edit_user', 'delete_user', 'view_users',
            'reset_password', 'lock_account', 'unlock_account', 'assign_roles', 'assign_permissions',

            // Regions
            'manage_regions', 'create_region', 'edit_region', 'delete_region', 'view_regions',

            // Districts
            'manage_districts', 'create_district', 'edit_district', 'delete_district', 'view_districts',

            // Schools
            'manage_schools', 'create_school', 'edit_school', 'delete_school', 'view_schools',

            // Students
            'manage_students', 'register_students', 'edit_students', 'transfer_students',
            'bulk_import_students', 'view_students',

            // Examinations
            'manage_examinations', 'create_examination', 'edit_examination', 'delete_examination',
            'approve_examination', 'archive_examination',

            // Candidates
            'register_candidates', 'approve_candidates', 'view_candidates',

            // Marks
            'enter_marks', 'edit_marks', 'import_marks', 'verify_marks', 'approve_marks',

            // Results
            'process_results', 'reprocess_results', 'approve_results', 'publish_results', 'unpublish_results',

            // Reports
            'view_reports', 'generate_reports', 'download_reports', 'print_reports',

            // AI
            'view_ai_dashboard', 'run_ai_analysis', 'export_ai_reports',

            // SMS / Notifications
            'send_sms', 'manage_sms', 'view_sms_logs',

            // Security / System
            'view_audit_logs', 'manage_roles', 'manage_permissions', 'manage_settings',
            'backup_system', 'restore_system',
        ];

        foreach ($permissionGroups as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // ─────────────────────────────────────────────────────────────
        // 2. HIERARCHICAL ROLES + PERMISSION MAPPING
        // ─────────────────────────────────────────────────────────────
        $roles = [
            'Super Administrator' => $permissionGroups, // all permissions

            'Regional Education Officer (REO)' => [
                'view_regions', 'view_districts', 'view_schools',
                'manage_districts', 'create_district', 'edit_district', 'view_districts',
                'manage_schools', 'create_school', 'edit_school', 'view_schools',
                'manage_users', 'create_user', 'edit_user', 'view_users', 'reset_password',
                'lock_account', 'unlock_account', 'assign_roles',
                'view_students', 'view_candidates',
                'view_reports', 'generate_reports', 'download_reports', 'print_reports',
                'view_ai_dashboard', 'run_ai_analysis', 'export_ai_reports',
                'view_audit_logs',
                'approve_examination', 'view_candidates', 'approve_results',
                'send_sms', 'view_sms_logs',
            ],

            'District Education Officer (DEO)' => [
                'view_districts', 'view_schools',
                'manage_schools', 'create_school', 'edit_school', 'view_schools',
                'manage_users', 'create_user', 'edit_user', 'view_users', 'reset_password',
                'lock_account', 'unlock_account', 'assign_roles',
                'manage_students', 'register_students', 'edit_students', 'transfer_students',
                'bulk_import_students', 'view_students',
                'manage_examinations', 'create_examination', 'edit_examination', 'approve_examination',
                'register_candidates', 'approve_candidates', 'view_candidates',
                'process_results', 'reprocess_results', 'approve_results', 'publish_results', 'unpublish_results',
                'view_reports', 'generate_reports', 'download_reports', 'print_reports',
                'view_ai_dashboard', 'run_ai_analysis',
                'send_sms', 'view_sms_logs',
                'view_audit_logs',
            ],

            'District Academic Officer' => [
                'view_districts', 'view_schools',
                'view_students', 'view_candidates',
                'manage_examinations', 'create_examination', 'edit_examination',
                'register_candidates', 'view_candidates',
                'verify_marks', 'approve_marks', 'import_marks',
                'process_results', 'approve_results',
                'view_reports', 'generate_reports', 'download_reports',
                'view_ai_dashboard',
            ],

            'Head of School' => [
                'view_schools',
                'manage_students', 'register_students', 'edit_students', 'bulk_import_students', 'view_students',
                'register_candidates', 'view_candidates',
                'manage_users', 'create_user', 'view_users',
                'enter_marks', 'edit_marks', 'import_marks', 'verify_marks',
                'view_reports', 'generate_reports', 'download_reports', 'print_reports',
                'send_sms', 'view_sms_logs',
            ],

            'Academic Master/Mistress' => [
                'view_schools',
                'view_students', 'view_candidates',
                'enter_marks', 'edit_marks', 'import_marks', 'verify_marks',
                'view_reports', 'generate_reports', 'download_reports',
            ],

            'Subject Teacher' => [
                'view_students',
                'enter_marks', 'edit_marks',
                'view_reports',
            ],

            'Student' => [
                'view_reports',
            ],

            'Parent' => [
                'view_reports',
            ],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($rolePermissions);
        }

        // ─────────────────────────────────────────────────────────────
        // 3. SEED REPRESENTATIVE SCOPED USERS
        // ─────────────────────────────────────────────────────────────
        $dar = Region::where('code', 'DSM')->first() ?? Region::first();
        $kinondoni = District::where('code', 'KIN')->first() ?? District::first();
        $kinondoniSec = School::where('registration_number', 'S0101')->first() ?? School::first();

        $defaultPassword = Hash::make('password');

        // 1. Super Administrator
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@derms.go.tz'],
            [
                'id'         => (string) Str::uuid(),
                'first_name' => 'System',
                'last_name'  => 'Administrator',
                'phone'      => '+255700000000',
                'password'   => $defaultPassword,
                'status'     => 'active',
            ]
        );
        $superAdmin->syncRoles(['Super Administrator']);

        // 2. Regional Education Officer (REO)
        if ($dar) {
            $reo = User::firstOrCreate(
                ['email' => 'reo.dar@derms.go.tz'],
                [
                    'id'         => (string) Str::uuid(),
                    'first_name' => 'Regional Officer',
                    'last_name'  => 'Dar es Salaam',
                    'phone'      => '+255700000001',
                    'password'   => $defaultPassword,
                    'status'     => 'active',
                    'region_id'  => $dar->id,
                ]
            );
            $reo->syncRoles(['Regional Education Officer (REO)']);
        }

        // 3. District Education Officer (DEO)
        if ($kinondoni) {
            $deo = User::firstOrCreate(
                ['email' => 'deo.kinondoni@derms.go.tz'],
                [
                    'id'          => (string) Str::uuid(),
                    'first_name'  => 'District Officer',
                    'last_name'   => 'Kinondoni',
                    'phone'       => '+255700000002',
                    'password'    => $defaultPassword,
                    'status'      => 'active',
                    'region_id'   => $kinondoni->region_id,
                    'district_id' => $kinondoni->id,
                ]
            );
            $deo->syncRoles(['District Education Officer (DEO)']);
        }

        // 4. District Academic Officer
        if ($kinondoni) {
            $dao = User::firstOrCreate(
                ['email' => 'academic.kinondoni@derms.go.tz'],
                [
                    'id'          => (string) Str::uuid(),
                    'first_name'  => 'District Academic',
                    'last_name'   => 'Officer',
                    'phone'       => '+255700000003',
                    'password'    => $defaultPassword,
                    'status'      => 'active',
                    'region_id'   => $kinondoni->region_id,
                    'district_id' => $kinondoni->id,
                ]
            );
            $dao->syncRoles(['District Academic Officer']);
        }

        // 5. Head of School
        if ($kinondoniSec) {
            $hos = User::firstOrCreate(
                ['email' => 'head.kinondoni@derms.go.tz'],
                [
                    'id'          => (string) Str::uuid(),
                    'first_name'  => 'Head of School',
                    'last_name'   => 'Kinondoni Sec',
                    'phone'       => '+255700000004',
                    'password'    => $defaultPassword,
                    'status'      => 'active',
                    'region_id'   => $kinondoniSec->district?->region_id,
                    'district_id' => $kinondoniSec->district_id,
                    'school_id'   => $kinondoniSec->id,
                ]
            );
            $hos->syncRoles(['Head of School']);
        }

        // 6. Academic Master/Mistress
        if ($kinondoniSec) {
            $academicMaster = User::firstOrCreate(
                ['email' => 'academic.school@derms.go.tz'],
                [
                    'id'          => (string) Str::uuid(),
                    'first_name'  => 'Academic Master',
                    'last_name'   => 'Kinondoni Sec',
                    'phone'       => '+255700000005',
                    'password'    => $defaultPassword,
                    'status'      => 'active',
                    'region_id'   => $kinondoniSec->district?->region_id,
                    'district_id' => $kinondoniSec->district_id,
                    'school_id'   => $kinondoniSec->id,
                ]
            );
            $academicMaster->syncRoles(['Academic Master/Mistress']);
        }

        // 7. Subject Teacher
        if ($kinondoniSec) {
            $teacher = User::firstOrCreate(
                ['email' => 'teacher.math@derms.go.tz'],
                [
                    'id'          => (string) Str::uuid(),
                    'first_name'  => 'Mathematics',
                    'last_name'   => 'Teacher',
                    'phone'       => '+255700000006',
                    'password'    => $defaultPassword,
                    'status'      => 'active',
                    'region_id'   => $kinondoniSec->district?->region_id,
                    'district_id' => $kinondoniSec->district_id,
                    'school_id'   => $kinondoniSec->id,
                ]
            );
            $teacher->syncRoles(['Subject Teacher']);
        }

        // 8. Student
        if ($kinondoniSec) {
            $studentUser = User::firstOrCreate(
                ['email' => 'student.jane@derms.go.tz'],
                [
                    'id'          => (string) Str::uuid(),
                    'first_name'  => 'Jane',
                    'last_name'   => 'Doe',
                    'phone'       => '+255700000007',
                    'password'    => $defaultPassword,
                    'status'      => 'active',
                    'region_id'   => $kinondoniSec->district?->region_id,
                    'district_id' => $kinondoniSec->district_id,
                    'school_id'   => $kinondoniSec->id,
                ]
            );
            $studentUser->syncRoles(['Student']);
        }

        // 9. Parent
        $parentUser = User::firstOrCreate(
            ['email' => 'parent.jane@derms.go.tz'],
            [
                'id'         => (string) Str::uuid(),
                'first_name' => 'Richard',
                'last_name'  => 'Doe',
                'phone'      => '+255700000008',
                'password'   => $defaultPassword,
                'status'     => 'active',
            ]
        );
        $parentUser->syncRoles(['Parent']);
    }
}
