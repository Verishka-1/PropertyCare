import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { apiRequest } from "../../services/api";

type Report = {
  id: number;
  report_number?: string | null;
  title?: string | null;
  description: string;
  building_name?: string | null;
  room_name?: string | null;
  status: string;
  priority?: string | null;
  created_at: string;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

export default function AdminRoomReportsScreen() {
  const params = useLocalSearchParams<{
    building?: string;
    room?: string;
    location?: string;
  }>();

  const building = Array.isArray(params.building)
    ? params.building[0]
    : params.building;

  const room = Array.isArray(params.room)
    ? params.room[0]
    : params.room;

  const location = Array.isArray(params.location)
    ? params.location[0]
    : params.location;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const heading = room || location || building || "Location reports";

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadReports = async () => {
        setLoading(true);
        setError("");

        try {
          const query = new URLSearchParams();

          if (building) query.set("building", building);
          if (room) query.set("room", room);
          if (!building && !room && location) {
            query.set("location", location);
          }

          const suffix = query.toString();
          const response = await apiRequest(
            `/admin/map/room-reports${suffix ? `?${suffix}` : ""}`
          );

          if (active) {
            setReports(response.data ?? []);
          }
        } catch (e) {
          if (active) {
            setError("Could not load reports. Please check your connection.");
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      loadReports();

      return () => {
        active = false;
      };
    }, [building, room, location])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Damage Reports</Text>
          <Text style={styles.subtitle}>{heading}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} size="large" />
      ) : error ? (
        <Text style={styles.message}>{error}</Text>
      ) : reports.length === 0 ? (
        <Text style={styles.message}>No reports submitted for this location yet.</Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={reports}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.reportTitle}>
                {item.report_number || `Report #${item.id}`}
              </Text>

              <Text style={styles.detail}>
                Reporter: {item.user?.name || "Unknown user"}
              </Text>
              {!!item.user?.email && (
                <Text style={styles.detail}>Email: {item.user.email}</Text>
              )}

              <Text style={styles.detail}>
                Building: {item.building_name || "Not specified"}
              </Text>
              <Text style={styles.detail}>
                Room/location: {item.room_name || "Not specified"}
              </Text>

              {!!item.title && (
                <Text style={styles.detail}>Issue: {item.title}</Text>
              )}
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.detail}>
                Status: {item.status} · Priority: {item.priority || "—"}
              </Text>
              <Text style={styles.date}>
                Submitted: {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F2F3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8DDE0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#800020",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 32,
    marginTop: -3,
  },
  title: {
    color: "#800020",
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: "#666666",
    fontSize: 13,
    marginTop: 3,
  },
  list: {
    padding: 14,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E8DDE0",
  },
  reportTitle: {
    color: "#800020",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  detail: {
    color: "#444444",
    fontSize: 13,
    marginTop: 4,
  },
  description: {
    color: "#222222",
    fontSize: 14,
    marginTop: 10,
  },
  date: {
    color: "#777777",
    fontSize: 12,
    marginTop: 10,
  },
  message: {
    padding: 20,
    color: "#555555",
    textAlign: "center",
  },
});