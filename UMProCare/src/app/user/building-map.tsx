import React, { useMemo } from "react";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import InteractiveMap, {
  type MapHotspot,
} from "../../components/InteractiveMap";
import { COLORS, Spacing } from "../../constants/theme";

const building1Map = require("../../../assets/maps/Building1.png");
const building2Map = require("../../../assets/maps/Building2.png");
const buildingCRMap = require("../../../assets/maps/BuildingCR.png");
const oldBuildingMap = require("../../../assets/maps/Old_Building.png");

type PercentageHotspot = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "building" | "facility" | "room";
};

type BuildingConfig = {
  name: string;
  image: ImageSourcePropType;
  hotspots: PercentageHotspot[];
};

/**
 * Building 1
 * Room boxes match the updated Building1.png.
 * Coordinates are percentages of the original image.
 */
const BUILDING_1_ROOMS: PercentageHotspot[] = [
  // 3rd Floor
  {
    id: "br309",
    name: "B1 309",
    x: 11.7,
    y: 17.0,
    width: 15.7,
    height: 13.1,
    type: "room",
  },
  {
    id: "br310",
    name: "B1 310",
    x: 29.7,
    y: 17.0,
    width: 16.9,
    height: 13.1,
    type: "room",
  },
  {
    id: "br311",
    name: "B1 311",
    x: 50.0,
    y: 16.7,
    width: 15.8,
    height: 13.4,
    type: "room",
  },
  {
    id: "br312",
    name: "B1 312",
    x: 70.0,
    y: 16.7,
    width: 16.1,
    height: 13.4,
    type: "room",
  },

  // 2nd Floor
  {
    id: "br205",
    name: "B1 205",
    x: 11.2,
    y: 40.5,
    width: 15.7,
    height: 13.4,
    type: "room",
  },
  {
    id: "br206",
    name: "B1 206",
    x: 29.7,
    y: 40.5,
    width: 16.9,
    height: 13.4,
    type: "room",
  },
  {
    id: "br207",
    name: "B1 207",
    x: 50.1,
    y: 40.5,
    width: 15.9,
    height: 13.5,
    type: "room",
  },
  {
    id: "br208",
    name: "B1 208",
    x: 70.0,
    y: 40.4,
    width: 16.1,
    height: 13.4,
    type: "room",
  },

  // 1st Floor
  {
    id: "br101",
    name: "B1 101",
    x: 11.2,
    y: 68.0,
    width: 15.7,
    height: 13.0,
    type: "room",
  },
  {
    id: "br102",
    name: "B1 102",
    x: 29.7,
    y: 68.0,
    width: 16.9,
    height: 13.0,
    type: "room",
  },
  {
    id: "br103",
    name: "B1 103",
    x: 50.1,
    y: 68.0,
    width: 15.9,
    height: 13.0,
    type: "room",
  },
  {
    id: "br104",
    name: "B1 104",
    x: 70.0,
    y: 68.0,
    width: 16.1,
    height: 13.0,
    type: "room",
  },
];

/**
 * Building 2
 * Room boxes match the updated Building2.png.
 * The second-floor room order runs from 212 to 207, left to right.
 */
const BUILDING_2_ROOMS: PercentageHotspot[] = [
  // 3rd Floor
  {
    id: "br313",
    name: "B2 313",
    x: 5.2,
    y: 13.1,
    width: 14.0,
    height: 11.2,
    type: "room",
  },
  {
    id: "br314",
    name: "B2 314",
    x: 21.0,
    y: 13.1,
    width: 14.6,
    height: 11.2,
    type: "room",
  },
  {
    id: "br315",
    name: "B2 315",
    x: 37.0,
    y: 13.2,
    width: 13.9,
    height: 11.1,
    type: "room",
  },
  {
    id: "br316",
    name: "B2 316",
    x: 52.7,
    y: 13.2,
    width: 13.2,
    height: 11.1,
    type: "room",
  },
  {
    id: "br317",
    name: "B2 317",
    x: 68.2,
    y: 13.2,
    width: 13.7,
    height: 11.1,
    type: "room",
  },
  {
    id: "br318",
    name: "B2 318",
    x: 83.7,
    y: 13.2,
    width: 12.1,
    height: 11.1,
    type: "room",
  },

  // 2nd Floor
  {
    id: "br212",
    name: "B2 212",
    x: 5.2,
    y: 38.8,
    width: 14.0,
    height: 11.3,
    type: "room",
  },
  {
    id: "br211",
    name: "B2 211",
    x: 21.0,
    y: 38.8,
    width: 14.6,
    height: 11.3,
    type: "room",
  },
  {
    id: "br210",
    name: "B2 210",
    x: 37.0,
    y: 38.8,
    width: 13.9,
    height: 11.3,
    type: "room",
  },
  {
    id: "br209",
    name: "B2 209",
    x: 52.7,
    y: 38.8,
    width: 13.2,
    height: 11.3,
    type: "room",
  },
  {
    id: "br208",
    name: "B2 208",
    x: 68.2,
    y: 38.8,
    width: 13.7,
    height: 11.3,
    type: "room",
  },
  {
    id: "br207",
    name: "B2 207",
    x: 83.7,
    y: 38.8,
    width: 12.1,
    height: 11.3,
    type: "room",
  },

  // 1st Floor
  {
    id: "br101",
    name: "B2 101",
    x: 5.2,
    y: 65.1,
    width: 14.0,
    height: 11.3,
    type: "room",
  },
  {
    id: "br102",
    name: "B2 102",
    x: 21.0,
    y: 65.1,
    width: 14.6,
    height: 11.3,
    type: "room",
  },
  {
    id: "br103",
    name: "B2 103",
    x: 37.0,
    y: 65.1,
    width: 13.9,
    height: 11.3,
    type: "room",
  },
  {
    id: "br104",
    name: "B2 104",
    x: 52.7,
    y: 65.1,
    width: 13.2,
    height: 11.3,
    type: "room",
  },
  {
    id: "br105",
    name: "B2 105",
    x: 68.2,
    y: 65.1,
    width: 13.7,
    height: 11.3,
    type: "room",
  },
  {
    id: "br106",
    name: "B2 106",
    x: 83.7,
    y: 65.1,
    width: 12.1,
    height: 11.3,
    type: "room",
  },
];

/**
 * Building CR rooms.
 * Kept from your previous building-map configuration.
 */
const BUILDING_CR_ROOMS: PercentageHotspot[] = [
  {
    id: "female-cr3",
    name: "Female CR3",
    x: 21.15,
    y: 18.35,
    width: 28.6,
    height: 14.1,
    type: "room",
  },
  {
    id: "male-cr3",
    name: "Male CR3",
    x: 51.5,
    y: 18.5,
    width: 28.35,
    height: 14.1,
    type: "room",
  },
  {
    id: "female-cr2",
    name: "Female CR2",
    x: 21.15,
    y: 42.8,
    width: 28.6,
    height: 14.1,
    type: "room",
  },
  {
    id: "male-cr2",
    name: "Male CR2",
    x: 51.5,
    y: 42.8,
    width: 28.35,
    height: 14.1,
    type: "room",
  },
  {
    id: "female-cr1",
    name: "Female CR1",
    x: 21.15,
    y: 64.05,
    width: 28.6,
    height: 14.1,
    type: "room",
  },
  {
    id: "male-cr1",
    name: "Male CR1",
    x: 51.5,
    y: 64.05,
    width: 28.35,
    height: 14.1,
    type: "room",
  },
];

/**
 * Old Building rooms.
 * Kept from your previous building-map configuration.
 */
const OLD_BUILDING_ROOMS: PercentageHotspot[] = [
  // 3rd Floor
  {
    id: "rv302",
    name: "RV302",
    x: 10.5,
    y: 19.85,
    width: 25.65,
    height: 15.15,
    type: "room",
  },
  {
    id: "rv301",
    name: "RV301",
    x: 37.95,
    y: 19.85,
    width: 25.4,
    height: 15.15,
    type: "room",
  },
  {
    id: "avr",
    name: "AVR",
    x: 65.35,
    y: 19.85,
    width: 24.65,
    height: 15.6,
    type: "room",
  },

  // 2nd Floor
  {
    id: "comlabv2",
    name: "ComLabV2",
    x: 10.5,
    y: 40.2,
    width: 25.65,
    height: 15.15,
    type: "room",
  },
  {
    id: "comlabv1",
    name: "ComLabV1",
    x: 37.95,
    y: 40.65,
    width: 25.4,
    height: 15.15,
    type: "room",
  },
  {
    id: "comlabv3",
    name: "ComLabV3",
    x: 65.35,
    y: 40.2,
    width: 24.65,
    height: 15.6,
    type: "room",
  },

  // 1st Floor
  {
    id: "electrical-lab",
    name: "Electrical Lab",
    x: 10.5,
    y: 61.45,
    width: 37.8,
    height: 15.15,
    type: "room",
  },
  {
    id: "engineering-lab",
    name: "Engineering Lab",
    x: 50.6,
    y: 61.45,
    width: 39.4,
    height: 15.15,
    type: "room",
  },
];

const BUILDINGS: Record<string, BuildingConfig> = {
  building1: {
    name: "Building 1",
    image: building1Map,
    hotspots: BUILDING_1_ROOMS,
  },
  building2: {
    name: "Building 2",
    image: building2Map,
    hotspots: BUILDING_2_ROOMS,
  },
  buildingCR: {
    name: "Building CR",
    image: buildingCRMap,
    hotspots: BUILDING_CR_ROOMS,
  },
  oldBuilding: {
    name: "Old Building",
    image: oldBuildingMap,
    hotspots: OLD_BUILDING_ROOMS,
  },
};

function normalizeBuildingId(value?: string): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase().replace(/[\s_-]/g, "");

  switch (normalized) {
    case "building1":
    case "building01":
      return "building1";

    case "building2":
    case "building02":
      return "building2";

    case "buildingcr":
    case "cr":
      return "buildingCR";

    case "oldbuilding":
      return "oldBuilding";

    default:
      return null;
  }
}

/**
 * Converts percentage coordinates into the original PNG's pixel space,
 * which is what InteractiveMap expects.
 */
function convertHotspotsToPixels(
  image: ImageSourcePropType,
  hotspots: PercentageHotspot[]
): MapHotspot[] {
  const resolved = Image.resolveAssetSource(image);
  const imageWidth = resolved?.width ?? 1;
  const imageHeight = resolved?.height ?? 1;

  return hotspots.map((hotspot) => ({
    id: hotspot.id,
    name: hotspot.name,
    type: hotspot.type,
    x: (hotspot.x / 100) * imageWidth,
    y: (hotspot.y / 100) * imageHeight,
    width: (hotspot.width / 100) * imageWidth,
    height: (hotspot.height / 100) * imageHeight,
  }));
}

export default function BuildingMapScreen() {
  const params = useLocalSearchParams<{
    building?: string;
    name?: string;
  }>();

  const buildingId = normalizeBuildingId(
    typeof params.building === "string" ? params.building : undefined
  );

  const config = buildingId ? BUILDINGS[buildingId] : undefined;

  const pixelHotspots = useMemo(() => {
    if (!config) {
      return [];
    }

    return convertHotspotsToPixels(config.image, config.hotspots);
  }, [config]);

  // Always return to the campus map, including if the building is invalid.
  const goToCampusMap = () => {
    router.replace("/user/campus-map" as any);
  };

  if (!config) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Building map not found</Text>
        <Text style={styles.errorMessage}>
          The selected building does not have a map configured.
        </Text>

        <Pressable
          onPress={goToCampusMap}
          style={styles.errorButton}
          accessibilityRole="button"
          accessibilityLabel="Return to Campus Map"
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleRoomPress = (hotspot: MapHotspot) => {
    router.push({
      pathname: "/user/report-damage",
      params: {
        building: buildingId ?? "",
        buildingName: config.name,
        room: hotspot.id,
        roomName: hotspot.name,
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={goToCampusMap}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Return to Campus Map"
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>{config.name}</Text>
          <Text style={styles.subtitle}>
            Tap the room where the damage occurred
          </Text>
        </View>
      </View>

      {/* MAP */}
      <View style={styles.mapArea}>
        <InteractiveMap
          image={config.image}
          hotspots={pixelHotspots}
          onPress={handleRoomPress}
          debug={false}
        />
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Pinch to zoom • Drag to move • Tap a room to continue
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  backButtonPressed: {
    opacity: 0.8,
  },

  backText: {
    color: COLORS.white,
    fontSize: 38,
    lineHeight: 42,
    marginTop: -4,
    fontWeight: "400",
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
    marginTop: 2,
  },

  mapArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  footer: {
    backgroundColor: COLORS.white,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  footerText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 11,
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.lighterMaroon,
    padding: 30,
  },

  errorTitle: {
    color: COLORS.maroon,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },

  errorMessage: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 24,
  },

  errorButton: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },

  errorButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
});