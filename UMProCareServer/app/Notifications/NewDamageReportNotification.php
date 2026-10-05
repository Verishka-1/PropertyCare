<?php

namespace App\Notifications;

use App\Models\DamageReport;
use App\Services\ExpoPushNotificationService;

class NewDamageReportNotification
{
    public function __construct(
        private DamageReport $report
    ) {
    }

    public function send(): void
    {
        $admins = \App\Models\User::query()
            ->where('role', 'admin')
            ->whereNotNull('expo_push_token')
            ->get();

        if ($admins->isEmpty()) {
            return;
        }

        $service = app(
            ExpoPushNotificationService::class
        );

        $property =
            $this->report->property_name
            ?: 'School property';

        $service->sendToUsers(
            $admins,
            'New Damage Report',
            "A new report was submitted for {$property}.",
            [
                'type' => 'new_report',
                'report_id' => $this->report->id,
            ]
        );
    }
}