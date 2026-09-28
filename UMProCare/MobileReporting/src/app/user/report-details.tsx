import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { C } from "../../constants/palette";
import { Page, Header, Card, Pill, Button } from "../../components/Kit";
import { getMyReportDetail } from "../../services/api";

type Photo = { id: number; url: string };

type RepairUpdate = {
  id: number;
  status: string;
  notes: string | null;
  created_at: string;
};

type ReportDetail = {
  id: number;
  report_number: string;
  title: string;
  description: string;
  building_name: string;
  room_name: string | null;
  status: string;
  priority?: string;
  created_at: string;
  photos: Photo[];
  repairUpdates: RepairUpdate[];
};

const STATUS_LABELS: Record<string, string> = {
  pending: "PENDING",
  verified: "IN PROGRESS",
  in_progress: "IN PROGRESS",
  completed: "COMPLETED",
  rejected: "REJECTED",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "#247A50",
  verified: "#245A91",
  in_progress: "#245A91",
  rejected: "#B00020",
};

// The order a report normally moves through, used to draw the
// progress timeline (skips "rejected", which is a dead end shown
// separately).
const PROGRESS_STEPS = [
  { key: "pending", label: "Submitted" },
  { key: "verified", label: "Accepted / In progress" },
  { key: "completed", label: "Repaired" },
];

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    if (!id) {
      setError("No report was specified.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await getMyReportDetail(id);
      setReport(data);
    } catch (err: any) {
      setError(err?.message || "Could not load this report.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (loading) {
    return (
      <Page>
        <Header title="Report details" sub="Loading..." back />
        <Card>
          <ActivityIndicator color={C.maroon} />
        </Card>
      </Page>
    );
  }

  if (error || !report) {
    return (
      <Page>
        <Header title="Report details" sub="Unable to load report" back />
        <Card>
          <Text style={{ color: "#B00020" }}>{error || "Report not found."}</Text>
          <Button title="Try again" outline onPress={loadReport} />
        </Card>
      </Page>
    );
  }

  const currentStepIndex =
    report.status === "rejected"
      ? -1
      : PROGRESS_STEPS.findIndex((step) => step.key === report.status);

  return (
    <Page>
      <Header title={report.report_number} sub="Track your report" back />

      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: C.ink, flex: 1 }}>
            {report.building_name}
            {report.room_name ? ` · ${report.room_name}` : ""}
          </Text>
          <Pill color={STATUS_COLORS[report.status] ?? C.maroon}>
            {STATUS_LABELS[report.status] ?? report.status}
          </Pill>
        </View>

        <Text style={{ color: C.ink, lineHeight: 20 }}>{report.description}</Text>

        <Text style={{ color: C.muted, fontSize: 12 }}>
          Submitted {new Date(report.created_at).toLocaleDateString()}
        </Text>
      </Card>

      {report.photos?.length > 0 && (
        <Card>
          <Text style={{ fontWeight: "800", color: C.ink }}>Photos submitted</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 10 }}>
            {report.photos.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: photo.url }}
                style={{ width: 140, height: 140, borderRadius: 10, marginRight: 10, backgroundColor: "#F0ECEE" }}
              />
            ))}
          </ScrollView>
        </Card>
      )}

      <Card>
        <Text style={{ fontWeight: "800", color: C.ink }}>Progress</Text>

        {report.status === "rejected" ? (
          <Text style={{ color: "#B00020" }}>
            This report was reviewed and could not be accepted.
          </Text>
        ) : (
          PROGRESS_STEPS.map((step, index) => {
            const reached = currentStepIndex >= index;
            return (
              <View key={step.key} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: reached ? C.maroon : "#E5DCE0",
                  }}
                />
                <Text style={{ color: reached ? C.ink : C.muted, fontWeight: reached ? "700" : "400" }}>
                  {step.label}
                </Text>
              </View>
            );
          })
        )}
      </Card>

      {report.repairUpdates?.length > 0 && (
        <Card>
          <Text style={{ fontWeight: "800", color: C.ink }}>Updates</Text>
          {report.repairUpdates.map((update) => (
            <View key={update.id} style={{ borderBottomWidth: 1, borderBottomColor: "#F0EAED", paddingVertical: 8 }}>
              <Text style={{ fontWeight: "700", color: C.ink }}>
                {STATUS_LABELS[update.status] ?? update.status}
              </Text>
              {update.notes ? <Text style={{ color: C.muted }}>{update.notes}</Text> : null}
              <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                {new Date(update.created_at).toLocaleString()}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </Page>
  );
}
