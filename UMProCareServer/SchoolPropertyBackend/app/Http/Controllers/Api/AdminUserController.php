<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Admin-only account management. Protected by the "admin" route
 * middleware (see routes/api.php).
 */
class AdminUserController extends Controller
{
    /**
     * GET /api/admin/users?q=search+term
     */
    public function index(Request $request)
    {
        $term = trim((string) $request->query('q', ''));

        $users = User::query()
            ->when($term !== '', function ($query) use ($term) {
                $query->where(function ($inner) use ($term) {
                    $inner->where('name', 'like', "%{$term}%")
                        ->orWhere('username', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%");
                });
            })
            ->latest()
            ->get(['id', 'name', 'username', 'email', 'role', 'is_banned', 'created_at']);

        return response()->json(['data' => $users]);
    }

    /**
     * PATCH /api/admin/users/{user}/ban
     *
     * Toggles the account's banned state. A banned account is
     * signed out immediately and cannot log back in.
     */
    public function toggleBan(Request $request, User $user)
    {
        abort_if($user->role === 'admin', 422, 'The administrator account cannot be banned.');

        $user->update(['is_banned' => ! $user->is_banned]);

        if ($user->is_banned) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $user->is_banned ? 'User banned.' : 'User unbanned.',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * DELETE /api/admin/users/{user}
     */
    public function destroy(Request $request, User $user)
    {
        abort_if($user->role === 'admin', 422, 'The administrator account cannot be deleted.');
        abort_if($user->id === $request->user()->id, 422, 'You cannot delete your own account.');

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}
