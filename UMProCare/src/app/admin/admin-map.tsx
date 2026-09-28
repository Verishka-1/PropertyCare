import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { apiRequest } from "../../services/api";

type Room = {
  id: string;
  name: string;
};

type Building = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  rooms: Room[];
};

type BuildingCountsResponse = {
  room_counts?: Record<string, number | string>;
};

const buildings: Building[] = [
  {
    id: "building1",
    name: "Building 1",
    image: require("../../../assets/maps/Building1.png"),
    rooms: [
      { id: "br202", name: "Br202" },
      { id: "br201", name: "Br201" },
      { id: "br200", name: "Br200" },
      { id: "br103", name: "Br103" },
      { id: "br102", name: "Br102" },
      { id: "br101", name: "Br101" },
      { id: "br010", name: "Br010" },
      { id: "br011", name: "Br011" },
      { id: "br012", name: "Br012" },
    ],
  },
  {
    id: "building2",
    name: "Building 2",
    image: require("../../../assets/maps/Building2.png"),
    rooms: [
      { id: "br312", name: "Br312" },
      { id: "br313", name: "Br313" },
      { id: "br314", name: "Br314" },
      { id: "br315", name: "Br315" },
      { id: "br316", name: "Br316" },
      { id: "br317", name: "Br317" },
      { id: "br211", name: "Br211" },
      { id: "br210", name: "Br210" },
      { id: "br209", name: "Br209" },
      { id: "br208", name: "Br208" },
      { id: "br207", name: "Br207" },
      { id: "br206", name: "Br206" },
      { id: "br111", name: "Br111" },
      { id: "br110", name: "Br110" },
      { id: "br109", name: "Br109" },
      { id: "br108", name: "Br108" },
      { id: "br107", name: "Br107" },
      { id: "br106", name: "Br106" },
    ],
  },
  {
    id: "buildingCR",
    name: "Building CR",
    image: require("../../../assets/maps/BuildingCR.png"),
    rooms: [
      { id: "female-cr3", name: "Female CR3" },
      { id: "male-cr3", name: "Male CR3" },
      { id: "female-cr2", name: "Female CR2" },
      { id: "male-cr2", name: "Male CR2" },
      { id: "female-cr1", name: "Female CR1" },
      { id: "male-cr1", name: "Male CR1" },
    ],
  },
  {
    id: "oldBuilding",
    name: "Old Building",
    image: require("../../../assets/maps/Old_Building.png"),
    rooms: [
      { id: "rv302", name: "Rv302" },
      { id: "rv301", name: "Rv301" },
      { id: "avr", name: "AVR" },
      { id: "comlabv2", name: "ComLabV2" },
      { id: "comlabv1", name: "ComLabV1" },
      { id: "comlabv3", name: "ComLabV3" },
      { id: "electrical-lab", name: "ElectricalLab" },
      { id: "engineering-lab", name: "EngineeringLab" },
    ],
  },
];

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getRoomCount(
  room: Room,
  counts: Record<string, number | string> | undefined
) {
  if (!counts) return 0;

  // Accept either a room label (e.g. "Br202") or room ID (e.g. "br202")
  // as the key returned by the API.
  const key = Object.keys(counts).find(
    (candidate) =>
      normalizeName(candidate) === normalizeName(room.name) ||
      normalizeName(candidate) === normalizeName(room.id)
  );

  return key ? Number(counts[key]) || 0 : 0;
}

export default function AdminMap() {
  const router = useRouter();
  const params = useLocalSearchParams<{ building?: string }>();
  const requestedBuilding = Array.isArray(params.building)
    ? params.building[0]
    : params.building;

  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    () =>
      requestedBuilding &&
      buildings.some((item) => item.id === requestedBuilding)
        ? requestedBuilding
        : null
  );

  const [countsByBuilding, setCountsByBuilding] = useState<
    Record<string, Record<string, number | string>>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCounts = useCallback(async () => {
    try {
      setError("");

      const responses = await Promise.all(
        buildings.map(async (building) => {
          const response = (await apiRequest(
            `/admin/building-map/counts?building=${encodeURIComponent(
              building.id
            )}`
          )) as BuildingCountsResponse;

          return {
            buildingId: building.id,
            roomCounts: response?.room_counts ?? {},
          };
        })
      );

      const nextCounts: Record<
        string,
        Record<string, number | string>
      > = {};

      responses.forEach((item) => {
        nextCounts[item.buildingId] = item.roomCounts;
      });

      setCountsByBuilding(nextCounts);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load report counts. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCounts();
    }, [loadCounts])
  );

  const buildingReportCounts = useMemo(
    () =>
      buildings.map((building) => {
        const roomCounts = countsByBuilding[building.id];

        const reportCount = building.rooms.reduce(
          (total, room) => total + getRoomCount(room, roomCounts),
          0
        );

        return {
          ...building,
          reportCount,
        };
      }),
    [countsByBuilding]
  );

  const totalReports = buildingReportCounts.reduce(
    (total, building) => total + building.reportCount,
    0
  );

  const selectedBuilding = buildingReportCounts.find(
    (building) => building.id === selectedBuildingId
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadCounts();
  };

  const openRoomReports = (building: Building, room: Room) => {
    router.push({
      pathname: "/admin/admin-room-reports",
      params: {
        buildingId: building.id,
        roomId: room.id,
        roomName: room.name,
        location: room.name,
        locationId: room.id,
      },
    } as any);
  };

  // Building list
  if (!selectedBuilding) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Admin Map</Text>
            <Text style={styles.subtitle}>
              Monitor property damage reports by location
            </Text>
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Reports</Text>
            <Text style={styles.totalNumber}>
              {loading ? "…" : totalReports}
            </Text>
            {loading ? (
              <ActivityIndicator
                style={styles.totalLoader}
                color="#991b1b"
              />
            ) : null}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={handleRefresh}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Buildings</Text>

          {buildingReportCounts.map((building) => (
            <Pressable
              key={building.id}
              style={styles.buildingCard}
              onPress={() => setSelectedBuildingId(building.id)}
            >
              <Image
                source={building.image}
                style={styles.previewImage}
                resizeMode="cover"
              />

              <View style={styles.buildingInfo}>
                <Text style={styles.buildingName}>{building.name}</Text>
                <Text style={styles.roomCount}>
                  {building.rooms.length} rooms
                </Text>
              </View>

              <View
                style={[
                  styles.reportBadge,
                  building.reportCount === 0 && styles.emptyReportBadge,
                ]}
              >
                <Text
                  style={[
                    styles.reportBadgeText,
                    building.reportCount === 0 &&
                      styles.emptyReportBadgeText,
                  ]}
                >
                  {loading ? "…" : building.reportCount}
                </Text>
                <Text
                  style={[
                    styles.reportBadgeLabel,
                    building.reportCount === 0 &&
                      styles.emptyReportBadgeText,
                  ]}
                >
                  reports
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Selected building and room list
  const selectedRoomCounts = countsByBuilding[selectedBuilding.id] ?? {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapHeader}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (requestedBuilding) {
              router.back();
            } else {
              setSelectedBuildingId(null);
            }
          }}
          hitSlop={8}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.mapHeaderInfo}>
          <Text style={styles.mapTitle}>{selectedBuilding.name}</Text>
          <Text style={styles.mapSubtitle}>
            {loading ? "Loading report count…" : `${selectedBuilding.reportCount} total reports`}
          </Text>
        </View>

        <Pressable
          onPress={handleRefresh}
          style={styles.refreshButton}
          accessibilityRole="button"
          accessibilityLabel="Refresh report counts"
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        style={styles.mapContainer}
        contentContainerStyle={styles.mapContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <Image
          source={selectedBuilding.image}
          style={styles.mapImage}
          resizeMode="contain"
        />

        <View style={styles.roomPanel}>
          <Text style={styles.roomPanelTitle}>Room Reports</Text>

          {selectedBuilding.rooms.map((room) => {
            const count = getRoomCount(room, selectedRoomCounts);

            return (
              <Pressable
                key={room.id}
                style={styles.roomRow}
                onPress={() => openRoomReports(selectedBuilding, room)}
              >
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <Text style={styles.roomStatus}>
                    {loading
                      ? "Loading…"
                      : count === 0
                        ? "No reports"
                        : `${count} damage ${count === 1 ? "report" : "reports"}`}
                  </Text>
                </View>

                <View
                  style={[
                    styles.roomBadge,
                    count === 0 && styles.emptyRoomBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.roomBadgeText,
                      count === 0 && styles.emptyRoomBadgeText,
                    ]}
                  >
                    {loading ? "…" : count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6f8",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 5,
    fontSize: 15,
    color: "#6b7280",
  },
  totalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 25,
  },
  totalLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  totalNumber: {
    fontSize: 38,
    fontWeight: "800",
    marginTop: 4,
    color: "#111827",
  },
  totalLoader: {
    position: "absolute",
    right: 20,
    top: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },
  buildingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    marginBottom: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  previewImage: {
    width: 75,
    height: 75,
    borderRadius: 12,
  },
  buildingInfo: {
    flex: 1,
    marginLeft: 14,
  },
  buildingName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  roomCount: {
    marginTop: 5,
    color: "#6b7280",
    fontSize: 13,
  },
  reportBadge: {
    minWidth: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyReportBadge: {
    backgroundColor: "#e5e7eb",
  },
  reportBadgeText: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "800",
  },
  reportBadgeLabel: {
    color: "#ffffff",
    fontSize: 9,
    marginTop: 1,
  },
  emptyReportBadgeText: {
    color: "#6b7280",
  },
  mapHeader: {
    minHeight: 75,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  backText: {
    fontSize: 38,
    color: "#111827",
  },
  mapHeaderInfo: {
    flex: 1,
    marginLeft: 5,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  mapSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  refreshText: {
    color: "#991b1b",
    fontSize: 12,
    fontWeight: "700",
  },
  mapContainer: {
    flex: 1,
  },
  mapContent: {
    padding: 12,
    paddingBottom: 24,
  },
  mapImage: {
    width: "100%",
    height: 340,
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },
  roomPanel: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
  },
  roomPanelTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
    color: "#111827",
  },
  roomRow: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roomInfo: {
    flex: 1,
    paddingVertical: 8,
  },
  roomName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  roomStatus: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 3,
  },
  roomBadge: {
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  emptyRoomBadge: {
    backgroundColor: "#e5e7eb",
  },
  roomBadgeText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  emptyRoomBadgeText: {
    color: "#6b7280",
  },
  errorBox: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff0f0",
  },
  errorText: {
    color: "#a00000",
    fontSize: 12,
  },
  retryText: {
    color: "#991b1b",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
  },
});