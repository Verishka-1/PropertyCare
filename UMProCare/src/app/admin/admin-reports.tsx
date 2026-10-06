import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { C } from "../../constants/palette";
import { Page, Card, Item, Button } from "../../components/Kit";
import { apiRequest } from "../../services/api";

type Report = {
  id: number;
  report_number: string;
  title: string;
  building_name: string;
  room_name: string | null;
  status: string;
};

type ReportsResponse = {
  data: Report[];
};

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = (await apiRequest(
        "/admin/reports"
      )) as ReportsResponse | Report[];

      const rows = Array.isArray(result) ? result : result?.data;

      if (!Array.isArray(rows)) {
        throw new Error("The reports API returned an unexpected response.");
      }

      setReports(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load submitted reports."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const openReport = (reportId: number) => {
    router.push({
      pathname: "/admin/admin-report-details",
      params: { id: String(reportId) },
    } as any);
  };

  return (
    <Page>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Submitted reports</Text>
          <Text style={styles.headerSubtitle}>
            Review and update reported issues
          </Text>
        </View>

        <Pressable
          onPress={loadReports}
          disabled={loading}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.pressed,
            loading && styles.disabledButton,
          ]}
        >
          <Text style={styles.refreshText}>
            {loading ? "..." : "Refresh"}
          </Text>
        </Pressable>
      </View>

      {/* Reports Card */}
      <Card>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>All Reports</Text>
            <Text style={styles.sectionSubtitle}>
              {reports.length} submitted{" "}
              {reports.length === 1 ? "report" : "reports"}
            </Text>
          </View>

          {!loading && !error && reports.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{reports.length}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={C.maroon} size="small" />

            <Text style={styles.loadingText}>
              Loading submitted reports...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorAccent} />

            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                Could not load reports
              </Text>

              <Text style={styles.errorText}>{error}</Text>

              <Button
                title="Try again"
                onPress={loadReports}
              />
            </View>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyBadge}>
              <Text style={styles.emptyBadgeText}>0</Text>
            </View>

            <Text style={styles.emptyTitle}>
              No submitted reports
            </Text>

            <Text style={styles.emptyText}>
              No reports have been submitted yet.
            </Text>
          </View>
        ) : (
          <View style={styles.reportList}>
            {reports.map((report) => (
              <Item
                key={report.id}
                title={report.title}
                meta={`${report.report_number} · ${report.building_name}${
                  report.room_name ? ` / ${report.room_name}` : ""
                }`}
                status={report.status
                  .replaceAll("_", " ")
                  .toUpperCase()}
                onPress={() => openReport(report.id)}
              />
            ))}
          </View>
        )}
      </Card>

      {/* Footer Information */}
      {!loading && !error && reports.length > 0 && (
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Report Management</Text>
          <Text style={styles.footerText}>
            Select a report to view its details and update its status.
          </Text>
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  /* =========================
     HEADER
  ========================= */

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 20,
  },

  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "400",
    marginTop: -3,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: C.text,
    fontSize: 22,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: C.muted,
    fontSize: 13,
    marginTop: 4,
  },

  refreshButton: {
    backgroundColor: C.maroon,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },

  refreshText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.72,
  },

  disabledButton: {
    opacity: 0.5,
  },

  /* =========================
     SECTION
  ========================= */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitleContainer: {
    flex: 1,
  },

  sectionTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: "700",
  },

  sectionSubtitle: {
    color: C.muted,
    fontSize: 13,
    marginTop: 4,
  },

  countBadge: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 19,
    backgroundColor: C.lighterMaroon,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  countText: {
    color: C.maroon,
    fontSize: 14,
    fontWeight: "800",
  },

  /* =========================
     REPORT LIST
  ========================= */

  reportList: {
    marginTop: 2,
  },

  /* =========================
     LOADING
  ========================= */

  loadingContainer: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 25,
  },

  loadingText: {
    color: C.muted,
    fontSize: 14,
    marginTop: 10,
  },

  /* =========================
     ERROR
  ========================= */

  errorContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },

  errorAccent: {
    width: 5,
    backgroundColor: C.maroon,
  },

  errorContent: {
    flex: 1,
    padding: 16,
  },

  errorTitle: {
    color: C.maroon,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 5,
  },

  errorText: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },

  /* =========================
     EMPTY
  ========================= */

  emptyContainer: {
    minHeight: 190,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 25,
  },

  emptyBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.lighterMaroon,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyBadgeText: {
    color: C.maroon,
    fontSize: 17,
    fontWeight: "800",
  },

  emptyTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },

  emptyText: {
    color: C.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  /* =========================
     FOOTER
  ========================= */

  footerCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    paddingHorizontal: 17,
    paddingVertical: 15,
    marginTop: 16,
    borderWidth: 1,
    borderColor: C.border,
  },

  footerTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },

  footerText: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});