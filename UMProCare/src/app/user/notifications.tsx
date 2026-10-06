import React from "react";

import NotificationList from "../../components/NotificationList";

/** Bell icon -> Notifications (student / teacher). */
export default function UserNotificationsScreen() {
  return <NotificationList target="user" />;
}
