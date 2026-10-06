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

import { C } from "../../constants/palette";
import { Page, Card, Item } from "../../components/Kit";
import { apiRequest } from "../../services/api";

type Report = {
  id: number;
  report_number: string;
  title: string | null;
  building_name: string | null;
  room_name: string | null;
  status: string;
  created_at: string | null;
};

function getReportTitle(title: string | null | undefined) {
  const cleanTitle = title?.trim();

  if (
    !cleanTitle ||
    cleanTitle.toLowerCase() === "unspecified property"
  ) {
    return "Reported damage";
  }

  return cleanTitle;
}

function HistoryHeader() {
  const handleBack = () => {
    router.replace("/user/user-dashboard" as any);
  };

  return (
    <View style={styles.header}>
      <Pressable
        onPress={handleBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back to home"
        hitSlop={8}
      >
        <Text style={styles.backButtonText}>‹</Text>
      </Pressable>

      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>
          Report history
        </Text>

        <Text style={styles.headerSubtitle}>
          Closed and resolved reports
        </Text>
      </View>
    </View>
  );
}

export default function History() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    setError("");

    try {
      const response = await apiRequest("/my/reports/history");

      const rows = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setReports(rows);
    } catch (err: any) {
      setError(err?.message || "Could not load report history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadHistory();
    }, [loadHistory])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const formatDate = (value: string | null) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString();
  };

  return (
    <Page>
      <HistoryHeader />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <Card>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={C.maroon} />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Item
                title="Unable to load history"
                meta={error}
              />
              <Item
                title="Try again"
                meta="Tap to reload your report history"
                onPress={loadHistory}
              />
            </View>
          ) : reports.length === 0 ? (
            <Item
              title="No completed reports yet"
              meta="Your closed and resolved reports will appear here."
            />
          ) : (
            reports.map((report) => {
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

              return (
                <Item
                  key={report.id}
                  title={getReportTitle(report.title)}
                  meta={meta}
                  status={(report.status || "").toUpperCase()}
                  onPress={() =>
                    router.push({
                      pathname: "/user/report-details",
                      params: {
                        id: String(report.id),
                        returnTo: "/user/report-history",
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
    backgroundColor: C.maroon,
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
    color: C.ink,
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: C.muted,
    fontSize: 14,
    marginTop: 3,
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
  },
  errorContainer: {
    padding: 16,
  },
});