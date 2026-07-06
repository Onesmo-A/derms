
+# DERMS User Accounts Plan
+
+## Current State
+
+- Single auth source: `App\Domains\Identity\Models\User` on the `users` table.
+- Auth flow is hybrid:
+  - Laravel `web` session guard in `config/auth.php`
+  - Sanctum tokens for API auth in `AuthController`
+- Roles/permissions are already established through Spatie Permission.
+- Seeded role hierarchy already exists:
+  - Super Administrator
+  - Regional Education Officer (REO)
+  - District Education Officer (DEO)
+  - District Academic Officer
+  - Head of School
+  - Academic Master/Mistress
+  - Subject Teacher
+  - Student
+  - Parent
+- Access scoping already exists in `AccessScopeService` and `UserManagementService`.
+- Main app navigation is still static:
+  - `resources/js/components/app-sidebar.tsx`
+  - `resources/js/components/nav-main.tsx`
+  - `resources/js/components/app-header.tsx`
+- Reporting is the only area that already has role-aware menu generation.
+- There is policy drift:
+  - `ExaminationPolicy` still uses legacy role names.
+
+## Goal
+
+Build a complete user account system that:
+
+- supports all system roles consistently,
+- creates accounts with the correct data scope,
+- shows sidebar/features based on role and permission,
+- keeps backend authorization stronger than UI hiding,
+- is seeded with usable demo accounts for every role.
+
+## Recommended Approach
+
+### Phase 1: Normalize the account model
+
+- Make `users` the only login account table.
+- Align legacy helpers with the current user schema:
+  - `CreateNewUser`
+  - `UserFactory`
+  - controller validation
+- Decide how to model learners and guardians:
+  - student login account should link to a student record
+  - parent login account should link to one or more students through a new pivot table
+- Keep scope rules based on `region_id`, `district_id`, and `school_id`.
+
+### Phase 2: Finish account lifecycle flows
+
+- Standardize:
+  - create
+  - update
+  - activate/deactivate
+  - lock/unlock
+  - reset password
+  - force password change
+- Make form behavior role-aware:
+  - super admin sees all scope selectors
+  - REO sees region-bound options
+  - DEO sees district-bound options
+  - school roles see school-bound options
+  - student/parent forms show linkage selectors if implemented
+
+### Phase 3: Add menu visibility metadata
+
+- Extend navigation items with visibility rules:
+  - roles
+  - permissions
+  - optional scope
+- Filter sidebar/menu items before render.
+- Share the authenticated user's:
+  - role names
+  - permissions
+  - scope ids
+  to the frontend.
+- Keep route gating separate from menu hiding.
+
+### Phase 4: Clean up authorization
+
+- Fix policy role-name drift.
+- Audit all policies and route protections for exact seeded role names.
+- Keep Super Administrator as the global bypass.
+- Make sure exam, school, and student access checks align with the seeded hierarchy.
+
+### Phase 5: Expand demo seeding
+
+- Seed one or two representative users for each role.
+- Ensure seeded accounts are scoped correctly.
+- Make seeders idempotent.
+- Add linked parent/student demo data once the linkage table exists.
+
+## Files Likely To Change
+
+- `app/Domains/Identity/Models/User.php`
+- `app/Http/Controllers/Api/AuthController.php`
+- `app/Http/Controllers/Api/UserController.php`
+- `app/Domains/Identity/Services/UserManagementService.php`
+- `app/Services/AccessScopeService.php`
+- `app/Actions/Fortify/CreateNewUser.php`
+- `database/factories/UserFactory.php`
+- `database/seeders/Modules/IdentitySeeder.php`
+- `database/seeders/DatabaseSeeder.php`
+- `app/Policies/ExaminationPolicy.php`
+- `app/Policies/SchoolPolicy.php`
+- `app/Policies/StudentPolicy.php`
+- `app/Providers/AuthServiceProvider.php`
+- `resources/js/components/app-sidebar.tsx`
+- `resources/js/components/nav-main.tsx`
+- `resources/js/components/app-header.tsx`
+- `resources/js/types/navigation.ts`
+- `app/Http/Middleware/HandleInertiaRequests.php`
+
+## Verification Plan
+
+- Confirm login works for:
+  - Super Administrator
+  - REO
+  - DEO
+  - school-level user
+  - student
+  - parent
+- Confirm user creation/editing respects scope boundaries.
+- Confirm sidebar items differ by role/permission.
+- Confirm legacy roles no longer appear in policies.
+- Run the build and test suites after each phase.
+
+## Suggested First Implementation Order
+
+1. Fix schema and account model drift.
+2. Add/repair account creation and edit flows.
+3. Add visibility metadata and sidebar filtering.
+4. Clean up policies and route protection.
+5. Expand and verify seed/demo accounts.
