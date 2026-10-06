import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import {
  COLORS,
  Spacing,
} from "../../constants/theme";

import { apiRequest } from "../../services/api";

type Report = {
  id: number;
  report_number?: string | null;
  property_name?: string | null;
  description?: string | null;
  building_name?: string | null;
  room_name?: string | null;
  status?: string | null;
  priority?: string | null;
  reported_at?: string | null;
  created_at?: string | null;
};

type RoomReportsResponse = {
  data?: Report[];
  message?: string;
};

function formatStatus(status?: string | null) {
  if (!status) {
    return "Pending";
  }

  if (status === "verified") {
    return "Accepted";
  }

  if (status === "in_progress") {
    return "Under Repair";
  }

  return status
    .replace(/[\_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatPriority(
  priority?: string | null
) {
  if (!priority) {
    return "Normal";
  }

  return priority
    .replace(/[\_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function AdminRoomReportsScreen() {
  const {
    building,
    buildingName,
    room,
    location,
  } = useLocalSearchParams<{
    building?: string;
    buildingName?: string;
    room?: string;
    location?: string;
  }>();

  const selectedBuilding =
    Array.isArray(building)
      ? building[0]
      : building;

  const selectedBuildingName =
    Array.isArray(buildingName)
      ? buildingName[0]
      : buildingName;

  const selectedRoom =
    Array.isArray(room)
      ? room[0]
      : room;

  const selectedLocation =
    Array.isArray(location)
      ? location[0]
      : location;

  /*
   * Prefer the room parameter.
   * Fall back to location for compatibility.
   */
  const roomName =
    selectedRoom ||
    selectedLocation ||
    "";

  const [
    reports,
    setReports,
  ] = useState<Report[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * Load REAL reports from Laravel.
   */
  const loadReports =
    useCallback(async () => {
      if (!selectedBuilding) {
        setError(
          "Building information is missing."
        );

        setLoading(false);
        setRefreshing(false);

        return;
      }

      if (!roomName) {
        setError(
          "Room information is missing."
        );

        setLoading(false);
        setRefreshing(false);

        return;
      }

      try {
        setError("");

        const queryBuilding =
          encodeURIComponent(
            selectedBuilding
          );

        const queryRoom =
          encodeURIComponent(
            roomName
          );

        /*
         * Laravel endpoint:
         *
         * GET /api/admin/map/room-reports
         *
         * Example:
         *
         * /api/admin/map/room-reports
         *   ?building=building2
         *   &room=B2%20213
         */
        const response =
          (await apiRequest(
            `/admin/map/room-reports?building=${queryBuilding}&room=${queryRoom}`
          )) as RoomReportsResponse;

        console.log(
          "REAL ROOM REPORTS:",
          response
        );

        setReports(
          Array.isArray(
            response?.data
          )
            ? response.data
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load room reports:",
          err
        );

        setReports([]);

        setError(
          err instanceof Error
            ? err.message
            : "Could not load reports. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [
      selectedBuilding,
      roomName,
    ]);

  /*
   * Reload every time the screen
   * becomes active.
   */
  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      loadReports();
    }, [loadReports])
  );

  /*
   * Pull-to-refresh.
   */
  const handleRefresh = () => {
    setRefreshing(true);

    loadReports();
  };

  /*
   * Back to building map.
   */
  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <View style={styles.header}>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back to Building Map"
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <View style={styles.headerText}>

          <Text style={styles.title}>
            Room Reports
          </Text>

          <Text style={styles.subtitle}>
            {selectedBuildingName ||
              "Building"}
            {" · "}
            {roomName ||
              "Room"}
          </Text>

        </View>

        <Pressable
          onPress={handleRefresh}
          disabled={loading}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.pressed,
            loading &&
              styles.refreshButtonDisabled,
          ]}
        >
          <Text style={styles.refreshText}>
            {loading
              ? "Loading..."
              : "Refresh"}
          </Text>
        </Pressable>

      </View>

      {/* =====================================================
          ROOM SUMMARY
      ===================================================== */}

      <View style={styles.summary}>

        <View style={styles.summaryText}>

          <Text style={styles.summaryLabel}>
            REPORTS IN THIS ROOM
          </Text>

          <Text style={styles.roomTitle}>
            {roomName ||
              "Unknown room"}
          </Text>

          <Text style={styles.summarySubtext}>
            {selectedBuildingName ||
              "Building"}
          </Text>

        </View>

        <View style={styles.summaryBadge}>

          <Text style={styles.summaryBadgeText}>
            {loading
              ? "…"
              : reports.length}
          </Text>

        </View>

      </View>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error ? (
        <View style={styles.errorBanner}>

          <View style={styles.errorContent}>

            <Text style={styles.errorTitle}>
              Unable to load reports
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

          </View>

          <Pressable
            onPress={handleRefresh}
            disabled={loading}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>
              Try again
            </Text>
          </Pressable>

        </View>
      ) : null}

      {/* =====================================================
          REPORT LIST
      ===================================================== */}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          reports.length === 0 &&
          !loading
            ? styles.emptyScrollContent
            : styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.maroon}
            colors={[COLORS.maroon]}
          />
        }
      >

        {loading ? (

          <View style={styles.loadingContainer}>

            <View style={styles.loadingCircle}>

              <ActivityIndicator
                size="small"
                color={COLORS.maroon}
              />

            </View>

            <Text style={styles.loadingText}>
              Loading reports...
            </Text>

          </View>

        ) : reports.length === 0 ? (

          <View style={styles.emptyContainer}>

            <View style={styles.emptyIcon}>

              <Text style={styles.emptyIconText}>
                ✓
              </Text>

            </View>

            <Text style={styles.emptyTitle}>
              No reports
            </Text>

            <Text style={styles.emptyText}>
              There are currently no saved
              damage reports for this room.
            </Text>

          </View>

        ) : (

          reports.map((report) => (

            <Pressable
              key={report.id}
              onPress={() =>
                router.push({
                  pathname:
                    "/admin/admin-report-details",
                  params: {
                    id: String(report.id),
                  },
                } as any)
              }
              style={({ pressed }) => [
                styles.reportCard,
                pressed && styles.reportCardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Open report ${
                report.report_number ??
                report.id
              }`}
            >

              {/* =================================================
                  REPORT HEADER
              ================================================= */}

              <View style={styles.reportHeader}>

                <View
                  style={
                    styles.reportHeaderText
                  }
                >

                  <Text
                    style={
                      styles.reportNumber
                    }
                  >
                    {report.report_number ||
                      `Report #${report.id}`}
                  </Text>

                  <Text
                    style={
                      styles.propertyName
                    }
                  >
                    {report.property_name ||
                      "Unspecified property"}
                  </Text>

                </View>

                <View
                  style={[
                    styles.statusBadge,
                    report.status
                      ?.toLowerCase() ===
                      "completed" &&
                      styles.statusCompleted,

                    report.status
                      ?.toLowerCase() ===
                      "repaired" &&
                      styles.statusCompleted,

                    report.status
                      ?.toLowerCase() ===
                      "rejected" &&
                      styles.statusRejected,

                    report.status
                      ?.toLowerCase() ===
                      "verified" &&
                      styles.statusVerified,

                    report.status
                      ?.toLowerCase() ===
                      "in_progress" &&
                      styles.statusVerified,
                  ]}
                >

                  <Text
                    style={
                      styles.statusText
                    }
                  >
                    {formatStatus(
                      report.status
                    )}
                  </Text>

                </View>

              </View>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <View
                style={styles.infoBlock}
              >

                <Text
                  style={styles.infoLabel}
                >
                  DESCRIPTION
                </Text>

                <Text
                  style={styles.description}
                  numberOfLines={3}
                >
                  {report.description ||
                    "No description provided."}
                </Text>

              </View>

              {/* =================================================
                  DETAILS
              ================================================= */}

              <View
                style={styles.detailsGrid}
              >

                <View
                  style={styles.detailItem}
                >

                  <Text
                    style={styles.infoLabel}
                  >
                    BUILDING
                  </Text>

                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                  >
                    {report.building_name ||
                      selectedBuildingName ||
                      "—"}
                  </Text>

                </View>

                <View
                  style={styles.detailItem}
                >

                  <Text
                    style={styles.infoLabel}
                  >
                    ROOM
                  </Text>

                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                  >
                    {report.room_name ||
                      roomName ||
                      "—"}
                  </Text>

                </View>

                <View
                  style={styles.detailItem}
                >

                  <Text
                    style={styles.infoLabel}
                  >
                    PRIORITY
                  </Text>

                  <Text
                    style={styles.detailValue}
                  >
                    {formatPriority(
                      report.priority
                    )}
                  </Text>

                </View>

                <View
                  style={styles.detailItem}
                >

                  <Text
                    style={styles.infoLabel}
                  >
                    REPORTED
                  </Text>

                  <Text
                    style={styles.detailValue}
                    numberOfLines={2}
                  >
                    {formatDate(
                      report.reported_at ||
                        report.created_at
                    )}
                  </Text>

                </View>

              </View>

              {/* =================================================
                  VIEW DETAILS
              ================================================= */}

              <View style={styles.viewDetailsRow}>

                <Text
                  style={styles.viewDetailsText}
                >
                  View report details
                </Text>

                <Text
                  style={styles.arrowText}
                >
                  ›
                </Text>

              </View>

            </Pressable>

          ))

        )}

      </ScrollView>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <View style={styles.footer}>

        <Text style={styles.footerText}>
          Showing saved reports from the database.
        </Text>

      </View>

    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  backText: {
    color: COLORS.white,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "300",
    marginTop: -3,
  },

  headerText: {
    flex: 1,
  },

  title: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
  },

  subtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    marginTop: 3,
  },

  refreshButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
  },

  refreshButtonDisabled: {
    opacity: 0.65,
  },

  refreshText: {
    color: COLORS.maroon,
    fontSize: 12,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.75,
  },

  /* =======================================================
     SUMMARY
  ======================================================= */

  summary: {
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  summaryText: {
    flex: 1,
    paddingRight: 15,
  },

  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  roomTitle: {
    color: COLORS.maroon,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },

  summarySubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  summaryBadge: {
    minWidth: 52,
    height: 52,
    paddingHorizontal: 10,
    borderRadius: 26,
    backgroundColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryBadgeText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },

  /* =======================================================
     ERROR
  ======================================================= */

  errorBanner: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFF1F0",
    borderWidth: 1,
    borderColor: "#F2C9C6",
    flexDirection: "row",
    alignItems: "center",
  },

  errorContent: {
    flex: 1,
    paddingRight: 10,
  },

  errorTitle: {
    color: "#9B2018",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 3,
  },

  errorText: {
    color: "#A34A43",
    fontSize: 12,
    lineHeight: 17,
  },

  retryButton: {
    paddingVertical: 7,
    paddingHorizontal: 5,
  },

  retryText: {
    color: COLORS.maroon,
    fontSize: 12,
    fontWeight: "800",
  },

  /* =======================================================
     SCROLL
  ======================================================= */

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 22,
  },

  emptyScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 22,
  },

  /* =======================================================
     LOADING
  ======================================================= */

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 65,
  },

  loadingCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },

  /* =======================================================
     REPORT CARD
  ======================================================= */

  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 17,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  reportCardPressed: {
    opacity: 0.86,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  reportHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  reportHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  reportNumber: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },

  propertyName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
    lineHeight: 23,
  },

  /* =======================================================
     STATUS
  ======================================================= */

  statusBadge: {
    backgroundColor: "#FFF4DF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusVerified: {
    backgroundColor: "#E8F1FB",
  },

  statusCompleted: {
    backgroundColor: "#E8F6EC",
  },

  statusRejected: {
    backgroundColor: "#FFE9E8",
  },

  statusText: {
    color: "#765000",
    fontSize: 10,
    fontWeight: "800",
  },

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  infoBlock: {
    backgroundColor: "#FAF7F8",
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
  },

  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 5,
  },

  description: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 19,
  },

  /* =======================================================
     DETAILS
  ======================================================= */

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 13,
  },

  detailItem: {
    width: "50%",
    marginBottom: 12,
    paddingRight: 10,
  },

  detailValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },

  /* =======================================================
     VIEW DETAILS
  ======================================================= */

  viewDetailsRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 2,
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  viewDetailsText: {
    color: COLORS.maroon,
    fontSize: 12,
    fontWeight: "800",
  },

  arrowText: {
    color: COLORS.maroon,
    fontSize: 21,
    lineHeight: 21,
    fontWeight: "500",
  },

  /* =======================================================
     EMPTY
  ======================================================= */

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingTop: 60,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyIconText: {
    color: COLORS.maroon,
    fontSize: 28,
    fontWeight: "800",
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },

  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },

  /* =======================================================
     FOOTER
  ======================================================= */

  footer: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  footerText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textAlign: "center",
  },
});