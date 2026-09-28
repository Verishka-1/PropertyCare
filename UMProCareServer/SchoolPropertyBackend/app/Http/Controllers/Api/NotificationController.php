<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * In-app notification center for both the user and admin dashboards
 * ("push notifications" list - see App\Support\PushNotifier for how
 * these get created).
 */
class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'data' => $request->user()->notifications()->limit(50)->get(),
            'unread_count' => $request->user()->notifications()->whereNull('read_at')->count(),
        ]);
    }

    public function markRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Marked as read.']);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
