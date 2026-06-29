<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

class DomainServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->registerDomainRoutes();
    }

    /**
     * Dynamically scan and register API routes for all Domain modules.
     */
    protected function registerDomainRoutes(): void
    {
        $domainsPath = app_path('Domains');

        if (!File::isDirectory($domainsPath)) {
            return;
        }

        $modules = File::directories($domainsPath);

        foreach ($modules as $modulePath) {
            $routesFile = $modulePath . '/Routes/api.php';

            if (File::exists($routesFile)) {
                Route::prefix('api/v1')
                    ->middleware('api')
                    ->group($routesFile);
            }
        }
    }
}
