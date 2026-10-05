<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushNotificationService
{
    private const EXPO_PUSH_URL =
        'https://exp.host/--/api/v2/push/send';

    /**
     * Send a push notification to one user.
     */
    public function sendToUser(
        User $user,
        string $title,
        string $body,
        array $data = []
    ): bool {
        if (!$user->expo_push_token) {
            return false;
        }

        return $this->send(
            $user->expo_push_token,
            $title,
            $body,
            $data
        );
    }

    /**
     * Send a push notification to multiple users.
     */
    public function sendToUsers(
        iterable $users,
        string $title,
        string $body,
        array $data = []
    ): int {
        $sent = 0;

        foreach ($users as $user) {
            if (!$user->expo_push_token) {
                continue;
            }

            if (
                $this->send(
                    $user->expo_push_token,
                    $title,
                    $body,
                    $data
                )
            ) {
                $sent++;
            }
        }

        return $sent;
    }

    /**
     * Send notification through Expo Push Service.
     */
    public function send(
        string $token,
        string $title,
        string $body,
        array $data = []
    ): bool {
        try {
            $response = Http::timeout(10)
                ->acceptJson()
                ->post(self::EXPO_PUSH_URL, [
                    'to' => $token,
                    'title' => $title,
                    'body' => $body,
                    'sound' => 'default',
                    'priority' => 'high',
                    'data' => $data,
                ]);

            if (!$response->successful()) {
                Log::warning(
                    'Expo push notification request failed.',
                    [
                        'status' => $response->status(),
                        'response' => $response->json(),
                    ]
                );

                return false;
            }

            $result = $response->json();

            /*
             * Expo can return an individual ticket error even
             * when the HTTP request itself succeeds.
             */
            $ticket = $result['data'][0] ?? null;

            if (
                isset($ticket['status']) &&
                $ticket['status'] === 'error'
            ) {
                $error = $ticket['details']['error'] ?? null;

                Log::warning(
                    'Expo push notification ticket failed.',
                    [
                        'token' => $token,
                        'error' => $error,
                        'message' => $ticket['message'] ?? null,
                    ]
                );

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error(
                'Expo push notification exception.',
                [
                    'message' => $e->getMessage(),
                ]
            );

            return false;
        }
    }
}