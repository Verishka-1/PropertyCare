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

/**
 * IMPORTANT:
 * Replace these example numbers with the actual building IDs from
 * your Laravel database. The database IDs have not been confirmed yet.
 *
 * These values must match the IDs returned by your Laravel
 * /admin/campus-counts endpoint.
 */
const BUILDING_DATABASE_IDS: Record<string, number> = {
  building1: 1,
  building2: 2,
  oldBuilding: 3,
  buildingCR: 4,
};

type CampusCountsResponse = {
  building_counts?: Record<string, number>;
  counts?: Record<string, number>;
  message?: string;
};

function toMapHotspots(hotspots: CampusHotspot[]): MapHotspot[] {
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

function getCountsByHotspot(
  response: CampusCountsResponse
): Record<string, number> {
  const databaseCounts =
    response.building_counts ?? response.counts ?? {};

  const result: Record<string, number> = {};

  for (const hotspot of CAMPUS_HOTSPOTS) {
    if (hotspot.type !== "building") {
      result[hotspot.id] = 0;
      continue;
    }

    // Allow an API response keyed directly by hotspot ID.
    const directCount = databaseCounts[hotspot.id];

    if (typeof directCount === "number") {
      result[hotspot.id] = directCount;
      continue;
    }

    // Otherwise, look up the count using the database building ID.
    const databaseId = BUILDING_DATABASE_IDS[hotspot.id];

    result[hotspot.id] =
      typeof databaseId === "number"
        ? databaseCounts[String(databaseId)] ?? 0
        : 0;
  }

  return result;
}

export default function AdminCampusMapScreen() {
  const [reportCounts, setReportCounts] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const mapHotspots = toMapHotspots(CAMPUS_HOTSPOTS);

  const loadReportCounts = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = (await apiRequest(
        "/admin/campus-counts"
      )) as CampusCountsResponse;

      setReportCounts(getCountsByHotspot(response));
    } catch (error) {
      console.error("Failed to load campus report counts:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load report counts. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReportCounts();
    }, [loadReportCounts])
  );

  const handleCampusPress = (hotspot: MapHotspot) => {
    if (hotspot.type === "building") {
      router.push({
        pathname: "/admin/admin-building-map",
        params: {
          building: hotspot.id,
          name: hotspot.name,
        },
      } as any);

      return;
    }

    router.push({
      pathname: "/admin/admin-room-reports",
      params: {
        location: hotspot.name,
        locationId: hotspot.id,
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
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
          <Text style={styles.title}>Campus Map</Text>
          <Text style={styles.subtitle}>
            Select a building or facility to view its reports
          </Text>
        </View>

        <Pressable
          onPress={loadReportCounts}
          style={styles.refreshButton}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Refresh report counts"
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      {/* COUNT STATUS */}
      <View style={styles.statusBar}>
        {loading ? (
          <View style={styles.statusContent}>
            <ActivityIndicator size="small" color={COLORS.maroon} />
            <Text style={styles.statusText}>Loading report counts…</Text>
          </View>
        ) : errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : (
          <Text style={styles.statusText}>
            Counts show reports recorded for each building.
          </Text>
        )}
      </View>

      {/* MAP */}
      <View style={styles.mapArea}>
        <AdminInteractiveMap
          image={campusMap}
          hotspots={mapHotspots}
          onPress={handleCampusPress}
          reportCounts={reportCounts}
          debug={false}
        />
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Pinch to zoom • Drag to move • Tap a building to view rooms
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighterMaroon,
  },

  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: 50,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.maroon,
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
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  refreshButton: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    marginLeft: 8,
  },

  refreshText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },

  statusBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  statusText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: "center",
  },

  errorText: {
    color: "#B42318",
    fontSize: 11,
    textAlign: "center",
  },

  mapArea: {
    flex: 1,
    overflow: "hidden",
  },

  footer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  footerText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: "center",
  },
});