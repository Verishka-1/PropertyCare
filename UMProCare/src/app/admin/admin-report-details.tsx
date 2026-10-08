import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { C } from "../../constants/palette";
import { apiRequest, getStorageUrl } from "../../services/api";
import PhotoViewer from "../../components/PhotoViewer";

type Status =
  | "pending"
  | "verified"
  | "in_progress"
  | "completed"
  | "rejected";

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending: {
    label: "PENDING",
    color: "#9A6200",
  },

  verified: {
    label: "ACCEPTED",
    color: "#245A91",
  },

  in_progress: {
    label: "UNDER REPAIR",
    color: "#6B3FA0",
  },

  completed: {
    label: "COMPLETED",
    color: "#247A50",
  },

  rejected: {
    label: "REJECTED",
    color: "#B00020",
  },
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
  const params = useLocalSearchParams<{
    id?: string;
    reportId?: string;
  }>();

  const id = params.id ?? params.reportId;

  const [report, setReport] =
    useState<ReportDetails | null>(null);

  const [loading, setLoading] = useState(true);

  const [savingStatus, setSavingStatus] =
    useState("");

  const [error, setError] = useState("");

  // index of the photo opened in the full-screen viewer (null = closed)
  const [viewerIndex, setViewerIndex] =
    useState<number | null>(null);

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
    status:
      | "verified"
      | "in_progress"
      | "completed"
      | "rejected"
  ) => {
    const actionLabels = {
      verified: "accept this report",
      in_progress: "start the repair for this report",
      completed: "mark this repair as completed",
      rejected: "reject this report",
    };

    const successMessages = {
      verified:
        "The report was accepted. The user has been notified.",
      in_progress:
        "Repair started. The user has been notified.",
      completed:
        "Repair completed. The user has been notified.",
      rejected:
        "The report was rejected. The user has been notified.",
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
                successMessages[status]
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Report Details
            </Text>

            <Text style={styles.subtitle}>
              Loading report...
            </Text>
          </View>
        </View>

        <View style={styles.centerContent}>
          <ActivityIndicator
            size="large"
            color={C.maroon}
          />

          <Text style={styles.loadingText}>
            Loading report details...
          </Text>
        </View>
      </View>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error || !report) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Report Details
            </Text>

            <Text style={styles.subtitle}>
              Unable to display report
            </Text>
          </View>
        </View>

        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>
            Could not load report
          </Text>

          <Text style={styles.errorMessage}>
            {error ||
              "The requested report was not found."}
          </Text>

          <Pressable
            onPress={loadReport}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>
              Try Again
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const reportDate = report.created_at
    ? new Date(
        report.created_at
      ).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Date unavailable";

  const statusInfo =
    STATUS_INFO[report.status] ?? {
      label: report.status
        .replaceAll("_", " ")
        .toUpperCase(),
      color: C.maroon,
    };

  const currentStatus =
    report.status as Status;

  const actionDisabled =
    savingStatus !== "";

  const isCompleted =
    currentStatus === "completed";

  const isRejected =
    currentStatus === "rejected";

  /* =========================================================
     MAIN SCREEN
  ========================================================= */

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Report Details
            </Text>

            <Text style={styles.subtitle}>
              {report.report_number}
            </Text>
          </View>
        </View>

        {/* =====================================================
            REPORT INFORMATION
        ===================================================== */}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            REPORT INFORMATION
          </Text>

          <View style={styles.titleRow}>
            <Text style={styles.reportTitle}>
              {report.title}
            </Text>

            <View
              style={[
                styles.statusBadge,
                currentStatus === "completed" &&
                  styles.completedBadge,
                currentStatus === "rejected" &&
                  styles.rejectedBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      currentStatus === "completed"
                        ? "#18794E"
                        : currentStatus === "rejected"
                        ? "#B42318"
                        : statusInfo.color,
                  },
                ]}
              >
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {/* LOCATION */}

          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>
              Location
            </Text>

            <Text style={styles.locationText}>
              {report.building_name}
              {report.room_name
                ? ` • ${report.room_name}`
                : ""}
            </Text>
          </View>

          {/* DESCRIPTION */}

          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionLabel}>
              Description
            </Text>

            <Text style={styles.descriptionText}>
              {report.description}
            </Text>
          </View>

          {/* PHOTOS */}

          <Text style={styles.photoLabel}>
            Photos
          </Text>

          {report.photos &&
          report.photos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.photoContent
              }
            >
              {report.photos.map((photo, photoIndex) => (
                <Pressable
                  key={photo.id}
                  onPress={() => setViewerIndex(photoIndex)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Open photo ${photoIndex + 1} full screen`}
                  style={({ pressed }) =>
                    pressed && { opacity: 0.8 }
                  }
                >
                  <Image
                    source={{
                      uri: getStorageUrl(photo.url),
                    }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noPhotoBox}>
              <Text style={styles.noPhotoText}>
                No photo attached to this report
              </Text>
            </View>
          )}

          {report.photos &&
          report.photos.length > 0 ? (
            <Text style={styles.photoHint}>
              Tap a photo to view it full screen
            </Text>
          ) : null}

          {/* REPORTER */}

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>
            REPORTER
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Name
            </Text>

            <Text style={styles.detailValue}>
              {report.user?.name ??
                "Unknown user"}
            </Text>
          </View>

          {report.user?.email ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Email
              </Text>

              <Text style={styles.detailValue}>
                {report.user.email}
              </Text>
            </View>
          ) : null}

          {report.user?.contact_number ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Contact
              </Text>

              <Text style={styles.detailValue}>
                {report.user.contact_number}
              </Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Date submitted
            </Text>

            <Text style={styles.detailValue}>
              {reportDate}
            </Text>
          </View>

          {report.priority ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Priority
              </Text>

              <Text style={styles.detailValue}>
                {report.priority.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* =====================================================
            ADMIN ACTIONS
        ===================================================== */}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            ADMIN ACTIONS
          </Text>

          <Text style={styles.actionTitle}>
            Manage report status
          </Text>

          <Text style={styles.actionSubtitle}>
            Update the status as the report moves
            through the repair process.
          </Text>

          {/* PENDING */}

          {currentStatus === "pending" ? (
            <View style={styles.actionGroup}>
              <Pressable
                disabled={actionDisabled}
                onPress={() => {
                  if (!actionDisabled) {
                    updateStatus("verified");
                  }
                }}
                style={[
                  styles.primaryButton,
                  actionDisabled &&
                    styles.disabledButton,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {savingStatus === "verified"
                    ? "Accepting..."
                    : "Accept report"}
                </Text>
              </Pressable>

              <View style={styles.buttonGap} />

              <Pressable
                disabled={actionDisabled}
                onPress={() => {
                  if (!actionDisabled) {
                    updateStatus("rejected");
                  }
                }}
                style={[
                  styles.outlineButton,
                  actionDisabled &&
                    styles.disabledOutlineButton,
                ]}
              >
                <Text style={styles.outlineButtonText}>
                  {savingStatus === "rejected"
                    ? "Rejecting..."
                    : "Reject report"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* VERIFIED */}

          {currentStatus === "verified" ? (
            <View style={styles.actionGroup}>
              <Pressable
                disabled={actionDisabled}
                onPress={() => {
                  if (!actionDisabled) {
                    updateStatus("in_progress");
                  }
                }}
                style={[
                  styles.primaryButton,
                  actionDisabled &&
                    styles.disabledButton,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {savingStatus === "in_progress"
                    ? "Starting repair..."
                    : "Start repair"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* IN PROGRESS */}

          {currentStatus === "in_progress" ? (
            <View style={styles.actionGroup}>
              <Pressable
                disabled={actionDisabled}
                onPress={() => {
                  if (!actionDisabled) {
                    updateStatus("completed");
                  }
                }}
                style={[
                  styles.primaryButton,
                  actionDisabled &&
                    styles.disabledButton,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {savingStatus === "completed"
                    ? "Updating..."
                    : "Mark as complete"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* FINISHED */}

          {isCompleted || isRejected ? (
            <View
              style={[
                styles.finishedBox,
                isRejected &&
                  styles.rejectedFinishedBox,
              ]}
            >
              <Text
                style={[
                  styles.finishedText,
                  isRejected &&
                    styles.rejectedFinishedText,
                ]}
              >
                {isCompleted
                  ? "This repair is complete. The report is saved in Report History."
                  : "This report was rejected. No further action is needed."}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Full-screen photo viewer (opens when a photo is tapped) */}
      <PhotoViewer
        photos={(report.photos ?? []).map((photo) =>
          getStorageUrl(photo.url)
        )}
        index={viewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* =========================================================
     CONTAINER
  ========================================================= */

  container: {
    flex: 1,
    backgroundColor: "#F7EEF1",
  },

  content: {
    paddingBottom: 30,
  },

  /* =========================================================
     HEADER
     Matches Admin Report History
  ========================================================= */

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E8DDE1",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 32,
    marginTop: -3,
  },

  headerText: {
    flex: 1,
  },

  title: {
    color: C.maroon,
    fontSize: 20,
    fontWeight: "800",
  },

  subtitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 3,
  },

  /* =========================================================
     CARD
     Matches History report cards
  ========================================================= */

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E6DDE0",
  },

  /* =========================================================
     SECTION
  ========================================================= */

  sectionLabel: {
    color: C.maroon,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  /* =========================================================
     TITLE + STATUS
  ========================================================= */

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  reportTitle: {
    flex: 1,
    color: C.ink,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#F2F2F2",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  completedBadge: {
    backgroundColor: "#E8F7EE",
  },

  rejectedBadge: {
    backgroundColor: "#FDECEC",
  },

  /* =========================================================
     LOCATION
  ========================================================= */

  locationContainer: {
    marginTop: 14,
    marginBottom: 8,
  },

  locationLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 3,
  },

  locationText: {
    color: C.ink,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },

  /* =========================================================
     DESCRIPTION
  ========================================================= */

  descriptionBox: {
    backgroundColor: "#F8F3F5",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#EEE3E6",
  },

  descriptionLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 5,
  },

  descriptionText: {
    color: C.ink,
    fontSize: 13,
    lineHeight: 20,
  },

  /* =========================================================
     PHOTOS
  ========================================================= */

  photoLabel: {
    color: C.ink,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 9,
  },

  photoContent: {
    paddingRight: 3,
  },

  photo: {
    width: 160,
    height: 125,
    borderRadius: 10,
    marginRight: 9,
    backgroundColor: "#F1ECEE",
  },

  noPhotoBox: {
    height: 90,
    backgroundColor: "#F8F3F5",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8DDE1",
  },

  noPhotoText: {
    color: C.muted,
    fontSize: 12,
  },

  photoHint: {
    color: C.muted,
    fontSize: 11,
    marginTop: 6,
  },

  /* =========================================================
     REPORTER
  ========================================================= */

  divider: {
    height: 1,
    backgroundColor: "#E8DDE1",
    marginVertical: 20,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EAEC",
  },

  detailLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "600",
    flex: 0.8,
  },

  detailValue: {
    color: C.ink,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    flex: 1.4,
    lineHeight: 18,
  },

  /* =========================================================
     ADMIN ACTIONS
  ========================================================= */

  actionTitle: {
    color: C.ink,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 5,
  },

  actionSubtitle: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
  },

  actionGroup: {
    width: "100%",
  },

  primaryButton: {
    backgroundColor: C.maroon,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  outlineButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: C.maroon,
    backgroundColor: "#FFFFFF",
  },

  outlineButtonText: {
    color: C.maroon,
    fontSize: 12,
    fontWeight: "800",
  },

  buttonGap: {
    height: 9,
  },

  disabledButton: {
    opacity: 0.55,
  },

  disabledOutlineButton: {
    opacity: 0.55,
  },

  finishedBox: {
    marginTop: 2,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#E8F7EE",
  },

  finishedText: {
    color: "#18794E",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "600",
  },

  rejectedFinishedBox: {
    backgroundColor: "#FDECEC",
  },

  rejectedFinishedText: {
    color: "#B42318",
  },

  /* =========================================================
     LOADING
  ========================================================= */

  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  loadingText: {
    color: C.muted,
    fontSize: 13,
    marginTop: 12,
  },

  /* =========================================================
     ERROR
  ========================================================= */

  errorCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E6DDE0",
  },

  errorTitle: {
    color: C.maroon,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 7,
  },

  errorMessage: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },

  retryButton: {
    backgroundColor: C.maroon,
    minHeight: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});