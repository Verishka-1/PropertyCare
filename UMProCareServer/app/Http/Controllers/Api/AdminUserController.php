<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Admin-only account management (protected by the "admin" route middleware).
 * The administrator account is never listed and can never be banned.
 */
class AdminUserController extends Controller
{
    private const COLUMNS = [
        'id', 'name', 'first_name', 'last_name', 'username', 'email',
        'contact_number', 'role', 'is_banned', 'created_at',
    ];

    /**
     * GET /api/admin/users?q=search+term
     */
    public function index(Request $request)
    {
        $term = trim((string) $request->query('q', ''));

        $users = User::query()
            ->where('role', '!=', 'admin')
            ->withCount('damageReports')
            ->when($term !== '', function ($query) use ($term) {
                $query->where(function ($inner) use ($term) {
                    $inner->where('name', 'like', "%{$term}%")
                        ->orWhere('username', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%")
                        ->orWhere('contact_number', 'like', "%{$term}%");
                });
            })
            ->latest()
            ->get(self::COLUMNS);

        return response()->json(['data' => $users]);
    }

    /**
     * GET /api/admin/users/{user}
     */
    public function show(User $user)
    {
        abort_if($user->role === 'admin', 404);

        $user->loadCount('damageReports');

        return response()->json([
            'data' => $user->only(array_merge(self::COLUMNS, ['damage_reports_count'])),
        ]);
    }

    /**
     * PATCH /api/admin/users/{user}/ban
     *
     * Toggles the banned state. A banned user is signed out immediately
     * and cannot log back in until unbanned.
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
            'data' => $user->fresh()->only(self::COLUMNS),
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
