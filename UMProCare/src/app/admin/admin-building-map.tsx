import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  Image,
  type ImageSourcePropType,
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

import AdminInteractiveMap, {
  type MapHotspot,
} from "../../components/AdminInteractiveMap";

import {
  COLORS,
  Spacing,
} from "../../constants/theme";

import { apiRequest } from "../../services/api";

/* =========================================================
 * BUILDING MAP IMAGES
 * ======================================================= */

const building1Map =
  require("../../../assets/maps/Building1.png");

const building2Map =
  require("../../../assets/maps/Building2.png");

const buildingCRMap =
  require("../../../assets/maps/BuildingCR.png");

const oldBuildingMap =
  require("../../../assets/maps/Old_Building.png");

/* =========================================================
 * HOTSPOT TYPES
 * ======================================================= */

type PercentageHotspot = {
  id: string;
  name: string;

  x: number;
  y: number;
  width: number;
  height: number;

  type:
    | "building"
    | "facility"
    | "room";
};

type BuildingConfig = {
  name: string;
  image: ImageSourcePropType;
  hotspots: PercentageHotspot[];
};

/* =========================================================
 * BUILDING 1
 * ======================================================= */

const BUILDING_1_ROOMS: PercentageHotspot[] = [
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

/* =========================================================
 * BUILDING 2
 * ======================================================= */

const BUILDING_2_ROOMS: PercentageHotspot[] = [
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

/* =========================================================
 * BUILDING CR
 * ======================================================= */

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

/* =========================================================
 * OLD BUILDING
 * ======================================================= */

const OLD_BUILDING_ROOMS: PercentageHotspot[] = [
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

/* =========================================================
 * BUILDINGS
 * ======================================================= */

const BUILDINGS: Record<
  string,
  BuildingConfig
> = {
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

/* =========================================================
 * NORMALIZE BUILDING ID
 * ======================================================= */

function normalizeBuildingId(
  value?: string
): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .toLowerCase()
    .replace(/[\s_-]/g, "");

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

/* =========================================================
 * NORMALIZE ROOM NAME
 * ======================================================= */

function normalizeRoomName(
  name: string
): string {
  let value = name
    .trim()
    .toLowerCase();

  /*
   * B1 309 -> 309
   * B2 313 -> 313
   */
  value = value.replace(
    /^b(?:1|2)\s*/,
    ""
  );

  /*
   * RV302 -> 302
   * RV301 -> 301
   */
  value = value.replace(
    /^rv\s*/,
    ""
  );

  /*
   * Remove spaces, -, _, etc.
   */
  return value.replace(
    /[^a-z0-9]/g,
    ""
  );
}

/* =========================================================
 * CONVERT PERCENTAGE HOTSPOTS
 * TO REAL PNG PIXELS
 * ======================================================= */

function convertHotspotsToPixels(
  image: ImageSourcePropType,
  hotspots: PercentageHotspot[]
): MapHotspot[] {
  const resolved =
    Image.resolveAssetSource(image);

  const imageWidth =
    resolved?.width ?? 1;

  const imageHeight =
    resolved?.height ?? 1;

  return hotspots.map(
    (hotspot) => ({
      id: hotspot.id,

      name: hotspot.name,

      type: hotspot.type,

      x:
        (hotspot.x / 100) *
        imageWidth,

      y:
        (hotspot.y / 100) *
        imageHeight,

      width:
        (hotspot.width / 100) *
        imageWidth,

      height:
        (hotspot.height / 100) *
        imageHeight,
    })
  );
}

/* =========================================================
 * API RESPONSE
 * ======================================================= */

type BuildingMapResponse = {
  building?: string;

  building_id?: number;

  room_counts?: Record<
    string,
    number
  >;

  room_counts_by_name?: Record<
    string,
    number
  >;

  message?: string;
};

/* =========================================================
 * CREATE REPORT COUNTS
 * ======================================================= */

/*
 * IMPORTANT:
 *
 * The frontend does NOT remove Pending.
 *
 * The backend endpoint should return:
 *
 * Pending       -> INCLUDED
 * Verified      -> INCLUDED
 * For Repair    -> INCLUDED
 * Repaired      -> INCLUDED
 * Any other     -> INCLUDED
 *
 * Completed     -> EXCLUDED
 * Rejected      -> EXCLUDED
 *
 * Therefore whatever counts arrive here are displayed
 * directly on the corresponding room.
 */

function createReportCountsByHotspot(
  response: BuildingMapResponse,
  hotspots: MapHotspot[]
): Record<string, number> {
  const source =
    response.room_counts_by_name ??
    response.room_counts ??
    {};

  /*
   * Build normalized lookup.
   */
  const normalizedCounts: Record<
    string,
    number
  > = {};

  Object.entries(source).forEach(
    ([roomName, count]) => {
      const key =
        normalizeRoomName(roomName);

      if (!key) {
        return;
      }

      /*
       * If multiple database aliases resolve
       * to the same room, add them instead of
       * overwriting them.
       *
       * Normally there should only be one.
       */
      normalizedCounts[key] =
        Number(count) || 0;
    }
  );

  /*
   * Start every visible hotspot at zero.
   */
  const result: Record<
    string,
    number
  > = {};

  hotspots.forEach(
    (hotspot) => {
      result[hotspot.id] = 0;
    }
  );

  /*
   * Match each map hotspot to the backend room.
   */
  hotspots.forEach(
    (hotspot) => {
      const key =
        normalizeRoomName(
          hotspot.name
        );

      result[hotspot.id] =
        normalizedCounts[key] ?? 0;
    }
  );

  return result;
}

/* =========================================================
 * SCREEN
 * ======================================================= */

export default function AdminBuildingMapScreen() {
  const params =
    useLocalSearchParams<{
      building?: string;
      name?: string;
    }>();

  const buildingId =
    Array.isArray(params.building)
      ? params.building[0]
      : params.building;

  const buildingName =
    Array.isArray(params.name)
      ? params.name[0]
      : params.name;

  const selectedBuildingId =
    normalizeBuildingId(
      buildingId
    );

  const selectedBuilding =
    selectedBuildingId
      ? BUILDINGS[
          selectedBuildingId
        ]
      : undefined;

  /* =======================================================
   * HOTSPOTS
   * ===================================================== */

  const pixelHotspots =
    useMemo(() => {
      if (!selectedBuilding) {
        return [];
      }

      return convertHotspotsToPixels(
        selectedBuilding.image,
        selectedBuilding.hotspots
      );
    }, [selectedBuilding]);

  /* =======================================================
   * REPORT COUNTS
   * ===================================================== */

  const [
    reportCounts,
    setReportCounts,
  ] = useState<
    Record<string, number>
  >({});

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

  /* =======================================================
   * LOAD REAL COUNTS
   * ===================================================== */

  const loadReportCounts =
    useCallback(async () => {
      if (
        !selectedBuilding ||
        !selectedBuildingId
      ) {
        setLoading(false);
        setRefreshing(false);

        setError(
          "Building map not found."
        );

        return;
      }

      try {
        setError("");

        const queryBuilding =
          encodeURIComponent(
            selectedBuildingId
          );

        console.log(
          "Loading admin building counts:",
          selectedBuildingId
        );

        const response =
          (await apiRequest(
            `/admin/building-map/counts?building=${queryBuilding}`
          )) as BuildingMapResponse;

        console.log(
          "ADMIN BUILDING COUNT RESPONSE:",
          JSON.stringify(
            response,
            null,
            2
          )
        );

        /*
         * The backend is responsible for excluding
         * Completed and Rejected.
         *
         * Pending is intentionally NOT filtered
         * on the frontend.
         */
        const counts =
          createReportCountsByHotspot(
            response ?? {},
            pixelHotspots
          );

        console.log(
          "COUNTS USED BY BUILDING MAP:",
          counts
        );

        setReportCounts(
          counts
        );
      } catch (err) {
        console.error(
          "Failed to load admin building report counts:",
          err
        );

        setReportCounts({});

        setError(
          err instanceof Error
            ? err.message
            : "Could not load report counts."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [
      selectedBuilding,
      selectedBuildingId,
      pixelHotspots,
    ]);

  /* =======================================================
   * RELOAD WHEN SCREEN OPENS
   * ===================================================== */

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      loadReportCounts();
    }, [loadReportCounts])
  );

  /* =======================================================
   * TOTAL ACTIVE REPORTS
   * ======================================================= */

  const totalReports =
    Object.values(
      reportCounts
    ).reduce(
      (total, count) =>
        total +
        Number(count || 0),
      0
    );

  /* =======================================================
   * ROOM PRESS
   * ===================================================== */

  const handleRoomPress = (
    hotspot: MapHotspot
  ) => {
    const count =
      reportCounts[
        hotspot.id
      ] ?? 0;

    console.log(
      "OPENING ADMIN ROOM:",
      {
        building:
          selectedBuildingId,

        buildingName:
          buildingName ||
          selectedBuilding?.name,

        room:
          hotspot.name,

        activeReportCount:
          count,
      }
    );

    router.push({
      pathname:
        "/admin/admin-room-reports",

      params: {
        building:
          selectedBuildingId,

        buildingName:
          buildingName ||
          selectedBuilding?.name ||
          "",

        location:
          hotspot.name,

        locationId:
          hotspot.name,

        room:
          hotspot.name,
      },
    } as any);
  };

  /* =======================================================
   * REFRESH
   * ===================================================== */

  const handleRefresh =
    () => {
      setRefreshing(true);

      loadReportCounts();
    };

  /* =======================================================
   * BACK TO CAMPUS MAP
   * ===================================================== */

  const handleBackToCampus =
    () => {
      /*
       * Explicitly return to the Campus Map.
       */
      router.replace(
        "/admin/admin-campus-map"
      );
    };

  /* =======================================================
   * INVALID BUILDING
   * ======================================================= */

  if (!selectedBuilding) {
    return (
      <View
        style={
          styles.errorContainer
        }
      >
        <Text
          style={
            styles.errorTitle
          }
        >
          Building map not found
        </Text>

        <Text
          style={
            styles.errorMessage
          }
        >
          The selected building does
          not have a map configured.
        </Text>

        <Pressable
          onPress={
            handleBackToCampus
          }
          style={
            styles.errorButton
          }
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back to Campus Map"
        >
          <Text
            style={
              styles.errorButtonText
            }
          >
            Back to Campus Map
          </Text>
        </Pressable>
      </View>
    );
  }

  /* =======================================================
   * SCREEN
   * ======================================================= */

  return (
    <View
      style={
        styles.container
      }
    >
      {/* ====================================================
          HEADER
          ==================================================== */}

      <View
        style={
          styles.header
        }
      >
        <Pressable
          onPress={
            handleBackToCampus
          }
          style={
            styles.backButton
          }
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back to Campus Map"
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
            {buildingName ||
              selectedBuilding.name}
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Tap a room to view its reports
          </Text>
        </View>

        <Pressable
          onPress={
            handleRefresh
          }
          style={[
            styles.refreshButton,

            loading &&
              styles.refreshButtonDisabled,
          ]}
          disabled={
            loading
          }
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

      {/* ====================================================
          SUMMARY
          ==================================================== */}

      <View
        style={
          styles.summary
        }
      >
        <View>
          <Text
            style={
              styles.summaryLabel
            }
          >
            Active reports in building
          </Text>

          <Text
            style={
              styles.summaryCount
            }
          >
            {loading
              ? "…"
              : totalReports}
          </Text>

          <Text
            style={
              styles.summarySubtext
            }
          >
            Completed and rejected reports
            are excluded
          </Text>
        </View>
      </View>

      {/* ====================================================
          ERROR
          ==================================================== */}

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

      {/* ====================================================
          MAP
          ==================================================== */}

      <ScrollView
        style={
          styles.mapScroll
        }
        contentContainerStyle={
          styles.mapScrollContent
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
        <View
          style={
            styles.mapCard
          }
        >
          <AdminInteractiveMap
            image={
              selectedBuilding.image
            }
            hotspots={
              pixelHotspots
            }
            reportCounts={
              reportCounts
            }
            onPress={
              handleRoomPress
            }
            debug={false}
          />
        </View>
      </ScrollView>

      {/* ====================================================
          FOOTER
          ==================================================== */}

      <View
        style={
          styles.footer
        }
      >
        <Text
          style={
            styles.footerText
          }
        >
          Red numbers show active damage
          reports for each room.
        </Text>

        <Text
          style={
            styles.footerSubtext
          }
        >
          Pending reports are included.
        </Text>
      </View>
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

    /* =====================================================
     * HEADER
     * =================================================== */

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

      borderBottomWidth:
        1,

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

      fontWeight:
        "800",
    },

    subtitle: {
      color:
        COLORS.textSecondary,

      fontSize: 11,

      marginTop: 2,
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
      color:
        COLORS.maroon,

      fontSize: 12,

      fontWeight:
        "700",
    },

    /* =====================================================
     * SUMMARY
     * =================================================== */

    summary: {
      margin: 12,

      padding: 14,

      borderRadius: 10,

      backgroundColor:
        COLORS.white,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    summaryLabel: {
      color:
        COLORS.textSecondary,

      fontSize: 12,
    },

    summaryCount: {
      color:
        COLORS.maroon,

      fontSize: 24,

      fontWeight:
        "800",

      marginTop: 3,
    },

    summarySubtext: {
      color:
        COLORS.textSecondary,

      fontSize: 10,

      marginTop: 2,
    },

    /* =====================================================
     * MAP
     * =================================================== */

    mapScroll: {
      flex: 1,
    },

    mapScrollContent: {
      paddingBottom: 18,
    },

    mapCard: {
      backgroundColor:
        COLORS.white,

      overflow:
        "hidden",

      minHeight: 500,
    },

    /* =====================================================
     * FOOTER
     * =================================================== */

    footer: {
      paddingVertical: 10,

      paddingHorizontal: 16,

      backgroundColor:
        COLORS.white,

      borderTopWidth:
        1,

      borderTopColor:
        COLORS.border,
    },

    footerText: {
      color:
        COLORS.textSecondary,

      fontSize: 10,

      textAlign:
        "center",
    },

    footerSubtext: {
      color:
        COLORS.textSecondary,

      fontSize: 10,

      textAlign:
        "center",

      marginTop: 3,
    },

    /* =====================================================
     * ERROR
     * =================================================== */

    errorBanner: {
      marginHorizontal: 12,

      marginBottom: 10,

      padding: 12,

      borderRadius: 8,

      backgroundColor:
        "#FFF0F0",
    },

    errorText: {
      color:
        "#A00000",

      fontSize: 12,
    },

    retryText: {
      color:
        COLORS.maroon,

      fontSize: 12,

      fontWeight:
        "800",

      marginTop: 6,
    },

    errorContainer: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        COLORS.lighterMaroon,

      padding: 30,
    },

    errorTitle: {
      color:
        COLORS.maroon,

      fontSize: 20,

      fontWeight:
        "800",

      marginBottom: 8,

      textAlign:
        "center",
    },

    errorMessage: {
      color:
        COLORS.textSecondary,

      fontSize: 13,

      textAlign:
        "center",

      marginBottom: 24,
    },

    errorButton: {
      backgroundColor:
        COLORS.maroon,

      paddingHorizontal: 24,

      paddingVertical: 12,

      borderRadius: 10,
    },

    errorButtonText: {
      color:
        COLORS.white,

      fontWeight:
        "700",

      fontSize: 14,
    },
  });