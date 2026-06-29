<?php

namespace App\Providers;

use App\Domains\Examination\Models\Examination;
use App\Domains\School\Models\School;
use App\Domains\Student\Models\Student;
use App\Policies\ExaminationPolicy;
use App\Policies\SchoolPolicy;
use App\Policies\StudentPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Examination::class => ExaminationPolicy::class,
        School::class => SchoolPolicy::class,
        Student::class => StudentPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Gate::before(static function ($user) {
            return $user->hasRole('Super Administrator') ? true : null;
        });
    }
}
