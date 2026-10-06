<?php

namespace App\Support;

use App\Models\Complaint;
use App\Models\DamageReport;
use App\Models\Notification;
use App\Models\User;

/**
 * In-app notifications (the bell icon in the app).
 *
 * Every notification is just a row in the `notifications` table. The mobile
 * app polls GET /api/notifications/unread-count to show the red badge on the
 * bell and GET /api/notifications for the list.
 *
 * (Push notifications were removed - Expo Go no longer supports them since
 *  SDK 53 - so nothing here talks to any external service.)
 */
class Notifier
{
    public static function notify(
        User $user,
        string $title,
        string $body,
        string $type = 'general',
        ?DamageReport $report = null,
        ?Complaint $complaint = null
    ): Notification {
        return Notification::create([
            'user_id' => $user->id,
            'damage_report_id' => $report?->id,
            'complaint_id' => $complaint?->id,
            'title' => $title,
            'body' => $body,
            'type' => $type,
        ]);
    }

    /**
     * Notify every admin account.
     */
    public static function notifyAdmins(
        string $title,
        string $body,
        string $type = 'general',
        ?DamageReport $report = null,
        ?Complaint $complaint = null
    ): void {
        User::query()
            ->where('role', 'admin')
            ->get()
            ->each(fn (User $admin) => static::notify(
                $admin,
                $title,
                $body,
                $type,
                $report,
                $complaint
            ));
    }
}
