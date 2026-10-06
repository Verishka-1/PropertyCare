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
import { useFocusEffect, router } from "expo-router";

import { Page, Card, Item } from "../../components/Kit";
import { apiRequest } from "../../services/api";
import { COLORS } from "../../constants/theme";

type Report = {
  id: number;
  report_number: string;
  title: string | null;
  building_name: string | null;
  room_name: string | null;
  status: string;
  created_at: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "PENDING",
  verified: "VERIFIED",
  assigned: "ASSIGNED",
  in_progress: "IN PROGRESS",
  completed: "COMPLETED",
  rejected: "REJECTED",
};

function ReportsHeader() {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.replace("/user/user-dashboard" as any)}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back to Home"
        hitSlop={8}
      >
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>

      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>My reports</Text>
        <Text style={styles.headerSubtitle}>
          Follow the progress of your active reports
        </Text>
      </View>
    </View>
  );
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setError("");

    try {
      const response = await apiRequest("/my/reports");

      const rows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      setReports(rows);
    } catch (err: any) {
      setError(err?.message || "Could not load your reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReports();
    }, [loadReports])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const formatDate = (value: string | null) => {
    if (!value) return "";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString();
  };

  // Completed and rejected reports are shown in Report History instead.
  const activeReports = reports.filter((report) => {
    const status = report.status.toLowerCase().replaceAll(" ", "_");
    return status !== "completed" && status !== "rejected";
  });

  return (
    <Page>
      <ReportsHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.maroon}
            colors={[COLORS.maroon]}
          />
        }
      >
        <Card>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.maroon} />
              <Text style={styles.loadingText}>
                Loading your reports...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>

              <Text
                onPress={() => {
                  setLoading(true);
                  loadReports();
                }}
                style={styles.tryAgainText}
                accessibilityRole="button"
              >
                Try again
              </Text>
            </View>
          ) : activeReports.length === 0 ? (
            <Item
              title="No active reports"
              meta="Completed and rejected reports can be found in Report History."
            />
          ) : (
            activeReports.map((report) => {
              const location = [
                report.building_name,
                report.room_name,
              ]
                .filter(Boolean)
                .join(" / ");

              const meta = [
                report.report_number,
                location,
                formatDate(report.created_at),
              ]
                .filter(Boolean)
                .join(" · ");

              const normalizedStatus = report.status
                .toLowerCase()
                .replaceAll(" ", "_");

              return (
                <Item
                  key={report.id}
                  title={report.title || "Damage report"}
                  meta={meta}
                  status={
                    STATUS_LABELS[normalizedStatus] ||
                    report.status.replaceAll("_", " ").toUpperCase()
                  }
                  onPress={() =>
                    router.push({
                      pathname: "/user/report-details",
                      params: {
                        id: String(report.id),
                        returnTo: "/user/user-reports",
                      },
                    } as any)
                  }
                />
              );
            })
          )}
        </Card>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 16,
  },

  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  backButtonPressed: {
    opacity: 0.8,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 38,
    lineHeight: 42,
    marginTop: -4,
    fontWeight: "400",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 3,
  },

  loadingContainer: {
    padding: 24,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 8,
    color: COLORS.textSecondary,
  },

  errorContainer: {
    padding: 16,
  },

  errorText: {
    color: "#B42318",
  },

  tryAgainText: {
    color: COLORS.maroon,
    fontWeight: "700",
    marginTop: 12,
  },
});