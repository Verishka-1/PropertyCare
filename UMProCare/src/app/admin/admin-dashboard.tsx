import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { apiRequest, logout } from "../../services/api";

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
  maroon: "#7A1F2B",
  maroonDark: "#5F1721",
  maroonLight: "#F8ECEE",
  maroonSoft: "#FBF3F4",

  background: "#F5F5F5",
  card: "#FFFFFF",

  text: "#202124",
  textSecondary: "#687078",
  textMuted: "#92999F",

  border: "#E5E5E5",

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

  const handleLogout = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error("Logout error:", error);
            } finally {
              router.replace("/login");
            }
          },
        },
      ]
    );
  };

  const openAllReports = () => {
    router.navigate("/admin/admin-reports");
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
          />
        }
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>A</Text>
            </View>

            <View>
              <Text style={styles.eyebrow}>PROPERTY CARE</Text>

              <Text style={styles.pageTitle}>
                Admin Dashboard
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        {/* =====================================================
            DASHBOARD INTRO
        ===================================================== */}

        <View style={styles.introCard}>
          <View style={styles.introAccent} />

          <View style={styles.introContent}>
            <Text style={styles.introTitle}>
              School Property Reports
            </Text>

            <Text style={styles.introText}>
              Monitor submitted reports and track the current
              repair status of school property.
            </Text>
          </View>

          <View style={styles.introIcon}>
            <Text style={styles.introIconText}>▣</Text>
          </View>
        </View>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (
          <View style={styles.loadingBox}>
            <View style={styles.loadingIcon}>
              <ActivityIndicator
                size="small"
                color={COLORS.maroon}
              />
            </View>

            <Text style={styles.loadingTitle}>
              Loading dashboard
            </Text>

            <Text style={styles.loadingText}>
              Getting the latest report information...
            </Text>
          </View>
        ) : (
          <>
            {/* =================================================
                ERROR
            ================================================= */}

            {!!errorMessage && (
              <View style={styles.errorBox}>
                <View style={styles.errorIcon}>
                  <Text style={styles.errorIconText}>!</Text>
                </View>

                <View style={styles.errorContent}>
                  <Text style={styles.errorTitle}>
                    Unable to load dashboard
                  </Text>

                  <Text style={styles.errorText}>
                    {errorMessage}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => loadDashboard()}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryText}>
                      Try again
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* =================================================
                REPORT SUMMARY
            ================================================= */}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Report Summary
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Overview of current property reports
                </Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <SummaryCard
                label="Total Reports"
                count={summary.total}
                accent={COLORS.maroon}
                icon="▣"
              />

              <SummaryCard
                label="Pending"
                count={summary.pending}
                accent={COLORS.pending}
                icon="◷"
              />

              <SummaryCard
                label="In Progress"
                count={summary.in_progress}
                accent={COLORS.progress}
                icon="↻"
              />

              <SummaryCard
                label="Completed"
                count={summary.completed}
                accent={COLORS.completed}
                icon="✓"
              />
            </View>

            {/* =================================================
                NEEDS REVIEW HEADER
            ================================================= */}

            <View style={styles.reviewHeader}>
              <View style={styles.reviewHeaderLeft}>
                <View style={styles.reviewTitleRow}>
                  <Text style={styles.sectionTitle}>
                    Needs Review
                  </Text>

                  {summary.pending > 0 && (
                    <View style={styles.pendingCountBadge}>
                      <Text style={styles.pendingCountText}>
                        {summary.pending}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.sectionSubtitle}>
                  Latest reports awaiting review
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={openAllReports}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.viewAllButton,
                  pressed && styles.viewAllPressed,
                ]}
              >
                <Text style={styles.viewAllText}>
                  View all
                </Text>

                <Text style={styles.viewAllArrow}>›</Text>
              </Pressable>
            </View>

            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {needsReview.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconText}>✓</Text>
                </View>

                <Text style={styles.emptyTitle}>
                  No reports to review
                </Text>

                <Text style={styles.emptyText}>
                  New reports awaiting administrator review will
                  appear here.
                </Text>
              </View>
            ) : (
              /* =================================================
                 REPORT QUEUE
              ================================================= */

              <View style={styles.reportList}>
                {needsReview.map((report, index) => (
                  <Pressable
                    key={report.id}
                    accessibilityRole="button"
                    onPress={() => openReport(report)}
                    style={({ pressed }) => [
                      styles.reportRow,
                      index === needsReview.length - 1 &&
                        styles.lastReportRow,
                      pressed && styles.reportRowPressed,
                    ]}
                  >
                    {/* Left status indicator */}
                    <View style={styles.reportIndicator} />

                    <View style={styles.reportMain}>
                      <View style={styles.reportTitleRow}>
                        <Text
                          style={styles.reportTitle}
                          numberOfLines={2}
                        >
                          {report.title || "Damage report"}
                        </Text>

                        <View style={styles.pendingBadge}>
                          <View style={styles.pendingDot} />

                          <Text style={styles.pendingBadgeText}>
                            Pending
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.reportNumber}>
                        {report.report_number}
                      </Text>

                      <View style={styles.locationRow}>
                        <Text style={styles.locationIcon}>
                          ⌖
                        </Text>

                        <Text
                          style={styles.reportLocation}
                          numberOfLines={1}
                        >
                          {[
                            report.building_name,
                            report.room_name,
                          ]
                            .filter(Boolean)
                            .join(" • ") ||
                            "Location not specified"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.chevronContainer}>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* =================================================
                REPORT STATUS
            ================================================= */}

            <View style={styles.statusSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Report Status
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    Current distribution of reports
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
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ===============================================================
   SUMMARY CARD
=============================================================== */

type SummaryCardProps = {
  label: string;
  count: number;
  accent: string;
  icon: string;
};

function SummaryCard({
  label,
  count,
  accent,
  icon,
}: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTopRow}>
        <View
          style={[
            styles.summaryIcon,
            {
              backgroundColor:
                accent === COLORS.maroon
                  ? COLORS.maroonLight
                  : accent === COLORS.pending
                  ? COLORS.pendingBg
                  : accent === COLORS.progress
                  ? COLORS.progressBg
                  : COLORS.completedBg,
            },
          ]}
        >
          <Text
            style={[
              styles.summaryIconText,
              {
                color: accent,
              },
            ]}
          >
            {icon}
          </Text>
        </View>

        <View
          style={[
            styles.summaryAccent,
            {
              backgroundColor: accent,
            },
          ]}
        />
      </View>

      <Text style={styles.summaryCount}>{count}</Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

/* ===============================================================
   STATUS ROW
=============================================================== */

type StatusRowProps = {
  label: string;
  count: number;
  total: number;
  color: string;
  background: string;
};

function StatusRow({
  label,
  count,
  total,
  color,
  background,
}: StatusRowProps) {
  const percentage =
    total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <View style={styles.statusRow}>
      <View style={styles.statusLabelArea}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: color,
            },
          ]}
        />

        <Text style={styles.statusLabel}>{label}</Text>
      </View>

      <View style={styles.statusBarContainer}>
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
      </View>

      <View
        style={[
          styles.statusCountBadge,
          {
            backgroundColor: background,
          },
        ]}
      >
        <Text
          style={[
            styles.statusCount,
            {
              color,
            },
          ]}
        >
          {count}
        </Text>
      </View>
    </View>
  );
}

/* ===============================================================
   STYLES
=============================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },

  /* -------------------------------------------------------------
     HEADER
  ------------------------------------------------------------- */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  adminBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  eyebrow: {
    color: COLORS.maroon,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 3,
  },

  pageTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
  },

  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  logoutButtonPressed: {
    backgroundColor: "#F0F0F0",
  },

  logoutText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },

  /* -------------------------------------------------------------
     INTRO CARD
  ------------------------------------------------------------- */

  introCard: {
    minHeight: 112,
    borderRadius: 16,
    backgroundColor: COLORS.maroon,
    marginBottom: 26,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },

  introAccent: {
    width: 4,
    height: 63,
    borderRadius: 3,
    backgroundColor: "#D9A1A8",
    marginRight: 13,
  },

  introContent: {
    flex: 1,
    paddingRight: 10,
  },

  introTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  introText: {
    color: "#F1DDE0",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  introIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },

  introIconText: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  /* -------------------------------------------------------------
     LOADING
  ------------------------------------------------------------- */

  loadingBox: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 55,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.maroonLight,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 12,
  },

  loadingText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 5,
  },

  /* -------------------------------------------------------------
     ERROR
  ------------------------------------------------------------- */

  errorBox: {
    flexDirection: "row",
    padding: 14,
    marginBottom: 20,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#F0C9C6",
    backgroundColor: COLORS.dangerBg,
  },

  errorIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#F9D9D6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  errorIconText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: "900",
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "900",
  },

  errorText: {
    color: "#8E3A35",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  retryButton: {
    alignSelf: "flex-start",
    marginTop: 7,
  },

  retryText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: "900",
  },

  /* -------------------------------------------------------------
     SECTION
  ------------------------------------------------------------- */

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },

  /* -------------------------------------------------------------
     SUMMARY CARDS
  ------------------------------------------------------------- */

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 29,
  },

  summaryCard: {
    width: "48.3%",
    minHeight: 130,
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
  },

  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryIconText: {
    fontSize: 17,
    fontWeight: "900",
  },

  summaryAccent: {
    width: 22,
    height: 4,
    borderRadius: 3,
  },

  summaryCount: {
    color: COLORS.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
  },

  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  /* -------------------------------------------------------------
     REVIEW HEADER
  ------------------------------------------------------------- */

  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  reviewHeaderLeft: {
    flex: 1,
  },

  reviewTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  pendingCountBadge: {
    minWidth: 23,
    height: 23,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: COLORS.maroonLight,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  pendingCountText: {
    color: COLORS.maroon,
    fontSize: 10,
    fontWeight: "900",
  },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
  },

  viewAllPressed: {
    opacity: 0.55,
  },

  viewAllText: {
    color: COLORS.maroon,
    fontSize: 12,
    fontWeight: "900",
  },

  viewAllArrow: {
    color: COLORS.maroon,
    fontSize: 19,
    marginLeft: 2,
    marginTop: -1,
  },

  /* -------------------------------------------------------------
     EMPTY STATE
  ------------------------------------------------------------- */

  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  emptyIcon: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: COLORS.completedBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emptyIconText: {
    color: COLORS.completed,
    fontSize: 20,
    fontWeight: "900",
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },

  emptyText: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
    textAlign: "center",
  },

  /* -------------------------------------------------------------
     REPORT LIST
  ------------------------------------------------------------- */

  reportList: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  reportRow: {
    minHeight: 94,
    flexDirection: "row",
    alignItems: "stretch",
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  lastReportRow: {
    borderBottomWidth: 0,
  },

  reportRowPressed: {
    backgroundColor: "#F8F8F8",
  },

  reportIndicator: {
    width: 4,
    backgroundColor: COLORS.pending,
  },

  reportMain: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 13,
  },

  reportTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  reportTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    paddingRight: 8,
  },

  reportNumber: {
    color: COLORS.maroon,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: 0.2,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  locationIcon: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginRight: 4,
  },

  reportLocation: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 10,
  },

  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.pendingBg,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 20,
  },

  pendingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.pending,
    marginRight: 4,
  },

  pendingBadgeText: {
    color: "#9A5B00",
    fontSize: 9,
    fontWeight: "900",
  },

  chevronContainer: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  chevron: {
    color: "#A0A6AA",
    fontSize: 24,
  },

  /* -------------------------------------------------------------
     STATUS SECTION
  ------------------------------------------------------------- */

  statusSection: {
    marginTop: 29,
  },

  statusCard: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  statusRow: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
  },

  statusLabelArea: {
    width: 91,
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },

  statusLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  statusBarContainer: {
    flex: 1,
    marginHorizontal: 10,
  },

  statusTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ECEEEF",
    overflow: "hidden",
  },

  statusFill: {
    height: "100%",
    borderRadius: 4,
    minWidth: 2,
  },

  statusCountBadge: {
    minWidth: 31,
    height: 27,
    paddingHorizontal: 7,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  statusCount: {
    fontSize: 11,
    fontWeight: "900",
  },
});