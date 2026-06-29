<?php

namespace Database\Seeders\Modules;

use App\Domains\Identity\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class IdentitySeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'manage-schools',
            'manage-users',
            'manage-students',
            'manage-examinations',
            'enter-marks',
            'process-results',
            'view-reports',
            'send-notifications',
            'use-ai-analytics',
            'view-audit-logs',
        ];

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }

        $roles = [
            'Super Administrator' => $permissions,
            'District Officer' => [
                'manage-schools',
                'manage-users',
                'manage-students',
                'manage-examinations',
                'process-results',
                'view-reports',
                'send-notifications',
                'use-ai-analytics',
                'view-audit-logs',
            ],
            'School Administrator' => [
                'manage-students',
                'enter-marks',
                'view-reports',
            ],
            'Teacher' => [
                'enter-marks',
                'view-reports',
            ],
            'Student' => ['view-reports'],
            'Parent' => ['view-reports'],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);

            $role->syncPermissions($rolePermissions);
        }

        $district = \App\Domains\School\Models\District::where('code', 'KIN')->first();
        $school = \App\Domains\School\Models\School::where('registration_number', 'S0101')->first();

        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@derms.go.tz'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'District Administrator',
                'password' => bcrypt('password'),
                'status' => 'active',
                'phone_number' => '+255700000000',
                'district_id' => $district?->id,
            ]
        );
        $superAdmin->assignRole('Super Administrator');

        $districtOfficer = User::firstOrCreate(
            ['email' => 'district.officer@derms.go.tz'],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Kinondoni District Officer',
                'password' => bcrypt('password'),
                'status' => 'active',
                'phone_number' => '+255700000001',
                'district_id' => $district?->id,
            ]
        );
        $districtOfficer->assignRole('District Officer');

        if ($school) {
            $schoolAdmin = User::firstOrCreate(
                ['email' => 'school.admin@derms.go.tz'],
                [
                    'id' => (string) Str::uuid(),
                    'name' => 'School Administrator',
                    'password' => bcrypt('password'),
                    'status' => 'active',
                    'phone_number' => '+255700000002',
                    'district_id' => $district?->id,
                    'school_id' => $school->id,
                ]
            );
            $schoolAdmin->assignRole('School Administrator');
        }
    }
}
