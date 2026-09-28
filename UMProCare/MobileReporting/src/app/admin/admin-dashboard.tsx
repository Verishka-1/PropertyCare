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
        Array.isArray(response.needs_review) ? response.needs_review : []
      );
    } catch (error) {
      console.error("Dashboard load error:", error);
      setErrorMessage("Could not load dashboard data. Check your connection and try again.");
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
      params: { id: String(report.id) },
    });
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
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
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor="#176B45"
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PROPERTY CARE</Text>
            <Text style={styles.pageTitle}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>
              Overview of school property reports
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#176B45" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : (
          <>
            {!!errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => loadDashboard()}
                >
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.sectionTitle}>Report Summary</Text>

            <View style={styles.summaryGrid}>
              <SummaryCard
                label="Total Reports"
                count={summary.total}
                accent="#176B45"
              />
              <SummaryCard
                label="Pending"
                count={summary.pending}
                accent="#D97706"
              />
              <SummaryCard
                label="In Progress"
                count={summary.in_progress}
                accent="#2563EB"
              />
              <SummaryCard
                label="Completed"
                count={summary.completed}
                accent="#15803D"
              />
            </View>

            <View style={styles.reviewHeading}>
              <View>
                <Text style={styles.sectionTitle}>Needs Review</Text>
                <Text style={styles.sectionSubtitle}>
                  Latest reports awaiting review
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.navigate("/admin/admin-reports")}
                hitSlop={8}
              >
                <Text style={styles.viewAllText}>View all</Text>
              </Pressable>
            </View>

            {needsReview.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No pending reports</Text>
                <Text style={styles.emptyText}>
                  New reports awaiting review will appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.reportList}>
                {needsReview.map((report) => (
                  <Pressable
                    key={report.id}
                    accessibilityRole="button"
                    onPress={() => openReport(report)}
                    style={({ pressed }) => [
                      styles.reportRow,
                      pressed && styles.reportRowPressed,
                    ]}
                  >
                    <View style={styles.reportMain}>
                      <Text style={styles.reportTitle} numberOfLines={2}>
                        {report.title || "Damage report"}
                      </Text>

                      <Text style={styles.reportNumber}>
                        {report.report_number}
                      </Text>

                      <Text style={styles.reportLocation} numberOfLines={1}>
                        {[report.building_name, report.room_name]
                          .filter(Boolean)
                          .join(" • ") || "Location not specified"}
                      </Text>
                    </View>

                    <View style={styles.reportRight}>
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Pending</Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

type SummaryCardProps = {
  label: string;
  count: number;
  accent: string;
};

function SummaryCard({ label, count, accent }: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryAccent, { backgroundColor: accent }]} />
      <Text style={styles.summaryCount}>{count}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  eyebrow: {
    color: "#176B45",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  pageTitle: {
    color: "#17211B",
    fontSize: 25,
    fontWeight: "800",
  },
  subtitle: {
    color: "#6B756E",
    fontSize: 13,
    marginTop: 5,
  },
  logoutButton: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#D9E0DC",
    backgroundColor: "#FFFFFF",
  },
  logoutText: {
    color: "#34443A",
    fontSize: 12,
    fontWeight: "700",
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#6B756E",
    marginTop: 12,
    fontSize: 14,
  },
  errorBox: {
    padding: 14,
    marginBottom: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F2C3C3",
    backgroundColor: "#FFF2F2",
  },
  errorText: {
    color: "#A12626",
    fontSize: 13,
  },
  retryText: {
    color: "#A12626",
    fontWeight: "800",
    marginTop: 8,
  },
  sectionTitle: {
    color: "#17211B",
    fontSize: 18,
    fontWeight: "800",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginTop: 14,
    marginBottom: 28,
  },
  summaryCard: {
    width: "48.3%",
    minHeight: 112,
    padding: 15,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8ECE9",
  },
  summaryAccent: {
    width: 25,
    height: 4,
    borderRadius: 3,
    marginBottom: 12,
  },
  summaryCount: {
    color: "#17211B",
    fontSize: 27,
    fontWeight: "800",
  },
  summaryLabel: {
    color: "#6B756E",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  reviewHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: "#778078",
    fontSize: 12,
    marginTop: 4,
  },
  viewAllText: {
    color: "#176B45",
    fontSize: 13,
    fontWeight: "800",
  },
  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8ECE9",
    alignItems: "center",
  },
  emptyTitle: {
    color: "#26342B",
    fontWeight: "800",
    fontSize: 14,
  },
  emptyText: {
    color: "#778078",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  reportList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8ECE9",
    overflow: "hidden",
  },
  reportRow: {
    minHeight: 86,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1EF",
  },
  reportRowPressed: {
    backgroundColor: "#F4F8F5",
  },
  reportMain: {
    flex: 1,
    paddingRight: 10,
  },
  reportTitle: {
    color: "#253129",
    fontSize: 14,
    fontWeight: "700",
  },
  reportNumber: {
    color: "#176B45",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
  },
  reportLocation: {
    color: "#778078",
    fontSize: 11,
    marginTop: 4,
  },
  reportRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  pendingBadge: {
    backgroundColor: "#FFF3D9",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pendingBadgeText: {
    color: "#9A5B00",
    fontSize: 10,
    fontWeight: "800",
  },
  chevron: {
    color: "#8B958E",
    fontSize: 25,
    marginLeft: 8,
    marginTop: -2,
  },
});