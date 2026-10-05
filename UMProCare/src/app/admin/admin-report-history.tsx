import React, {
  useCallback,
  useMemo,
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
} from "expo-router";

import {
  COLORS,
  Spacing,
} from "../../constants/theme";

import {
  apiRequest,
} from "../../services/api";

/* =========================================================
 * TYPES
 * ======================================================= */

type ReportStatus =
  | "Pending"
  | "Verified"
  | "For Repair"
  | "Repaired"
  | "Completed"
  | "Rejected"
  | string;

type Report = {
  id: number | string;

  report_number?: string | null;

  property_name?: string | null;

  description?: string | null;

  priority?: string | null;

  status?: ReportStatus | null;

  reported_at?: string | null;

  created_at?: string | null;

  updated_at?: string | null;

  building_name?: string | null;

  room_name?: string | null;

  building?: string | null;

  room?: string | null;
};

type ReportsResponse = {
  data?: Report[];

  reports?: Report[];

  message?: string;
};

/* =========================================================
 * HELPERS
 * ======================================================= */

function getStatusLabel(
  status?: ReportStatus | null
): string {
  if (!status) {
    return "Unknown";
  }

  return status;
}

function normalizeStatus(
  status?: ReportStatus | null
): string {
  return (
    String(status ?? "")
      .trim()
      .toLowerCase()
  );
}

function isCompletedStatus(
  status?: ReportStatus | null
): boolean {
  const normalized =
    normalizeStatus(status);

  return (
    normalized === "repaired" ||
    normalized === "completed" ||
    normalized === "complete"
  );
}

function isRejectedStatus(
  status?: ReportStatus | null
): boolean {
  return (
    normalizeStatus(status) ===
    "rejected"
  );
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "No date";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

function formatDateTime(
  value?: string | null
): string {
  if (!value) {
    return "No date";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getBuildingName(
  report: Report
): string {
  return (
    report.building_name ||
    report.building ||
    "Unknown building"
  );
}

function getRoomName(
  report: Report
): string {
  return (
    report.room_name ||
    report.room ||
    "Unknown room"
  );
}

/* =========================================================
 * SCREEN
 * ======================================================= */

export default function AdminReportHistoryScreen() {
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

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState<
    "All" |
    "Completed" |
    "Rejected"
  >("All");

  /* =======================================================
   * LOAD REPORT HISTORY
   * ===================================================== */

  const loadReports =
    useCallback(
      async (
        showRefresh = false
      ) => {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          /*
           * IMPORTANT:
           *
           * We intentionally use the normal admin
           * reports endpoint here.
           *
           * We do NOT filter by Pending/Verified/For Repair.
           *
           * Therefore completed and rejected reports
           * remain visible in history.
           */

          const response =
            (await apiRequest(
              "/admin/reports"
            )) as ReportsResponse;

          const data =
            response?.data ??
            response?.reports ??
            [];

          setReports(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (err) {
          console.error(
            "Failed to load admin report history:",
            err
          );

          setReports([]);

          setError(
            err instanceof Error
              ? err.message
              : "Could not load report history."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  /* =======================================================
   * RELOAD WHEN SCREEN OPENS
   * ===================================================== */

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [
      loadReports,
    ])
  );

  /* =======================================================
   * FILTER REPORTS
   * ===================================================== */

  const filteredReports =
    useMemo(() => {
      if (
        selectedFilter ===
        "Completed"
      ) {
        return reports.filter(
          (report) =>
            isCompletedStatus(
              report.status
            )
        );
      }

      if (
        selectedFilter ===
        "Rejected"
      ) {
        return reports.filter(
          (report) =>
            isRejectedStatus(
              report.status
            )
        );
      }

      return reports;
    }, [
      reports,
      selectedFilter,
    ]);

  /* =======================================================
   * COUNTS
   * ===================================================== */

  const completedCount =
    useMemo(
      () =>
        reports.filter(
          (report) =>
            isCompletedStatus(
              report.status
            )
        ).length,
      [reports]
    );

  const rejectedCount =
    useMemo(
      () =>
        reports.filter(
          (report) =>
            isRejectedStatus(
              report.status
            )
        ).length,
      [reports]
    );

  /* =======================================================
   * REPORT CARD
   * ===================================================== */

  const renderReport =
    (report: Report) => {
      const status =
        getStatusLabel(
          report.status
        );

      const completed =
        isCompletedStatus(
          report.status
        );

      const rejected =
        isRejectedStatus(
          report.status
        );

      return (
        <Pressable
          key={String(report.id)}
          style={
            styles.reportCard
          }
          onPress={() => {
            /*
             * Open the same admin report
             * details screen.
             *
             * If your project uses a different
             * details route, change this path.
             */

            router.push({
              pathname:
                "/admin/admin-report-details",
              params: {
                reportId:
                  String(report.id),
              },
            } as any);
          }}
        >
          {/* TOP ROW */}

          <View
            style={
              styles.cardTopRow
            }
          >
            <View
              style={
                styles.reportNumberContainer
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
            </View>

            <View
              style={[
                styles.statusBadge,

                completed &&
                  styles.completedBadge,

                rejected &&
                  styles.rejectedBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,

                  completed &&
                    styles.completedText,

                  rejected &&
                    styles.rejectedText,
                ]}
              >
                {status}
              </Text>
            </View>
          </View>

          {/* PROPERTY */}

          <Text
            style={
              styles.propertyName
            }
          >
            {report.property_name ||
              "Unnamed property"}
          </Text>

          {/* LOCATION */}

          <View
            style={
              styles.locationContainer
            }
          >
            <Text
              style={
                styles.locationLabel
              }
            >
              Location
            </Text>

            <Text
              style={
                styles.locationText
              }
            >
              {getBuildingName(
                report
              )}
              {" • "}
              {getRoomName(
                report
              )}
            </Text>
          </View>

          {/* DESCRIPTION */}

          {report.description ? (
            <Text
              style={
                styles.description
              }
              numberOfLines={3}
            >
              {report.description}
            </Text>
          ) : null}

          {/* PRIORITY */}

          {report.priority ? (
            <View
              style={
                styles.priorityRow
              }
            >
              <Text
                style={
                  styles.priorityLabel
                }
              >
                Priority:
              </Text>

              <Text
                style={
                  styles.priorityText
                }
              >
                {report.priority}
              </Text>
            </View>
          ) : null}

          {/* DATE */}

          <View
            style={
              styles.dateRow
            }
          >
            <Text
              style={
                styles.dateLabel
              }
            >
              Reported
            </Text>

            <Text
              style={
                styles.dateText
              }
            >
              {formatDateTime(
                report.reported_at ||
                  report.created_at
              )}
            </Text>
          </View>

          {/* COMPLETION MESSAGE */}

          {completed ? (
            <View
              style={
                styles.historyMessage
              }
            >
              <Text
                style={
                  styles.historyMessageText
                }
              >
                ✓ This report has been completed
                and is no longer counted as active.
              </Text>
            </View>
          ) : null}

          {/* REJECTION MESSAGE */}

          {rejected ? (
            <View
              style={
                styles.rejectedMessage
              }
            >
              <Text
                style={
                  styles.rejectedMessageText
                }
              >
                This report was rejected and is
                no longer counted as active.
              </Text>
            </View>
          ) : null}
        </Pressable>
      );
    };

  /* =======================================================
   * SCREEN
   * ===================================================== */

  return (
    <View
      style={
        styles.container
      }
    >
      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text
            style={
              styles.backText
            }
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={
            styles.headerText
          }
        >
          <Text
            style={
              styles.title
            }
          >
            Report History
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Completed and rejected reports
          </Text>
        </View>

        <Pressable
          onPress={() =>
            loadReports(true)
          }
          style={
            styles.refreshButton
          }
          disabled={
            refreshing
          }
        >
          <Text
            style={
              styles.refreshText
            }
          >
            Refresh
          </Text>
        </Pressable>
      </View>

      {/* SUMMARY */}

      <View
        style={
          styles.summary
        }
      >
        <View
          style={
            styles.summaryItem
          }
        >
          <Text
            style={
              styles.summaryNumber
            }
          >
            {reports.length}
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            Total
          </Text>
        </View>

        <View
          style={
            styles.summaryDivider
          }
        />

        <View
          style={
            styles.summaryItem
          }
        >
          <Text
            style={
              styles.summaryNumber
            }
          >
            {completedCount}
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            Completed
          </Text>
        </View>

        <View
          style={
            styles.summaryDivider
          }
        />

        <View
          style={
            styles.summaryItem
          }
        >
          <Text
            style={
              styles.summaryNumber
            }
          >
            {rejectedCount}
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            Rejected
          </Text>
        </View>
      </View>

      {/* FILTERS */}

      <View
        style={
          styles.filters
        }
      >
        <Pressable
          onPress={() =>
            setSelectedFilter(
              "All"
            )
          }
          style={[
            styles.filterButton,

            selectedFilter ===
              "All" &&
              styles.filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles.filterText,

              selectedFilter ===
                "All" &&
                styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            setSelectedFilter(
              "Completed"
            )
          }
          style={[
            styles.filterButton,

            selectedFilter ===
              "Completed" &&
              styles.filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles.filterText,

              selectedFilter ===
                "Completed" &&
                styles.filterTextActive,
            ]}
          >
            Completed
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            setSelectedFilter(
              "Rejected"
            )
          }
          style={[
            styles.filterButton,

            selectedFilter ===
              "Rejected" &&
              styles.filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles.filterText,

              selectedFilter ===
                "Rejected" &&
                styles.filterTextActive,
            ]}
          >
            Rejected
          </Text>
        </Pressable>
      </View>

      {/* CONTENT */}

      {loading ? (
        <View
          style={
            styles.centerContent
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
            Loading report history...
          </Text>
        </View>
      ) : error ? (
        <View
          style={
            styles.centerContent
          }
        >
          <Text
            style={
              styles.errorTitle
            }
          >
            Could not load history
          </Text>

          <Text
            style={
              styles.errorMessage
            }
          >
            {error}
          </Text>

          <Pressable
            onPress={() =>
              loadReports()
            }
            style={
              styles.retryButton
            }
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={
            styles.list
          }
          contentContainerStyle={
            filteredReports.length ===
            0
              ? styles.emptyContainer
              : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() =>
                loadReports(true)
              }
              tintColor={
                COLORS.maroon
              }
            />
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {filteredReports.length ===
          0 ? (
            <View
              style={
                styles.emptyState
              }
            >
              <Text
                style={
                  styles.emptyIcon
                }
              >
                ✓
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No reports found
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Completed and rejected reports
                will appear here.
              </Text>
            </View>
          ) : (
            filteredReports.map(
              renderReport
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

/* =========================================================
 * STYLES
 * ======================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.lighterMaroon,
    },

    /* HEADER */

    header: {
      backgroundColor:
        COLORS.white,

      paddingHorizontal:
        Spacing.lg,

      paddingTop: 50,

      paddingBottom:
        Spacing.md,

      flexDirection:
        "row",

      alignItems:
        "center",

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

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight: 12,
    },

    backText: {
      color:
        COLORS.white,

      fontSize: 30,

      lineHeight: 32,

      marginTop: -3,
    },

    headerText: {
      flex: 1,
    },

    title: {
      color:
        COLORS.maroon,

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
      backgroundColor:
        COLORS.maroon,

      paddingHorizontal: 12,

      paddingVertical: 9,

      borderRadius: 8,

      marginLeft: 8,
    },

    refreshText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight: "700",
    },

    /* SUMMARY */

    summary: {
      margin: 12,

      paddingVertical: 14,

      paddingHorizontal: 8,

      borderRadius: 10,

      backgroundColor:
        COLORS.white,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-around",
    },

    summaryItem: {
      flex: 1,

      alignItems:
        "center",
    },

    summaryNumber: {
      color:
        COLORS.maroon,

      fontSize: 22,

      fontWeight: "800",
    },

    summaryLabel: {
      color:
        COLORS.textSecondary,

      fontSize: 10,

      marginTop: 2,
    },

    summaryDivider: {
      width: 1,

      height: 32,

      backgroundColor:
        COLORS.border,
    },

    /* FILTERS */

    filters: {
      flexDirection:
        "row",

      paddingHorizontal: 12,

      marginBottom: 8,

      gap: 8,
    },

    filterButton: {
      flex: 1,

      paddingVertical: 9,

      borderRadius: 8,

      backgroundColor:
        COLORS.white,

      alignItems:
        "center",

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    filterButtonActive: {
      backgroundColor:
        COLORS.maroon,

      borderColor:
        COLORS.maroon,
    },

    filterText: {
      color:
        COLORS.textSecondary,

      fontSize: 11,

      fontWeight: "700",
    },

    filterTextActive: {
      color:
        COLORS.white,
    },

    /* LIST */

    list: {
      flex: 1,
    },

    listContent: {
      paddingHorizontal: 12,

      paddingBottom: 30,
    },

    /* REPORT CARD */

    reportCard: {
      backgroundColor:
        COLORS.white,

      borderRadius: 12,

      padding: 15,

      marginBottom: 10,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    cardTopRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      marginBottom: 10,
    },

    reportNumberContainer: {
      flex: 1,
    },

    reportNumber: {
      color:
        COLORS.maroon,

      fontSize: 12,

      fontWeight: "800",
    },

    statusBadge: {
      paddingHorizontal: 9,

      paddingVertical: 5,

      borderRadius: 20,

      backgroundColor:
        "#F2F2F2",
    },

    statusText: {
      color:
        COLORS.textSecondary,

      fontSize: 10,

      fontWeight: "800",
    },

    completedBadge: {
      backgroundColor:
        "#E8F7EE",
    },

    completedText: {
      color:
        "#18794E",
    },

    rejectedBadge: {
      backgroundColor:
        "#FDECEC",
    },

    rejectedText: {
      color:
        "#B42318",
    },

    propertyName: {
      color:
        COLORS.text,

      fontSize: 16,

      fontWeight: "800",

      marginBottom: 8,
    },

    locationContainer: {
      marginBottom: 8,
    },

    locationLabel: {
      color:
        COLORS.textSecondary,

      fontSize: 10,

      fontWeight: "700",

      marginBottom: 2,
    },

    locationText: {
      color:
        COLORS.text,

      fontSize: 12,

      fontWeight: "600",
    },

    description: {
      color:
        COLORS.textSecondary,

      fontSize: 12,

      lineHeight: 18,

      marginBottom: 8,
    },

    priorityRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      marginBottom: 7,
    },

    priorityLabel: {
      color:
        COLORS.textSecondary,

      fontSize: 10,

      marginRight: 5,
    },

    priorityText: {
      color:
        COLORS.maroon,

      fontSize: 10,

      fontWeight: "800",
    },

    dateRow: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      paddingTop: 9,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,
    },

    dateLabel: {
      color:
        COLORS.textSecondary,

      fontSize: 10,

      fontWeight: "600",
    },

    dateText: {
      color:
        COLORS.textSecondary,

      fontSize: 10,
    },

    historyMessage: {
      marginTop: 10,

      padding: 9,

      borderRadius: 7,

      backgroundColor:
        "#E8F7EE",
    },

    historyMessageText: {
      color:
        "#18794E",

      fontSize: 10,

      lineHeight: 15,

      fontWeight: "600",
    },

    rejectedMessage: {
      marginTop: 10,

      padding: 9,

      borderRadius: 7,

      backgroundColor:
        "#FDECEC",
    },

    rejectedMessageText: {
      color:
        "#B42318",

      fontSize: 10,

      lineHeight: 15,

      fontWeight: "600",
    },

    /* LOADING */

    centerContent: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      padding: 30,
    },

    loadingText: {
      color:
        COLORS.textSecondary,

      fontSize: 13,

      marginTop: 12,
    },

    /* ERROR */

    errorTitle: {
      color:
        COLORS.maroon,

      fontSize: 18,

      fontWeight: "800",

      marginBottom: 8,

      textAlign:
        "center",
    },

    errorMessage: {
      color:
        COLORS.textSecondary,

      fontSize: 12,

      textAlign:
        "center",

      marginBottom: 18,
    },

    retryButton: {
      backgroundColor:
        COLORS.maroon,

      paddingHorizontal: 22,

      paddingVertical: 11,

      borderRadius: 8,
    },

    retryButtonText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight: "800",
    },

    /* EMPTY */

    emptyContainer: {
      flexGrow: 1,
      justifyContent:
        "center",
    },

    emptyState: {
      alignItems:
        "center",

      padding: 40,
    },

    emptyIcon: {
      width: 60,

      height: 60,

      borderRadius: 30,

      backgroundColor:
        "#E8F7EE",

      color:
        "#18794E",

      fontSize: 28,

      fontWeight: "800",

      textAlign:
        "center",

      textAlignVertical:
        "center",

      marginBottom: 15,
    },

    emptyTitle: {
      color:
        COLORS.maroon,

      fontSize: 18,

      fontWeight: "800",

      marginBottom: 7,
    },

    emptyText: {
      color:
        COLORS.textSecondary,

      fontSize: 12,

      textAlign:
        "center",

      lineHeight: 18,
    },
  });