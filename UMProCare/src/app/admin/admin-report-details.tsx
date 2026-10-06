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
import { apiRequest, getStorageUrl } from "../../services/api";

type Status =
  | "pending"
  | "verified"
  | "in_progress"
  | "completed"
  | "rejected";

/** Friendly names + colours shown on the status badge. */
const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending: { label: "PENDING", color: "#9A6200" },
  verified: { label: "ACCEPTED", color: "#245A91" },
  in_progress: { label: "UNDER REPAIR", color: "#6B3FA0" },
  completed: { label: "COMPLETED", color: "#247A50" },
  rejected: { label: "REJECTED", color: "#B00020" },
};

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
    contact_number?: string | null;
  } | null;
};

export default function AdminReportDetails() {
  const params = useLocalSearchParams<{ id?: string; reportId?: string }>();

  // "id" is what every screen sends; "reportId" is accepted as a fallback.
  const id = params.id ?? params.reportId;

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
    status: "verified" | "in_progress" | "completed" | "rejected"
  ) => {
    const actionLabels = {
      verified: "accept this report",
      in_progress: "start the repair for this report",
      completed: "mark this repair as completed",
      rejected: "reject this report",
    };

    const successMessages = {
      verified: "The report was accepted. The user has been notified.",
      in_progress: "Repair started. The user has been notified.",
      completed: "Repair completed. The user has been notified.",
      rejected: "The report was rejected. The user has been notified.",
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

              Alert.alert("Updated", successMessages[status]);
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

  const statusInfo = STATUS_INFO[report.status] ?? {
    label: report.status.replaceAll("_", " ").toUpperCase(),
    color: C.maroon,
  };

  const currentStatus = report.status as Status;

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

          <Pill color={statusInfo.color}>{statusInfo.label}</Pill>
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
                source={{ uri: getStorageUrl(photo.url) }}
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

        {report.user?.contact_number ? (
          <Text
            style={{
              color: C.muted,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Contact: {report.user.contact_number}
          </Text>
        ) : null}

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

        {/* Step 1 - a NEW report: accept it or reject it */}
        {currentStatus === "pending" ? (
          <>
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
          </>
        ) : null}

        {/* Step 2 - an ACCEPTED report: start the repair */}
        {currentStatus === "verified" ? (
          <Button
            title={
              savingStatus === "in_progress"
                ? "Starting repair..."
                : "Start repair"
            }
            onPress={() => {
              if (!actionDisabled) {
                updateStatus("in_progress");
              }
            }}
          />
        ) : null}

        {/* Step 3 - a report UNDER REPAIR: mark it complete */}
        {currentStatus === "in_progress" ? (
          <Button
            title={
              savingStatus === "completed"
                ? "Updating..."
                : "Mark as complete"
            }
            onPress={() => {
              if (!actionDisabled) {
                updateStatus("completed");
              }
            }}
          />
        ) : null}

        {/* Finished reports have no more actions */}
        {currentStatus === "completed" || currentStatus === "rejected" ? (
          <Text style={{ color: C.muted, lineHeight: 20 }}>
            {currentStatus === "completed"
              ? "This repair is complete. The report is saved in Report History."
              : "This report was rejected. No further action is needed."}
          </Text>
        ) : null}
      </Card>
    </Page>
  );
}