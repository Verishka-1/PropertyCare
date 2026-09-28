<?php

namespace App\Support;

use App\Models\DamageReport;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Small helper that centralizes "notify a user" logic.
 *
 * Every notification is always saved to the notifications table so it
 * shows up in the app's in-app notification list. If the user's device
 * has registered an Expo push token, we also fire a real push
 * notification through Expo's push API. The push call is best-effort:
 * if it fails (no internet, invalid token, Expo outage) the in-app
 * notification still exists, so nothing is ever silently lost.
 */
class PushNotifier
{
    public static function notify(
        User $user,
        string $title,
        string $body,
        string $type = 'general',
        ?DamageReport $report = null
    ): Notification {
        $notification = Notification::create([
            'user_id' => $user->id,
            'damage_report_id' => $report?->id,
            'title' => $title,
            'body' => $body,
            'type' => $type,
        ]);

        if ($user->expo_push_token) {
            static::sendExpoPush($user->expo_push_token, $title, $body, [
                'type' => $type,
                'damage_report_id' => $report?->id,
            ]);
        }

        return $notification;
    }

    /**
     * Notify every admin account (used when a new report comes in).
     */
    public static function notifyAdmins(string $title, string $body, ?DamageReport $report = null): void
    {
        User::query()
            ->where('role', 'admin')
            ->get()
            ->each(fn (User $admin) => static::notify($admin, $title, $body, 'report_submitted', $report));
    }

    protected static function sendExpoPush(string $expoPushToken, string $title, string $body, array $data = []): void
    {
        try {
            Http::timeout(5)->post('https://exp.host/--/api/v2/push/send', [
                'to' => $expoPushToken,
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'sound' => 'default',
            ]);
        } catch (\Throwable $e) {
            // Never let a push delivery failure break the request that
            // triggered it (e.g. an admin updating a report's status).
            Log::warning('Expo push notification failed: ' . $e->getMessage());
        }
    }
}
