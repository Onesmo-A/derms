<?php

use Illuminate\Support\Facades\Route;

// Fallback to React SPA for all non-api routes
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|storage).*$');
