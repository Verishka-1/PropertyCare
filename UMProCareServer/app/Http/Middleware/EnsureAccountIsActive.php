<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks API access for accounts an admin has banned.
 *
 * Registered as the "active" middleware alias in bootstrap/app.php.
 * Must run after "auth:sanctum" so $request->user() is available.
 */
class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->is_banned) {
            // Revoke the token so the app is forced back to the login screen.
            $user->currentAccessToken()?->delete();

            abort(403, 'This account has been banned. Please contact the administrator.');
        }

        return $next($request);
    }
}
