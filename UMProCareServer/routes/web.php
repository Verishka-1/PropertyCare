<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

/*
|--------------------------------------------------------------------------
| Report photos
|--------------------------------------------------------------------------
| Streams the uploaded damage photos straight from storage/app/public.
| Works without `php artisan storage:link` and on any IP address / host,
| so photos never "disappear" when your computer's IP changes.
*/
Route::get('/media/{path}', function (string $path) {
    abort_unless(
        str_starts_with($path, 'damage-reports/') && ! str_contains($path, '..'),
        404
    );

    $disk = Storage::disk('public');

    abort_unless($disk->exists($path), 404);

    return response()->file($disk->path($path), [
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');
