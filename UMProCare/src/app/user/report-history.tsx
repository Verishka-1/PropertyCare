import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Page, Header, Card, Item } from "../../components/Kit";
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
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  return (
    <Page>
      <Header title="Report history" sub="Closed and resolved reports" back />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card>
          {loading ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <ActivityIndicator />
            </View>
          ) : error ? (
            <View style={{ padding: 16 }}>
              <Item title="Unable to load history" meta={error} />
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
                  title={report.title || "Damage report"}
                  meta={meta}
                  status={report.status.toUpperCase()}
                />
              );
            })
          )}
        </Card>
      </ScrollView>
    </Page>
  );
}