import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS, Spacing } from "@/constants/theme";
import type { Room } from "../data/rooms";

type Props = {
  room: Room;
  onPress: () => void;

  // Used by the admin screen
  showReportCount?: boolean;

  // Number of reports for this room
  reportCount?: number;
};

export default function RoomCard({
  room,
  onPress,
  showReportCount = false,
  reportCount = 0,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>
          {room.name}
        </Text>

        <Text style={styles.building}>
          {room.building}
        </Text>

        <Text style={styles.floor}>
          {room.floor}
        </Text>
      </View>

      {showReportCount && (
        <View style={styles.reportBox}>
          <Text style={styles.reportNumber}>
            {reportCount}
          </Text>

          <Text style={styles.reportLabel}>
            Reports
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  roomInfo: {
    flex: 1,
  },

  roomName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.maroon,
    marginBottom: 4,
  },

  building: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 2,
  },

  floor: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  reportBox: {
    minWidth: 62,
    paddingVertical: 8,
    paddingHorizontal: 10,

    borderRadius: 10,
    backgroundColor: COLORS.lightMaroon,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: Spacing.sm,
  },

  reportNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.maroon,
  },

  reportLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});