import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { COLORS, Spacing } from "../../constants/theme";
import InteractiveMap from "../../components/InteractiveMap";
import {
  CAMPUS_HOTSPOTS,
  CampusHotspot,
} from "../../data/campusHotspots";

const campusMap = require("../../../assets/maps/Campus_Map.png");

type RouteParam = string | string[] | undefined;

const getParam = (value: RouteParam): string => {
  return Array.isArray(value)
    ? value[0] ?? ""
    : value ?? "";
};

export default function CampusMapScreen() {
  const params = useLocalSearchParams<{
    returnTo?: string | string[];
  }>();

  const returnTo = getParam(params.returnTo);

  /*
   * If the map was opened from Report Damage:
   *
   * Report Damage
   *      ↓
   * Campus Map
   *
   * Back should return to Report Damage.
   *
   * If the map was opened directly from Home:
   *
   * Home
   *   ↓
   * Campus Map
   *
   * Back should return to Home.
   */
  const goBack = () => {
    if (returnTo === "/user/report-damage") {
      router.replace("/user/report-damage" as any);
      return;
    }

    router.replace("/user/user-dashboard" as any);
  };

  /*
   * InteractiveMap expects left/top.
   *
   * Our hotspot data is stored using the original
   * Campus_Map.png pixel coordinates.
   */
  const mapHotspots = CAMPUS_HOTSPOTS.map(
    (hotspot) => ({
      ...hotspot,
      left: hotspot.x,
      top: hotspot.y,
    })
  );

  const openLocation = (
    hotspot: CampusHotspot
  ) => {
    // =====================================================
    // BUILDING
    // =====================================================

    if (hotspot.type === "building") {
      router.push({
        pathname: "/user/building-map",
        params: {
          building: hotspot.id,
          name: hotspot.name,

          // Keep track of where the campus map came from.
          returnTo: returnTo || "/user/user-dashboard",
        },
      } as any);

      return;
    }

    // =====================================================
    // FACILITY
    // =====================================================

    /*
     * Facilities are stored in Laravel as rooms under:
     *
     * Campus Facilities
     *
     * Example:
     *
     * Campus Facilities
     *   └── Parking Area
     *
     * Campus Facilities
     *   └── Canteen
     *
     * Campus Facilities
     *   └── Clinic
     */

    const buildingId =
      hotspot.reportBuildingId ??
      "campus-facilities";

    const buildingName =
      hotspot.reportBuildingName ??
      "Campus Facilities";

    const roomId =
      hotspot.reportRoomId ??
      hotspot.id;

    const roomName =
      hotspot.reportRoomName ??
      hotspot.name;

    router.push({
      pathname: "/user/report-damage",
      params: {
        building: buildingId,
        buildingName: buildingName,
        room: roomId,
        roomName: roomName,

        /*
         * This tells Report Damage where the user
         * originally came from.
         */
        returnTo: returnTo || "/user/user-dashboard",
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* ===================================================
          HEADER
      =================================================== */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>
            Select Location
          </Text>

          <Text style={styles.subtitle}>
            Tap the building, room, or facility where
            the damage occurred
          </Text>
        </View>
      </View>

      {/* ===================================================
          MAP
      =================================================== */}

      <View style={styles.mapArea}>
        <InteractiveMap
          image={campusMap}
          hotspots={mapHotspots}
          onPress={(hotspot) =>
            openLocation(
              hotspot as unknown as CampusHotspot
            )
          }
          debug={false}
        />
      </View>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <View style={styles.instruction}>
        <Text style={styles.instructionText}>
          Pinch to zoom • Drag to move • Double tap to
          reset
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

  mapArea: {
    flex: 1,
    overflow: "hidden",
  },

  instruction: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  instructionText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});