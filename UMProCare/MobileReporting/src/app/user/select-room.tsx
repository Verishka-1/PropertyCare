import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import RoomCard from "../../components/RoomCard";
import { COLORS, Spacing } from "../../constants/theme";
import { apiRequest } from "../../services/api";

type Room = {
  id: number | string;
  name: string;
};

type Building = {
  id: number | string;
  name: string;
  rooms: Room[];
};

export default function SelectRoomScreen() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLocations = useCallback(async () => {
    setError("");

    try {
      const response = await apiRequest("/locations");
      const rows: Building[] = Array.isArray(response?.data)
        ? response.data
        : [];

      setBuildings(rows);

      setSelectedBuilding((current) => {
        if (current && rows.some((building) => String(building.id) === current)) {
          return current;
        }
        return rows.length ? String(rows[0].id) : null;
      });
    } catch (err: any) {
      setError(err?.message || "Could not load buildings and rooms.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadLocations();
    }, [loadLocations])
  );

  const currentBuilding = useMemo(
    () =>
      buildings.find(
        (building) => String(building.id) === selectedBuilding
      ),
    [buildings, selectedBuilding]
  );

  const filteredRooms = currentBuilding?.rooms ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>Select Room</Text>
          <Text style={styles.subtitle}>
            Where did the damage occur?
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Building</Text>

        {loading ? (
          <View style={styles.message}>
            <ActivityIndicator color={COLORS.maroon} />
            <Text style={styles.messageText}>Loading locations...</Text>
          </View>
        ) : error ? (
          <View style={styles.message}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadLocations}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : buildings.length === 0 ? (
          <View style={styles.message}>
            <Text style={styles.messageText}>
              No buildings have been added yet.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.buildingList}
          >
            {buildings.map((building) => {
              const selected = selectedBuilding === String(building.id);

              return (
                <TouchableOpacity
                  key={building.id}
                  style={[
                    styles.buildingButton,
                    selected && styles.buildingButtonSelected,
                  ]}
                  onPress={() => setSelectedBuilding(String(building.id))}
                >
                  <Text
                    style={[
                      styles.buildingText,
                      selected && styles.buildingTextSelected,
                    ]}
                  >
                    {building.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>Rooms</Text>

        {!loading && !error && filteredRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room as React.ComponentProps<typeof RoomCard>["room"]}
            onPress={() =>
              router.push({
                pathname: "/user/report-damage",
                params: {
                  building: String(currentBuilding?.id ?? ""),
                  buildingName: currentBuilding?.name ?? "",
                  room: String(room.id),
                  roomName: room.name,
                },
              })
            }
          />
        ))}

        {!loading && !error && buildings.length > 0 && filteredRooms.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No rooms found in this building.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighterMaroon,
  },

  header: {
    backgroundColor: COLORS.maroon,
    paddingTop: 55,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },

  back: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },

  title: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "800",
  },

  subtitle: {
    color: "#F3DDE3",
    fontSize: 12,
    marginTop: 4,
  },

  content: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },

  buildingList: {
    paddingBottom: Spacing.md,
  },

  buildingButton: {
    borderWidth: 1,
    borderColor: COLORS.maroon,
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginRight: Spacing.sm,
  },

  buildingButtonSelected: {
    backgroundColor: COLORS.maroon,
  },

  buildingText: {
    color: COLORS.maroon,
    fontSize: 12,
    fontWeight: "700",
  },

  buildingTextSelected: {
    color: COLORS.white,
  },

  empty: {
    backgroundColor: COLORS.white,
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: "center",
  },

  emptyText: {
    color: COLORS.textSecondary,
  },

  message: {
    backgroundColor: COLORS.white,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: Spacing.md,
  },

  messageText: {
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },

  errorText: {
    color: "#B42318",
    textAlign: "center",
  },

  retryButton: {
    marginTop: Spacing.md,
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: COLORS.maroon,
    borderRadius: 8,
  },

  retryText: {
    color: COLORS.white,
    fontWeight: "700",
  },
});