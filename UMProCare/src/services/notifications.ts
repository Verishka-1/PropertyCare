/**
 * In-app notifications (the bell icon).
 *
 * Push notifications were REMOVED: Expo Go no longer supports them since
 * SDK 53, so this file no longer imports `expo-notifications` and nothing
 * here asks for any device permission.
 *
 * How it works now:
 *  - Laravel stores every notification in the `notifications` table
 *    (new report, report accepted / repair started / completed / rejected,
 *    new complaint, admin reply ...).
 *  - The app asks for the unread number every few seconds and shows it as
 *    the red badge on the bell. Tapping the bell opens the full list.
 */
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getUnreadNotificationCount } from "./api";

export type AppNotification = {
  id: number;
  title: string;
  body: string;
  type: string;
  damage_report_id: number | null;
  complaint_id: number | null;
  read_at: string | null;
  created_at: string;
};

/**
 * Unread notification count for the bell badge.
 * Refreshes when the screen gets focus and every `intervalMs` while open.
 */
export function useUnreadNotificationCount(intervalMs = 15000) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setCount(await getUnreadNotificationCount());
    } catch {
      // The badge is optional - never break a screen because of it.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [refresh, intervalMs]);

  return { count, refresh };
}
