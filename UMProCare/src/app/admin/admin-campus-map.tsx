import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import AdminInteractiveMap, {
  type MapHotspot,
} from "../../components/AdminInteractiveMap";

import { COLORS, Spacing } from "../../constants/theme";
import { apiRequest } from "../../services/api";

import {
  CAMPUS_HOTSPOTS,
  type CampusHotspot,
} from "../../data/campusHotspots";

const campusMap = require("../../../assets/maps/Campus_Map.png");

/*
|--------------------------------------------------------------------------
| API RESPONSE
|--------------------------------------------------------------------------
|
| The backend returns active report counts.
|
| ACTIVE means:
|
|   Pending       -> INCLUDED
|   Verified      -> INCLUDED
|   For Repair    -> INCLUDED
|   Repaired      -> INCLUDED
|   Any other     -> INCLUDED
|
| NOT ACTIVE:
|
|   Completed     -> EXCLUDED
|   Rejected      -> EXCLUDED
|
*/

type CampusBuilding = {
  id: number;
  building_id: string;
  name: string;
  report_count: number;
};

type CampusCountsResponse = {
  building_counts?: Record<string, number>;
  counts?: Record<string, number>;
  buildings?: CampusBuilding[];
  message?: string;
};

/*
|--------------------------------------------------------------------------
| Convert campus hotspot data to map hotspot data
|--------------------------------------------------------------------------
*/

function toMapHotspots(
  hotspots: CampusHotspot[]
): MapHotspot[] {
  return hotspots.map((hotspot) => ({
    id: hotspot.id,
    name: hotspot.name,
    type: hotspot.type,
    x: hotspot.x,
    y: hotspot.y,
    width: hotspot.width,
    height: hotspot.height,
  }));
}

/*
|--------------------------------------------------------------------------
| Build report counts for the map
|--------------------------------------------------------------------------
|
| We DO NOT hardcode database IDs.
|
| Example:
|
| building1 -> database ID could be 1
| building2 -> database ID could be 2
|
| But the frontend uses:
|
| building1
| building2
| oldBuilding
|
| The backend returns those building IDs so the map can
| match them directly.
|
*/

function getCountsByHotspot(
  response: CampusCountsResponse
): Record<string, number> {
  const result: Record<string, number> = {};

  /*
   * Initialize every hotspot to zero.
   *
   * This also prevents undefined values from being
   * passed to AdminInteractiveMap.
   */
  for (const hotspot of CAMPUS_HOTSPOTS) {
    result[hotspot.id] = 0;
  }

  /*
   * Prefer building_counts.
   *
   * Example backend response:
   *
   * {
   *   "building_counts": {
   *     "building1": 4,
   *     "building2": 7,
   *     "oldBuilding": 2
   *   }
   * }
   */
  const databaseCounts =
    response.building_counts ??
    response.counts ??
    {};

  /*
   * Apply counts to building hotspots.
   */
  for (const hotspot of CAMPUS_HOTSPOTS) {
    if (hotspot.type !== "building") {
      continue;
    }

    /*
     * Direct lookup using frontend building ID.
     */
    const directCount =
      databaseCounts[hotspot.id];

    if (directCount !== undefined) {
      result[hotspot.id] =
        Number(directCount) || 0;

      continue;
    }

    /*
     * Fallback to the buildings array.
     *
     * This is useful if building_counts is missing
     * but the backend returns:
     *
     * buildings: [
     *   {
     *     building_id: "building1",
     *     report_count: 4
     *   }
     * ]
     */
    const building =
      response.buildings?.find(
        (item) =>
          String(item.building_id)
            .trim()
            .toLowerCase() ===
          String(hotspot.id)
            .trim()
            .toLowerCase()
      );

    if (building) {
      result[hotspot.id] =
        Number(building.report_count) || 0;
    }
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| ADMIN CAMPUS MAP
|--------------------------------------------------------------------------
*/

export default function AdminCampusMapScreen() {
  const [reportCounts, setReportCounts] =
    useState<Record<string, number>>({});

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  /*
   * Convert your existing campus hotspots
   * into AdminInteractiveMap hotspots.
   */
  const mapHotspots =
    toMapHotspots(CAMPUS_HOTSPOTS);

  /*
  |--------------------------------------------------------------------------
  | Load active report counts
  |--------------------------------------------------------------------------
  |
  | The backend is responsible for excluding:
  |
  |   Completed
  |   Rejected
  |
  | Pending is NOT excluded.
  |
  */

  const loadReportCounts =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response =
          (await apiRequest(
            "/admin/campus-counts"
          )) as CampusCountsResponse;

        console.log(
          "ADMIN CAMPUS COUNTS:",
          JSON.stringify(
            response,
            null,
            2
          )
        );

        const counts =
          getCountsByHotspot(response);

        console.log(
          "MAP REPORT COUNTS:",
          counts
        );

        setReportCounts(counts);
      } catch (error) {
        console.error(
          "Failed to load campus report counts:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load report counts. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /*
  |--------------------------------------------------------------------------
  | Reload whenever this screen becomes active
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | Campus Map
  |     ↓
  | Building Map
  |     ↓
  | Report
  |     ↓
  | Status changed to Completed
  |     ↓
  | Back to Campus Map
  |     ↓
  | loadReportCounts()
  |     ↓
  | Completed report disappears from count
  |
  */

  useFocusEffect(
    useCallback(() => {
      loadReportCounts();
    }, [loadReportCounts])
  );

  /*
  |--------------------------------------------------------------------------
  | Campus hotspot press
  |--------------------------------------------------------------------------
  */

  const handleCampusPress = (
    hotspot: MapHotspot
  ) => {
    console.log(
      "ADMIN CAMPUS HOTSPOT PRESSED:",
      hotspot
    );

    /*
     * BUILDING
     *
     * Open Admin Building Map.
     */
    if (hotspot.type === "building") {
      router.push({
        pathname:
          "/admin/admin-building-map",

        params: {
          building: hotspot.id,
          name: hotspot.name,
        },
      } as any);

      return;
    }

    /*
     * FACILITY / OTHER LOCATION
     *
     * Open its reports directly.
     */
    router.push({
      pathname:
        "/admin/admin-room-reports",

      params: {
        location: hotspot.name,
        locationId: hotspot.id,
      },
    } as any);
  };

  /*
  |--------------------------------------------------------------------------
  | Calculate total active reports
  |--------------------------------------------------------------------------
  |
  | This is only the total displayed by the map screen.
  |
  | The actual filtering happens in Laravel.
  |
  */

  const totalActiveReports =
    Object.values(reportCounts).reduce(
      (total, count) =>
        total + Number(count || 0),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View style={styles.container}>

      {/* ============================================================
          HEADER
          ============================================================ */}

      <View style={styles.header}>

        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <View style={styles.headerText}>

          <Text style={styles.title}>
            Campus Map
          </Text>

          <Text style={styles.subtitle}>
            Select a building or facility to view its reports
          </Text>

        </View>

        <Pressable
          onPress={loadReportCounts}
          style={[
            styles.refreshButton,
            loading &&
              styles.refreshButtonDisabled,
          ]}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Refresh report counts"
        >
          <Text style={styles.refreshText}>
            {loading
              ? "Loading..."
              : "Refresh"}
          </Text>
        </Pressable>

      </View>

      {/* ============================================================
          COUNT STATUS
          ============================================================ */}

      <View style={styles.statusBar}>

        {loading ? (

          <View style={styles.statusContent}>

            <ActivityIndicator
              size="small"
              color={COLORS.maroon}
            />

            <Text style={styles.statusText}>
              Loading active report counts…
            </Text>

          </View>

        ) : errorMessage ? (

          <View style={styles.errorContainer}>

            <Text style={styles.errorText}>
              Could not load report counts
            </Text>

            <Text style={styles.errorDetails}>
              {errorMessage}
            </Text>

          </View>

        ) : (

          <View style={styles.statusContent}>

            <View style={styles.activeDot} />

            <Text style={styles.statusText}>
              {totalActiveReports} active reports
            </Text>

          </View>

        )}

      </View>

      {/* ============================================================
          MAP
          ============================================================ */}

      <View style={styles.mapArea}>

        <AdminInteractiveMap
          image={campusMap}
          hotspots={mapHotspots}
          onPress={handleCampusPress}
          reportCounts={reportCounts}
          debug={false}
        />

      </View>

      {/* ============================================================
          FOOTER
          ============================================================ */}

      <View style={styles.footer}>

        <Text style={styles.footerText}>
          Pinch to zoom • Drag to move • Tap a building to view rooms
        </Text>

        <Text style={styles.footerSubtext}>
          Pending and all other non-final reports are included.
        </Text>

        <Text style={styles.footerSubtext}>
          Completed and rejected reports are excluded.
        </Text>

      </View>

    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.lighterMaroon,
  },

  /*
  |--------------------------------------------------------------------------
  | HEADER
  |--------------------------------------------------------------------------
  */

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

    justifyContent: "center",

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
    backgroundColor:
      COLORS.maroon,

    paddingHorizontal: 12,

    paddingVertical: 9,

    borderRadius: 8,

    marginLeft: 8,
  },

  refreshButtonDisabled: {
    opacity: 0.6,
  },

  refreshText: {
    color: COLORS.white,

    fontSize: 12,

    fontWeight: "700",
  },

  /*
  |--------------------------------------------------------------------------
  | STATUS BAR
  |--------------------------------------------------------------------------
  */

  statusBar: {
    backgroundColor:
      COLORS.white,

    paddingHorizontal:
      Spacing.lg,

    paddingVertical: 9,

    borderBottomWidth: 1,

    borderBottomColor:
      COLORS.border,
  },

  statusContent: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,
  },

  activeDot: {
    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor:
      COLORS.maroon,
  },

  statusText: {
    color:
      COLORS.textSecondary,

    fontSize: 11,

    textAlign: "center",
  },

  errorContainer: {
    alignItems: "center",

    justifyContent: "center",

    paddingVertical: 2,
  },

  errorText: {
    color: "#B42318",

    fontSize: 11,

    fontWeight: "800",

    textAlign: "center",
  },

  errorDetails: {
    color: "#B42318",

    fontSize: 10,

    textAlign: "center",

    marginTop: 2,
  },

  /*
  |--------------------------------------------------------------------------
  | MAP
  |--------------------------------------------------------------------------
  */

  mapArea: {
    flex: 1,

    overflow: "hidden",
  },

  /*
  |--------------------------------------------------------------------------
  | FOOTER
  |--------------------------------------------------------------------------
  */

  footer: {
    backgroundColor:
      COLORS.white,

    paddingVertical: 12,

    paddingHorizontal: 16,

    borderTopWidth: 1,

    borderTopColor:
      COLORS.border,
  },

  footerText: {
    color:
      COLORS.textSecondary,

    fontSize: 11,

    textAlign: "center",
  },

  footerSubtext: {
    color:
      COLORS.textSecondary,

    fontSize: 10,

    textAlign: "center",

    marginTop: 3,
  },
});