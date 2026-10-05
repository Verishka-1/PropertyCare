<?php

namespace App\Notifications;

use App\Models\DamageReport;
use App\Services\ExpoPushNotificationService;

class ReportStatusNotification
{
    public function __construct(
        private DamageReport $report
    ) {
    }

    public function send(): void
    {
        $user = $this->report->user;

        if (!$user) {
            return;
        }

        $service = app(
            ExpoPushNotificationService::class
        );

        $status = $this->report->status;

        switch ($status) {
            case 'verified':

                $service->sendToUser(
                    $user,
                    'Report Accepted',
                    'Your damage report has been accepted and is now being processed.',
                    [
                        'type' => 'report_status',
                        'status' => 'verified',
                        'report_id' => $this->report->id,
                    ]
                );

                break;

            case 'rejected':

                $service->sendToUser(
                    $user,
                    'Report Rejected',
                    'Your damage report has been rejected. Open the report for more details.',
                    [
                        'type' => 'report_status',
                        'status' => 'rejected',
                        'report_id' => $this->report->id,
                    ]
                );

                break;

            case 'completed':

                $service->sendToUser(
                    $user,
                    'Report Completed',
                    'The work on your reported issue has been completed.',
                    [
                        'type' => 'report_status',
                        'status' => 'completed',
                        'report_id' => $this->report->id,
                    ]
                );

                break;
        }
    }
}