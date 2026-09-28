import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, router } from "expo-router";

import { Page, Header, Card, Item } from "../../components/Kit";
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
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  return (
    <Page>
      <Header
        title="My reports"
        sub="Follow the progress of your reports"
        back
      />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card>
          {loading ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <ActivityIndicator color={COLORS.maroon} />
              <Text style={{ marginTop: 8, color: COLORS.textSecondary }}>
                Loading your reports...
              </Text>
            </View>
          ) : error ? (
            <View style={{ padding: 16 }}>
              <Text style={{ color: "#B42318" }}>{error}</Text>
              <Text
                onPress={loadReports}
                style={{
                  color: COLORS.maroon,
                  fontWeight: "700",
                  marginTop: 12,
                }}
              >
                Try again
              </Text>
            </View>
          ) : reports.length === 0 ? (
            <Item
              title="No reports yet"
              meta="Your submitted reports will appear here."
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
                  title={report.title || "Damage report"}
                  meta={meta}
                  status={
                    STATUS_LABELS[report.status] ||
                    report.status.replaceAll("_", " ").toUpperCase()
                  }
                  onPress={() =>
                    router.push({
                      pathname: "/user/report-details",
                      params: { id: String(report.id) },
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