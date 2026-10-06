import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useUnreadNotificationCount } from "../services/notifications";

type Props = {
  /** Which notification screen the bell opens. */
  target: "user" | "admin";
  /** "light" = white icon (for maroon headers), "dark" = maroon icon. */
  tone?: "light" | "dark";
};

/**
 * Bell icon with a red unread badge.
 * Drop it into any header: <NotificationBell target="user" tone="light" />
 */
export default function NotificationBell({ target, tone = "dark" }: Props) {
  const { count } = useUnreadNotificationCount();

  const iconColor = tone === "light" ? "#FFFFFF" : "#800020";
  const ringColor =
    tone === "light" ? "rgba(255,255,255,0.75)" : "rgba(128,0,32,0.35)";

  return (
    <Pressable
      onPress={() =>
        router.push(
          (target === "admin"
            ? "/admin/admin-notifications"
            : "/user/notifications") as any
        )
      }
      style={[styles.button, { borderColor: ringColor }]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        count > 0 ? `Notifications, ${count} unread` : "Notifications"
      }
    >
      <Ionicons name="notifications-outline" size={20} color={iconColor} />

      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: "#D92D20",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});
