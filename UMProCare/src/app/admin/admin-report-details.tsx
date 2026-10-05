import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import { C } from "../../constants/palette";
import { Page, Header, Card, Button, Pill } from "../../components/Kit";
import { apiRequest } from "../../services/api";

type Photo = {
  id: number;
  url: string;
};

type ReportDetails = {
  id: number;
  report_number: string;
  title: string;
  description: string;
  building_name: string;
  room_name: string | null;
  status: string;
  priority?: string;
  created_at: string;
  photos?: Photo[];
  user?: {
    name?: string;
    email?: string;
  } | null;
};

export default function AdminReportDetails() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState("");
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    if (!id) {
      setError(
        "No report ID was provided. Open this page from the report list."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await apiRequest(
        `/admin/reports/${encodeURIComponent(id)}`
      );

      setReport(result?.data ?? result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load report details."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const updateStatus = (
    status: "verified" | "rejected" | "completed"
  ) => {
    const actionLabels = {
      verified: "accept this report",
      rejected: "reject this report",
      completed: "mark this repair as completed",
    };

    Alert.alert(
      "Confirm action",
      `Are you sure you want to ${actionLabels[status]}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: async () => {
            if (!report) return;

            try {
              setSavingStatus(status);

              const result = await apiRequest(
                `/admin/reports/${report.id}`,
                {
                  method: "PATCH",
                  body: JSON.stringify({ status }),
                }
              );

              const updated = result?.data ?? result;

              setReport((current) =>
                current
                  ? { ...current, ...updated }
                  : updated
              );

              Alert.alert(
                "Updated",
                "The report status has been updated."
              );
            } catch (err) {
              Alert.alert(
                "Update failed",
                err instanceof Error
                  ? err.message
                  : "Could not update the report."
              );
            } finally {
              setSavingStatus("");
            }
          },
        },
      ]
    );
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <Page>
        <View style={{ paddingTop: 12 }}>
          <Header
            title="Report details"
            sub="Loading report..."
            back
          />
        </View>

        <Card>
          <ActivityIndicator color={C.maroon} />

          <Text
            style={{
              textAlign: "center",
              color: C.muted,
              marginTop: 8,
            }}
          >
            Loading report details...
          </Text>
        </Card>
      </Page>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error || !report) {
    return (
      <Page>
        <View style={{ paddingTop: 12 }}>
          <Header
            title="Report details"
            sub="Unable to display report"
            back
          />
        </View>

        <Card>
          <Text
            style={{
              color: C.maroon,
              fontWeight: "800",
              fontSize: 16,
            }}
          >
            Could not load report
          </Text>

          <Text
            style={{
              color: C.muted,
              marginTop: 6,
              lineHeight: 20,
            }}
          >
            {error || "The requested report was not found."}
          </Text>

          <Button
            title="Try again"
            outline
            onPress={loadReport}
          />
        </Card>
      </Page>
    );
  }

  /* =========================================================
     REPORT DATA
  ========================================================= */

  const reportDate = report.created_at
    ? new Date(report.created_at).toLocaleDateString()
    : "Date unavailable";

  const statusLabel = report.status
    .replaceAll("_", " ")
    .toUpperCase();

  const actionDisabled = savingStatus !== "";

  /* =========================================================
     MAIN SCREEN
  ========================================================= */

  return (
    <Page>

      {/* Slightly lower, matching the user report details */}
      <View style={{ paddingTop: 12 }}>
        <Header
          title="Report details"
          sub={report.report_number}
          back
        />
      </View>

      {/* =====================================================
          REPORT INFORMATION
      ===================================================== */}

      <Card>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "800",
              color: C.ink,
              flex: 1,
            }}
          >
            {report.title}
          </Text>

          <Pill>{statusLabel}</Pill>
        </View>

        <Text
          style={{
            color: C.muted,
            marginTop: 4,
          }}
        >
          {report.building_name}
          {report.room_name
            ? ` · ${report.room_name}`
            : ""}
        </Text>

        <Text
          style={{
            color: C.ink,
            lineHeight: 21,
            marginTop: 8,
          }}
        >
          {report.description}
        </Text>

        {/* =================================================
            PHOTOS
        ================================================= */}

        {report.photos && report.photos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }}
          >
            {report.photos.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: photo.url }}
                style={{
                  width: 160,
                  height: 140,
                  borderRadius: 10,
                  marginRight: 10,
                  backgroundColor: "#F0ECEE",
                }}
              />
            ))}
          </ScrollView>
        ) : (
          <View
            style={{
              height: 140,
              backgroundColor: "#F0ECEE",
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 12,
            }}
          >
            <Text style={{ color: C.muted }}>
              No photo attached to this report
            </Text>
          </View>
        )}

        {/* =================================================
            REPORTER
        ================================================= */}

        <Text
          style={{
            color: C.muted,
            fontSize: 12,
            marginTop: 12,
          }}
        >
          Reporter: {report.user?.name ?? "Unknown user"} ·{" "}
          {reportDate}
        </Text>

        {report.priority ? (
          <Text
            style={{
              color: C.muted,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Priority: {report.priority.toUpperCase()}
          </Text>
        ) : null}
      </Card>

      {/* =====================================================
          ADMIN ACTIONS
      ===================================================== */}

      <Card>
        <Text
          style={{
            fontWeight: "800",
            color: C.ink,
            fontSize: 16,
            marginBottom: 4,
          }}
        >
          Admin actions
        </Text>

        <Button
          title={
            savingStatus === "verified"
              ? "Accepting..."
              : "Accept report"
          }
          onPress={() => {
            if (!actionDisabled) {
              updateStatus("verified");
            }
          }}
        />

        <Button
          title={
            savingStatus === "rejected"
              ? "Rejecting..."
              : "Reject report"
          }
          outline
          onPress={() => {
            if (!actionDisabled) {
              updateStatus("rejected");
            }
          }}
        />

        <Button
          title={
            savingStatus === "completed"
              ? "Updating..."
              : "Confirm repair completed"
          }
          outline
          onPress={() => {
            if (!actionDisabled) {
              updateStatus("completed");
            }
          }}
        />
      </Card>
    </Page>
  );
}