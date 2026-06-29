<?php

use App\Providers\AppServiceProvider;
use App\Providers\AuthServiceProvider;
use App\Providers\FortifyServiceProvider;
use App\Providers\DomainServiceProvider;
use App\Providers\NotificationServiceProvider;

return [
    AppServiceProvider::class,
    AuthServiceProvider::class,
    FortifyServiceProvider::class,
    DomainServiceProvider::class,
    NotificationServiceProvider::class,
];
