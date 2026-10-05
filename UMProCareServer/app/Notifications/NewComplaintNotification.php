<?php

namespace App\Notifications;

use App\Services\ExpoPushNotificationService;
use App\Models\User;

class NewComplaintNotification
{
    public function __construct(
        private $complaint
    ) {
    }

    public function send(): void
    {
        $admins = User::query()
            ->where('role', 'admin')
            ->whereNotNull('expo_push_token')
            ->get();

        if ($admins->isEmpty()) {
            return;
        }

        $service = app(
            ExpoPushNotificationService::class
        );

        $subject =
            $this->complaint->subject
            ?: 'New complaint';

        $service->sendToUsers(
            $admins,
            'New Complaint',
            "A user submitted a new complaint: {$subject}",
            [
                'type' => 'new_complaint',
                'complaint_id' => $this->complaint->id,
            ]
        );
    }
}