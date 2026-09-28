<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks access to admin-only API routes.
 *
 * Registered as the "admin" middleware alias in bootstrap/app.php.
 * Must run after "auth:sanctum" so $request->user() is available.
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'admin') {
            abort(403, 'Unauthorized. Admin access is required.');
        }

        return $next($request);
    }
}
