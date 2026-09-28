import React, { useCallback, useState } from "react";
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

type Room = {
  name: string;
};

type Floor = {
  name: string;
  rooms: Room[];
};

type Building = {
  title: string;
  floors: Floor[];
};

type BuildingMapResponse = {
  // The API should return counts keyed by room name, e.g. "B1 309": 2.
  room_counts?: Record<string, number>;
  room_counts_by_name?: Record<string, number>;
};

const BUILDINGS: Record<string, Building> = {
  building1: {
    title: "Building 1",
    floors: [
      {
        name: "3rd Floor",
        rooms: ["B1 309", "B1 310", "B1 311", "B1 312"].map((name) => ({
          name,
        })),
      },
      {
        name: "2nd Floor",
        rooms: ["B1 205", "B1 206", "B1 207", "B1 208"].map((name) => ({
          name,
        })),
      },
      {
        name: "1st Floor",
        rooms: ["B1 101", "B1 102", "B1 103", "B1 104"].map((name) => ({
          name,
        })),
      },
    ],
  },

  building2: {
    title: "Building 2",
    floors: [
      {
        name: "3rd Floor",
        rooms: [
          "B2 313",
          "B2 314",
          "B2 315",
          "B2 316",
          "B2 317",
          "B2 318",
        ].map((name) => ({ name })),
      },
      {
        name: "2nd Floor",
        rooms: [
          "B2 212",
          "B2 211",
          "B2 210",
          "B2 209",
          "B2 208",
          "B2 207",
        ].map((name) => ({ name })),
      },
      {
        name: "1st Floor",
        rooms: [
          "B2 101",
          "B2 102",
          "B2 103",
          "B2 104",
          "B2 105",
          "B2 106",
        ].map((name) => ({ name })),
      },
    ],
  },

  buildingCR: {
    title: "Building CRs",
    floors: [
      {
        name: "3rd Floor",
        rooms: [{ name: "Female CR3" }, { name: "Male CR3" }],
      },
      {
        name: "2nd Floor",
        rooms: [{ name: "Female CR2" }, { name: "Male CR2" }],
      },
      {
        name: "1st Floor",
        rooms: [{ name: "Female CR1" }, { name: "Male CR1" }],
      },
    ],
  },

  oldBuilding: {
    title: "Old Building",
    floors: [
      {
        name: "3rd Floor",
        rooms: [{ name: "Rv302" }, { name: "Rv301" }, { name: "AVR" }],
      },
      {
        name: "2nd Floor",
        rooms: [
          { name: "ComLab2" },
          { name: "ComLab1" },
          { name: "ComLab3" },
        ],
      },
      {
        name: "1st Floor",
        rooms: [
          { name: "ElectricalLab" },
          { name: "EngineeringLab" },
        ],
      },
    ],
  },
};

/**
 * Replace these example IDs with the actual building IDs in your Laravel DB.
 * They must correspond to the building records used by /admin/building-counts.
 */
const BUILDING_DATABASE_IDS: Record<string, number> = {
  building1: 1,
  building2: 2,
  oldBuilding: 3,
  buildingCR: 4,
};

function normalizeRoomName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeRoomCounts(
  response: BuildingMapResponse
): Record<string, number> {
  const source =
    response.room_counts_by_name ??
    response.room_counts ??
    {};

  const normalized: Record<string, number> = {};

  Object.entries(source).forEach(([roomName, count]) => {
    normalized[normalizeRoomName(roomName)] = Number(count) || 0;
  });

  return normalized;
}

export default function AdminBuildingMapScreen() {
  const { building } = useLocalSearchParams<{ building?: string }>();

  const buildingId = Array.isArray(building) ? building[0] : building;
  const selectedBuildingId = buildingId || "building1";
  const selectedBuilding = BUILDINGS[selectedBuildingId];

  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadRoomCounts = useCallback(async () => {
    if (!selectedBuilding) {
      setLoading(false);
      setRefreshing(false);
      setError("Unknown building. Return to the campus map and select a building.");
      return;
    }

    const databaseBuildingId =
      BUILDING_DATABASE_IDS[selectedBuildingId];

    if (typeof databaseBuildingId !== "number") {
      setLoading(false);
      setRefreshing(false);
      setError(
        "This building has no database ID configured. Update BUILDING_DATABASE_IDS in admin-building-map.tsx."
      );
      return;
    }

    try {
      setError("");

      const response = (await apiRequest(
        `/admin/building-counts?building_id=${databaseBuildingId}`
      )) as BuildingMapResponse;

      setRoomCounts(normalizeRoomCounts(response ?? {}));
    } catch (err) {
      console.error("Failed to load room report counts:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load room report counts. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBuilding, selectedBuildingId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadRoomCounts();
    }, [loadRoomCounts])
  );

  const getRoomCount = (roomName: string): number => {
    return roomCounts[normalizeRoomName(roomName)] ?? 0;
  };

  const totalReports = selectedBuilding
    ? selectedBuilding.floors.reduce(
        (total, floor) =>
          total +
          floor.rooms.reduce(
            (floorTotal, room) =>
              floorTotal + getRoomCount(room.name),
            0
          ),
        0
      )
    : 0;

  const handleRoomPress = (roomName: string) => {
    router.push({
      pathname: "/admin/admin-room-reports",
      params: {
        building: selectedBuildingId,
        location: roomName,
        locationId: roomName,
        room: roomName,
      },
    } as any);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRoomCounts();
  };

  if (!selectedBuilding) {
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

          <Text style={styles.title}>Building Map</Text>
        </View>

        <View style={styles.centerMessage}>
          <Text style={styles.errorText}>
            Unknown building. Return to the campus map and select a building.
          </Text>
        </View>
      </View>
    );
  }

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
          <Text style={styles.title}>{selectedBuilding.title}</Text>
          <Text style={styles.subtitle}>
            Tap a room to view its damage reports
          </Text>
        </View>

        <Pressable
          onPress={handleRefresh}
          style={styles.refreshButton}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Refresh report counts"
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      {/* BUILDING SUMMARY */}
      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>
            Total reports in building
          </Text>
          <Text style={styles.summaryCount}>
            {loading ? "…" : totalReports}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.maroon} />
        ) : null}
      </View>

      {/* ERROR MESSAGE */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>

          <Pressable onPress={handleRefresh} disabled={loading}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {/* FLOORS AND ROOMS */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {selectedBuilding.floors.map((floor) => (
          <View key={floor.name} style={styles.floorSection}>
            <Text style={styles.floorTitle}>{floor.name}</Text>

            <View style={styles.roomsGrid}>
              {floor.rooms.map((room) => {
                const count = getRoomCount(room.name);

                return (
                  <Pressable
                    key={room.name}
                    onPress={() => handleRoomPress(room.name)}
                    style={({ pressed }) => [
                      styles.roomCard,
                      count > 0 && styles.roomCardWithReports,
                      pressed && styles.roomCardPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${room.name}, ${count} reports. View reports`}
                  >
                    <Text style={styles.roomName}>{room.name}</Text>

                    <View
                      style={[
                        styles.countBadge,
                        count > 0 && styles.countBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.countText,
                          count > 0 && styles.countTextActive,
                        ]}
                      >
                        {loading ? "…" : count}
                      </Text>
                    </View>

                    <Text style={styles.reportLabel}>
                      {count === 1 ? "report" : "reports"}
                    </Text>

                    <Text style={styles.tapHint}>
                      View reports ›
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Room counts show saved reports for this building.
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
    marginTop: 2,
  },

  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: COLORS.lighterMaroon,
    marginLeft: 8,
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
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  summaryCount: {
    color: COLORS.maroon,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 3,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 18,
  },

  floorSection: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  floorTitle: {
    color: COLORS.maroon,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 14,
  },

  roomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 10,
  },

  roomCard: {
    width: "31%",
    minHeight: 112,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  roomCardWithReports: {
    borderColor: COLORS.maroon,
    backgroundColor: "#FFF5F5",
  },

  roomCardPressed: {
    opacity: 0.75,
  },

  roomName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: 14,
    backgroundColor: "#EEEEEE",
    alignItems: "center",
    justifyContent: "center",
  },

  countBadgeActive: {
    backgroundColor: COLORS.maroon,
  },

  countText: {
    color: "#333333",
    fontSize: 13,
    fontWeight: "800",
  },

  countTextActive: {
    color: "#FFFFFF",
  },

  reportLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },

  tapHint: {
    color: COLORS.maroon,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 5,
  },

  footer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  footerText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textAlign: "center",
  },

  errorBanner: {
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FFF0F0",
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

  centerMessage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});