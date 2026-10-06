import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import { COLORS, Spacing } from "../constants/theme";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/api";
import type { AppNotification } from "../services/notifications";

type Props = {
  /** "user" = student/teacher, "admin" = administrator */
  target: "user" | "admin";
};

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  report_submitted: "document-text-outline",
  status_updated: "git-compare-outline",
  complaint_submitted: "chatbubble-ellipses-outline",
  complaint_reply: "mail-open-outline",
};

function timeAgo(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 172800) return "Yesterday";

  return date.toLocaleDateString();
}

/**
 * The notification screen used by BOTH roles (opened from the bell icon).
 * Tap a notification to mark it as read and, when it belongs to a report,
 * open that report.
 */
export default function NotificationList({ target }: Props) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const home =
    target === "admin" ? "/admin/admin-dashboard" : "/user/user-dashboard";

  const load = useCallback(async () => {
    try {
      setError("");

      const result = await getNotifications();

      setItems(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const unread = items.filter((item) => !item.read_at).length;

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();

      const now = new Date().toISOString();
      setItems((current) =>
        current.map((item) => ({ ...item, read_at: item.read_at ?? now }))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update notifications."
      );
    }
  };

  const openNotification = async (item: AppNotification) => {
    if (!item.read_at) {
      setItems((current) =>
        current.map((row) =>
          row.id === item.id
            ? { ...row, read_at: new Date().toISOString() }
            : row
        )
      );

      markNotificationRead(item.id).catch(() => {
        // the badge refreshes itself; nothing to show here
      });
    }

    if (item.damage_report_id) {
      router.push({
        pathname:
          target === "admin"
            ? "/admin/admin-report-details"
            : "/user/report-details",
        params:
          target === "admin"
            ? { id: String(item.damage_report_id) }
            : {
                id: String(item.damage_report_id),
                returnTo: "/user/notifications",
              },
      } as any);

      return;
    }

    if (target === "admin" && item.type === "complaint_submitted") {
      router.push("/admin/admin-complaints" as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace(home as any)}
          style={styles.backButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </Text>
        </View>

        {unread > 0 ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={COLORS.maroon}
            colors={[COLORS.maroon]}
          />
        }
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.maroon} />
            <Text style={styles.muted}>Loading notifications...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorTitle}>Could not load notifications</Text>
            <Text style={styles.muted}>{error}</Text>
            <Pressable
              onPress={() => {
                setLoading(true);
                load();
              }}
              style={styles.retry}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Ionicons
              name="notifications-off-outline"
              size={42}
              color={COLORS.gray}
            />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.muted}>
              {target === "admin"
                ? "New reports and complaints will appear here."
                : "Updates about your reports and replies from the admin will appear here."}
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const isUnread = !item.read_at;

            return (
              <Pressable
                key={item.id}
                onPress={() => openNotification(item)}
                style={[styles.card, isUnread && styles.cardUnread]}
                accessibilityRole="button"
              >
                <View style={[styles.iconCircle, isUnread && styles.iconUnread]}>
                  <Ionicons
                    name={ICONS[item.type] ?? "notifications-outline"}
                    size={20}
                    color={isUnread ? COLORS.white : COLORS.maroon}
                  />
                </View>

                <View style={styles.cardText}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {isUnread ? <View style={styles.dot} /> : null}
                  </View>

                  <Text style={styles.cardBody}>{item.body}</Text>

                  <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lighterMaroon },

  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: 50,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  backText: {
    color: COLORS.white,
    fontSize: 30,
    lineHeight: 32,
    marginTop: -3,
  },
  headerText: { flex: 1 },
  title: { color: COLORS.maroon, fontSize: 20, fontWeight: "800" },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  markAll: { color: COLORS.maroon, fontSize: 12, fontWeight: "800" },

  list: { padding: Spacing.lg, paddingBottom: 40, gap: 10, flexGrow: 1 },

  center: { alignItems: "center", paddingVertical: 60, gap: 8 },
  muted: { color: COLORS.textSecondary, fontSize: 12, textAlign: "center" },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  errorTitle: { color: COLORS.maroon, fontSize: 15, fontWeight: "800" },
  retry: {
    marginTop: 8,
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: COLORS.white, fontWeight: "700" },

  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  cardUnread: {
    borderColor: COLORS.maroon,
    backgroundColor: "#FFF8FA",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightMaroon,
    alignItems: "center",
    justifyContent: "center",
  },
  iconUnread: { backgroundColor: COLORS.maroon },
  cardText: { flex: 1 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: "800" },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#D92D20",
  },
  cardBody: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  cardTime: { color: COLORS.gray, fontSize: 10, marginTop: 6 },
});
