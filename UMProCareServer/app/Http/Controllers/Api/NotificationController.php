<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * In-app notification center (the bell icon) for BOTH users and admin.
 * See App\Support\Notifier for how notifications are created.
 */
class NotificationController extends Controller
{
    /** GET /api/notifications */
    public function index(Request $request)
    {
        return response()->json([
            'data' => $request->user()->notifications()->limit(100)->get(),
            'unread_count' => $request->user()->notifications()->whereNull('read_at')->count(),
        ]);
    }

    /** GET /api/notifications/unread-count  (cheap call used for the badge) */
    public function unreadCount(Request $request)
    {
        return response()->json([
            'unread_count' => $request->user()->notifications()->whereNull('read_at')->count(),
        ]);
    }

    /** PATCH /api/notifications/{id}/read */
    public function markRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Marked as read.']);
    }

    /** PATCH /api/notifications/read-all */
    public function markAllRead(Request $request)
    {
        $request->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
