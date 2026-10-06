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
import { router, useFocusEffect } from "expo-router";

import NotificationBell from "../../components/NotificationBell";
import { apiRequest } from "../../services/api";

type Report = {
  id: number;
  report_number: string;
  title: string;
  building_name: string | null;
  room_name: string | null;
  status: string;
};

type DashboardResponse = {
  summary: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
  needs_review: Report[];
};

const EMPTY_SUMMARY = {
  total: 0,
  pending: 0,
  in_progress: 0,
  completed: 0,
};

const COLORS = {
  maroon: "#800000",
  darkMaroon: "#5A0000",
  lighterMaroon: "#F5E6E8",

  background: "#F6F6F6",
  white: "#FFFFFF",

  text: "#202124",
  textSecondary: "#687078",
  muted: "#92999F",

  border: "#E7E7E7",

  pending: "#D97706",
  pendingBg: "#FFF4DF",

  progress: "#2563EB",
  progressBg: "#EDF3FF",

  completed: "#15803D",
  completedBg: "#EAF7EE",

  danger: "#B42318",
  dangerBg: "#FFF1F0",
};

export default function AdminDashboardScreen() {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [needsReview, setNeedsReview] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage("");

    try {
      const response = (await apiRequest(
        "/admin/dashboard"
      )) as DashboardResponse;

      setSummary(response.summary ?? EMPTY_SUMMARY);

      setNeedsReview(
        Array.isArray(response.needs_review)
          ? response.needs_review
          : []
      );
    } catch (error) {
      console.error("Dashboard load error:", error);

      setErrorMessage(
        "Could not load dashboard data. Check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const openReport = (report: Report) => {
    router.push({
      pathname: "/admin/admin-report-details",
      params: {
        id: String(report.id),
      },
    });
  };

  const openAllReports = () => {
    router.push("/admin/admin-reports");
  };

  const openCampusMap = () => {
    router.push("/campus-map" as any);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor={COLORS.maroon}
            colors={[COLORS.maroon]}
          />
        }
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileLetter}>A</Text>
            </View>

            <View style={styles.greetingContainer}>
              <Text style={styles.smallGreeting}>
                Welcome back
              </Text>

              <Text style={styles.adminName}>
                Administrator
              </Text>
            </View>
          </View>

          <NotificationBell
            target="admin"
            tone="dark"
          />
        </View>

        {/* =====================================================
            WELCOME CARD
        ===================================================== */}

        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeSmallText}>
              ADMINISTRATOR
            </Text>

            <Text style={styles.welcomeTitle}>
              Manage School Property
            </Text>

            <Text style={styles.welcomeDescription}>
              Review damage reports and monitor the
              condition of school property.
            </Text>

            <Pressable
              onPress={openAllReports}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                View Reports
              </Text>

              <Text style={styles.primaryButtonArrow}>
                ›
              </Text>
            </Pressable>
          </View>

          <View style={styles.welcomeDecoration}>
            <View style={styles.decorationLine} />
            <View style={styles.decorationLineSmall} />
            <View style={styles.decorationSquare} />
          </View>
        </View>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator
              size="small"
              color={COLORS.maroon}
            />

            <Text style={styles.loadingText}>
              Loading dashboard...
            </Text>
          </View>
        ) : (
          <>
            {/* =================================================
                ERROR
            ================================================= */}

            {!!errorMessage && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>
                  Unable to load dashboard
                </Text>

                <Text style={styles.errorText}>
                  {errorMessage}
                </Text>

                <Pressable
                  onPress={() => loadDashboard()}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>
                    Try again
                  </Text>
                </Pressable>
              </View>
            )}

            {/* =================================================
                OVERVIEW
            ================================================= */}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Report Overview
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Current property report activity
                </Text>
              </View>

              <Pressable
                onPress={() => loadDashboard(true)}
                disabled={refreshing}
                style={({ pressed }) => [
                  styles.refreshButton,
                  pressed && styles.refreshPressed,
                  refreshing && styles.refreshDisabled,
                ]}
              >
                <Text style={styles.refreshText}>
                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </Text>
              </Pressable>
            </View>

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <View style={styles.statsGrid}>
              <StatCard
                title="Total"
                value={summary.total}
                background={COLORS.lighterMaroon}
                accent={COLORS.maroon}
              />

              <StatCard
                title="Pending"
                value={summary.pending}
                background={COLORS.pendingBg}
                accent={COLORS.pending}
              />

              <StatCard
                title="In Progress"
                value={summary.in_progress}
                background={COLORS.progressBg}
                accent={COLORS.progress}
              />

              <StatCard
                title="Completed"
                value={summary.completed}
                background={COLORS.completedBg}
                accent={COLORS.completed}
              />
            </View>

            {/* =================================================
                NEEDS REVIEW
            ================================================= */}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>
                  Needs Review
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Reports waiting for administrator action
                </Text>
              </View>

              <Pressable
                onPress={openAllReports}
                style={({ pressed }) => [
                  styles.viewAllButton,
                  pressed && styles.viewAllPressed,
                ]}
              >
                <Text style={styles.viewAllText}>
                  View all
                </Text>

                <Text style={styles.viewAllArrow}>
                  ›
                </Text>
              </Pressable>
            </View>

            {needsReview.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyCircle}>
                  <Text style={styles.emptyCheck}>
                    ✓
                  </Text>
                </View>

                <Text style={styles.emptyTitle}>
                  No reports waiting for review
                </Text>

                <Text style={styles.emptyText}>
                  New reports submitted by users will
                  appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.reportsCard}>
                {needsReview.map((report, index) => {
                  const location = [
                    report.building_name,
                    report.room_name,
                  ]
                    .filter(Boolean)
                    .join(" • ");

                  return (
                    <Pressable
                      key={report.id}
                      onPress={() => openReport(report)}
                      style={({ pressed }) => [
                        styles.reportItem,
                        index ===
                          needsReview.length - 1 &&
                          styles.lastReportItem,
                        pressed &&
                          styles.reportItemPressed,
                      ]}
                    >
                      <View
                        style={styles.reportAccent}
                      />

                      <View style={styles.reportContent}>
                        <Text
                          style={styles.reportTitle}
                          numberOfLines={2}
                        >
                          {report.title ||
                            "Damage report"}
                        </Text>

                        <Text
                          style={styles.reportNumber}
                        >
                          {report.report_number}
                        </Text>

                        <Text
                          style={styles.reportLocation}
                          numberOfLines={1}
                        >
                          {location ||
                            "Location not specified"}
                        </Text>
                      </View>

                      <View style={styles.reportRight}>
                        <View style={styles.pendingBadge}>
                          <Text
                            style={styles.pendingBadgeText}
                          >
                            Pending
                          </Text>
                        </View>

                        <Text style={styles.chevron}>
                          ›
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* =================================================
                STATUS OVERVIEW
            ================================================= */}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Report Status
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Current progress of property reports
                </Text>
              </View>
            </View>

            <View style={styles.statusCard}>
              <StatusRow
                label="Pending"
                count={summary.pending}
                total={summary.total}
                color={COLORS.pending}
                background={COLORS.pendingBg}
              />

              <StatusRow
                label="In Progress"
                count={summary.in_progress}
                total={summary.total}
                color={COLORS.progress}
                background={COLORS.progressBg}
              />

              <StatusRow
                label="Completed"
                count={summary.completed}
                total={summary.total}
                color={COLORS.completed}
                background={COLORS.completedBg}
                last
              />
            </View>

            {/* =================================================
                BOTTOM CARD
            ================================================= */}

            <Pressable
              onPress={openAllReports}
              style={({ pressed }) => [
                styles.bottomCard,
                pressed && styles.bottomCardPressed,
              ]}
            >
              <View>
                <Text style={styles.bottomTitle}>
                  Manage all property reports
                </Text>

                <Text style={styles.bottomSubtitle}>
                  Open the complete report management page
                </Text>
              </View>

              <Text style={styles.bottomArrow}>
                ›
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

type StatCardProps = {
  title: string;
  value: number;
  background: string;
  accent: string;
};

function StatCard({
  title,
  value,
  background,
  accent,
}: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: background,
          },
        ]}
      >
        <View
          style={[
            styles.statIconInner,
            {
              backgroundColor: accent,
            },
          ]}
        />
      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statTitle}>
        {title}
      </Text>

      <View
        style={[
          styles.statLine,
          {
            backgroundColor: accent,
          },
        ]}
      />
    </View>
  );
}

/* ============================================================
   QUICK ACTION
============================================================ */

type QuickActionProps = {
  title: string;
  description: string;
  onPress: () => void;
};

function QuickAction({
  title,
  description,
  onPress,
}: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.quickActionPressed,
      ]}
    >
      <View style={styles.quickActionText}>
        <Text style={styles.quickActionTitle}>
          {title}
        </Text>

        <Text style={styles.quickActionDescription}>
          {description}
        </Text>
      </View>

      <Text style={styles.quickActionArrow}>
        ›
      </Text>
    </Pressable>
  );
}

/* ============================================================
   STATUS ROW
============================================================ */

type StatusRowProps = {
  label: string;
  count: number;
  total: number;
  color: string;
  background: string;
  last?: boolean;
};

function StatusRow({
  label,
  count,
  total,
  color,
  background,
  last = false,
}: StatusRowProps) {
  const percentage =
    total > 0
      ? Math.round((count / total) * 100)
      : 0;

  return (
    <View
      style={[
        styles.statusRow,
        last && styles.statusRowLast,
      ]}
    >
      <View style={styles.statusTop}>
        <View style={styles.statusLabelContainer}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: color,
              },
            ]}
          />

          <Text style={styles.statusLabel}>
            {label}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: background,
            },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              {
                color,
              },
            ]}
          >
            {count}
          </Text>
        </View>
      </View>

      <View style={styles.statusProgressRow}>
        <View style={styles.statusTrack}>
          <View
            style={[
              styles.statusFill,
              {
                width: `${percentage}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>

        <Text style={styles.statusPercentage}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 45,
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 22,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  profileLetter: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },

  greetingContainer: {
    flex: 1,
  },

  smallGreeting: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },

  adminName: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
  },

  /* WELCOME */

  welcomeCard: {
    backgroundColor: COLORS.maroon,
    borderRadius: 20,
    minHeight: 190,
    padding: 20,
    marginBottom: 27,
    overflow: "hidden",
    flexDirection: "row",
  },

  welcomeContent: {
    flex: 1,
    zIndex: 2,
  },

  welcomeSmallText: {
    color: "#EACED2",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  welcomeTitle: {
    color: COLORS.white,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    marginTop: 7,
    maxWidth: 250,
  },

  welcomeDescription: {
    color: "#F1DDE0",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
    maxWidth: 270,
  },

  primaryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 15,
  },

  primaryButtonPressed: {
    opacity: 0.8,
  },

  primaryButtonText: {
    color: COLORS.maroon,
    fontSize: 11,
    fontWeight: "900",
  },

  primaryButtonArrow: {
    color: COLORS.maroon,
    fontSize: 18,
    marginLeft: 7,
    marginTop: -1,
  },

  welcomeDecoration: {
    position: "absolute",
    right: -15,
    top: 0,
    width: 120,
    height: "100%",
    opacity: 0.25,
  },

  decorationLine: {
    position: "absolute",
    width: 95,
    height: 95,
    borderRadius: 48,
    borderWidth: 18,
    borderColor: "#FFFFFF",
    right: -30,
    top: 22,
  },

  decorationLineSmall: {
    position: "absolute",
    width: 65,
    height: 65,
    borderRadius: 33,
    borderWidth: 10,
    borderColor: "#FFFFFF",
    right: 17,
    bottom: -25,
  },

  decorationSquare: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "#FFFFFF",
    right: 50,
    top: 42,
    transform: [{ rotate: "15deg" }],
  },

  /* LOADING */

  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 45,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 10,
  },

  /* ERROR */

  errorCard: {
    backgroundColor: COLORS.dangerBg,
    borderRadius: 14,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F0C9C6",
  },

  errorTitle: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "900",
  },

  errorText: {
    color: "#8E3A35",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  retryButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },

  retryText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: "900",
  },

  /* SECTIONS */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionHeaderLeft: {
    flex: 1,
    paddingRight: 10,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },

  refreshButton: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 9,
  },

  refreshPressed: {
    opacity: 0.8,
  },

  refreshDisabled: {
    opacity: 0.55,
  },

  refreshText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  /* STATISTICS */

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 28,
  },

  statCard: {
    width: "48.2%",
    minHeight: 130,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  statIconInner: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "900",
  },

  statTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },

  statLine: {
    width: 22,
    height: 4,
    borderRadius: 3,
    marginTop: 10,
  },

  /* VIEW ALL */

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  viewAllPressed: {
    opacity: 0.6,
  },

  viewAllText: {
    color: COLORS.maroon,
    fontSize: 11,
    fontWeight: "900",
  },

  viewAllArrow: {
    color: COLORS.maroon,
    fontSize: 18,
    marginLeft: 3,
  },

  /* EMPTY */

  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 35,
    marginBottom: 28,
  },

  emptyCircle: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: COLORS.completedBg,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCheck: {
    color: COLORS.completed,
    fontSize: 21,
    fontWeight: "900",
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 11,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 5,
  },

  /* REPORTS */

  reportsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 28,
  },

  reportItem: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  lastReportItem: {
    borderBottomWidth: 0,
  },

  reportItemPressed: {
    backgroundColor: COLORS.lighterMaroon,
  },

  reportAccent: {
    width: 4,
    height: 57,
    borderRadius: 3,
    backgroundColor: COLORS.pending,
    marginRight: 12,
  },

  reportContent: {
    flex: 1,
    minWidth: 0,
  },

  reportTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },

  reportNumber: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },

  reportLocation: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 5,
  },

  reportRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 62,
    marginLeft: 8,
  },

  pendingBadge: {
    backgroundColor: COLORS.pendingBg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },

  pendingBadgeText: {
    color: COLORS.pending,
    fontSize: 9,
    fontWeight: "900",
  },

  chevron: {
    color: COLORS.maroon,
    fontSize: 24,
    fontWeight: "300",
  },

  /* QUICK ACTIONS */

  quickActionsSection: {
    marginBottom: 28,
  },

  quickActionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  quickAction: {
    minHeight: 69,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  quickActionPressed: {
    backgroundColor: COLORS.lighterMaroon,
  },

  quickActionText: {
    flex: 1,
  },

  quickActionTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },

  quickActionDescription: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },

  quickActionArrow: {
    color: COLORS.maroon,
    fontSize: 24,
    fontWeight: "300",
    marginLeft: 10,
  },

  /* STATUS */

  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 28,
  },

  statusRow: {
    marginBottom: 19,
  },

  statusRowLast: {
    marginBottom: 0,
  },

  statusTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  statusLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  statusLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },

  statusBadge: {
    minWidth: 29,
    height: 25,
    paddingHorizontal: 7,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },

  statusProgressRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusTrack: {
    flex: 1,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#EEEEEE",
    overflow: "hidden",
  },

  statusFill: {
    height: "100%",
    borderRadius: 5,
  },

  statusPercentage: {
    width: 40,
    textAlign: "right",
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
  },

  /* BOTTOM */

  bottomCard: {
    minHeight: 76,
    backgroundColor: COLORS.maroon,
    borderRadius: 18,
    paddingHorizontal: 17,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bottomCardPressed: {
    backgroundColor: COLORS.darkMaroon,
  },

  bottomTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },

  bottomSubtitle: {
    color: "#EFDADD",
    fontSize: 10,
    marginTop: 3,
  },

  bottomArrow: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "300",
  },
});