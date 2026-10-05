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

import { COLORS, Spacing } from "../../constants/theme";
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

  return status
    .replace(/[_-]/g, " ")
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
    .replace(/[_-]/g, " ")
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
  } =
    useLocalSearchParams<{
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
  const handleRefresh =
    () => {
      setRefreshing(true);

      loadReports();
    };

  /*
   * Back to building map.
   */
  const handleBack =
    () => {
      router.back();
    };

  return (
    <View
      style={styles.container}
    >
      {/* HEADER */}

      <View
        style={styles.header}
      >
        <Pressable
  onPress={() => router.back()}
  style={styles.backButton}
  hitSlop={8}
  accessibilityRole="button"
  accessibilityLabel="Go back to Building Map"
>
  <Text style={styles.backText}>
    ‹
  </Text>
</Pressable>

        <View
          style={
            styles.headerText
          }
        >
          <Text
            style={styles.title}
          >
            Room Reports
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            {selectedBuildingName ||
              "Building"}
            {" • "}
            {roomName ||
              "Room"}
          </Text>
        </View>

        <Pressable
          onPress={
            handleRefresh
          }
          disabled={loading}
          style={[
            styles.refreshButton,
            loading &&
              styles.refreshButtonDisabled,
          ]}
        >
          <Text
            style={
              styles.refreshText
            }
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </Text>
        </Pressable>
      </View>

      {/* ROOM SUMMARY */}

      <View
        style={styles.summary}
      >
        <View
          style={
            styles.summaryText
          }
        >
          <Text
            style={
              styles.summaryLabel
            }
          >
            Reports in this room
          </Text>

          <Text
            style={
              styles.roomTitle
            }
          >
            {roomName ||
              "Unknown room"}
          </Text>
        </View>

        <View
          style={
            styles.summaryBadge
          }
        >
          <Text
            style={
              styles.summaryBadgeText
            }
          >
            {loading
              ? "…"
              : reports.length}
          </Text>
        </View>
      </View>

      {/* ERROR */}

      {error ? (
        <View
          style={
            styles.errorBanner
          }
        >
          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>

          <Pressable
            onPress={
              handleRefresh
            }
            disabled={loading}
          >
            <Text
              style={
                styles.retryText
              }
            >
              Try again
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* REPORT LIST */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          reports.length === 0 &&
          !loading
            ? styles.emptyScrollContent
            : styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
          />
        }
      >
        {loading ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color={
                COLORS.maroon
              }
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading reports...
            </Text>
          </View>
        ) : reports.length ===
          0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Text
                style={
                  styles.emptyIconText
                }
              >
                ✓
              </Text>
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No reports
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              There are currently no saved
              damage reports for this room.
            </Text>
          </View>
        ) : (
          reports.map(
            (report) => (
              <View
                key={report.id}
                style={
                  styles.reportCard
                }
              >
                {/* REPORT HEADER */}

                <View
                  style={
                    styles.reportHeader
                  }
                >
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

                {/* DESCRIPTION */}

                <View
                  style={
                    styles.infoBlock
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Description
                  </Text>

                  <Text
                    style={
                      styles.description
                    }
                  >
                    {report.description ||
                      "No description provided."}
                  </Text>
                </View>

                {/* DETAILS */}

                <View
                  style={
                    styles.detailsGrid
                  }
                >
                  <View
                    style={
                      styles.detailItem
                    }
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      Building
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {report.building_name ||
                        selectedBuildingName ||
                        "—"}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailItem
                    }
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      Room
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {report.room_name ||
                        roomName ||
                        "—"}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailItem
                    }
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      Priority
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {formatPriority(
                        report.priority
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailItem
                    }
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      Reported
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {formatDate(
                        report.reported_at ||
                          report.created_at
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            )
          )
        )}
      </ScrollView>

      {/* FOOTER */}

      <View
        style={styles.footer}
      >
        <Text
          style={
            styles.footerText
          }
        >
          Showing saved reports from the
          database.
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.lighterMaroon,
    },

    header: {
      backgroundColor:
        COLORS.white,
      paddingHorizontal:
        Spacing.lg,
      paddingTop: 50,
      paddingBottom:
        Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor:
        COLORS.border,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        COLORS.maroon,
      alignItems: "center",
      justifyContent:
        "center",
      marginRight: 12,
    },

    backText: {
      color: COLORS.white,
      fontSize: 30,
      lineHeight: 32,
      marginTop: -3,
    },

    headerText: {
      flex: 1,
    },

    title: {
      color: COLORS.maroon,
      fontSize: 20,
      fontWeight: "800",
    },

    subtitle: {
      color:
        COLORS.textSecondary,
      fontSize: 11,
      marginTop: 3,
    },

    refreshButton: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 8,
      backgroundColor:
        COLORS.lighterMaroon,
      marginLeft: 8,
    },

    refreshButtonDisabled: {
      opacity: 0.6,
    },

    refreshText: {
      color: COLORS.maroon,
      fontSize: 12,
      fontWeight: "700",
    },

    summary: {
      margin: 12,
      padding: 14,
      borderRadius: 10,
      backgroundColor:
        COLORS.white,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    summaryText: {
      flex: 1,
    },

    summaryLabel: {
      color:
        COLORS.textSecondary,
      fontSize: 12,
    },

    roomTitle: {
      color: COLORS.maroon,
      fontSize: 18,
      fontWeight: "800",
      marginTop: 3,
    },

    summaryBadge: {
      minWidth: 42,
      height: 42,
      paddingHorizontal: 10,
      borderRadius: 21,
      backgroundColor:
        COLORS.maroon,
      alignItems: "center",
      justifyContent:
        "center",
      marginLeft: 12,
    },

    summaryBadgeText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: "800",
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 12,
      paddingBottom: 20,
    },

    emptyScrollContent: {
      flexGrow: 1,
      paddingHorizontal: 12,
      paddingBottom: 20,
    },

    loadingContainer: {
      paddingTop: 60,
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      color:
        COLORS.textSecondary,
      fontSize: 13,
      marginTop: 10,
    },

    reportCard: {
      backgroundColor:
        COLORS.white,
      borderRadius: 12,
      padding: 15,
      marginBottom: 12,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    reportHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent:
        "space-between",
      marginBottom: 14,
    },

    reportHeaderText: {
      flex: 1,
      paddingRight: 10,
    },

    reportNumber: {
      color:
        COLORS.textSecondary,
      fontSize: 11,
      fontWeight: "700",
    },

    propertyName: {
      color: COLORS.maroon,
      fontSize: 17,
      fontWeight: "800",
      marginTop: 3,
    },

    statusBadge: {
      backgroundColor:
        "#FFF1D6",
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 12,
    },

    statusVerified: {
      backgroundColor:
        "#E7F4EA",
    },

    statusCompleted: {
      backgroundColor:
        "#E7F4EA",
    },

    statusRejected: {
      backgroundColor:
        "#FFE7E7",
    },

    statusText: {
      color: "#555555",
      fontSize: 10,
      fontWeight: "800",
    },

    infoBlock: {
      marginBottom: 14,
    },

    infoLabel: {
      color:
        COLORS.textSecondary,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      marginBottom: 4,
    },

    description: {
      color: COLORS.text,
      fontSize: 13,
      lineHeight: 19,
    },

    detailsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      borderTopWidth: 1,
      borderTopColor:
        COLORS.border,
      paddingTop: 12,
    },

    detailItem: {
      width: "50%",
      marginBottom: 10,
      paddingRight: 8,
    },

    detailValue: {
      color: COLORS.text,
      fontSize: 12,
      fontWeight: "600",
    },

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor:
        COLORS.white,
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 14,
    },

    emptyIconText: {
      color: COLORS.maroon,
      fontSize: 28,
      fontWeight: "800",
    },

    emptyTitle: {
      color: COLORS.maroon,
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 6,
    },

    emptyText: {
      color:
        COLORS.textSecondary,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
    },

    errorBanner: {
      marginHorizontal: 12,
      marginBottom: 10,
      padding: 12,
      borderRadius: 8,
      backgroundColor:
        "#FFF0F0",
    },

    errorText: {
      color: "#A00000",
      fontSize: 12,
    },

    retryText: {
      color: COLORS.maroon,
      fontSize: 12,
      fontWeight: "800",
      marginTop: 6,
    },

    footer: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor:
        COLORS.white,
      borderTopWidth: 1,
      borderTopColor:
        COLORS.border,
    },

    footerText: {
      color:
        COLORS.textSecondary,
      fontSize: 10,
      textAlign: "center",
    },
  });