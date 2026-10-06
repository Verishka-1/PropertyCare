import React from "react";

import NotificationList from "../../components/NotificationList";

/** Bell icon -> Notifications (administrator). */
export default function AdminNotificationsScreen() {
  return <NotificationList target="admin" />;
}
