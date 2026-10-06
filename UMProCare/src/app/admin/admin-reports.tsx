import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { router } from "expo-router";

import { C } from "../../constants/palette";
import { Page, Header, Card, Item, Button } from "../../components/Kit";
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
      <Header
        title="Submitted reports"
        sub="Review and update reported issues"
        back
      />

      <Card>
        <Button
          title={loading ? "Loading..." : "Refresh reports"}
          outline
          onPress={loadReports}
        />

        {loading ? (
          <ActivityIndicator
            color={C.maroon}
            style={{ marginVertical: 18 }}
          />
        ) : error ? (
          <>
            <Text style={{ color: C.maroon, fontWeight: "800" }}>
              Could not load reports
            </Text>
            <Text style={{ color: C.muted }}>{error}</Text>
            <Button title="Try again" onPress={loadReports} />
          </>
        ) : reports.length === 0 ? (
          <Text style={{ color: C.muted, textAlign: "center", padding: 12 }}>
            No reports have been submitted yet.
          </Text>
        ) : (
          reports.map((report) => (
            <Item
              key={report.id}
              title={report.title}
              meta={`${report.report_number} · ${report.building_name}${
                report.room_name ? ` / ${report.room_name}` : ""
              }`}
              status={report.status.replaceAll("_", " ").toUpperCase()}
              onPress={() => openReport(report.id)}
            />
          ))
        )}
      </Card>
    </Page>
  );
}