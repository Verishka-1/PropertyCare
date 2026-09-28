import React from "react";

import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from "react-native";

import { COLORS } from "../constants/theme";

type Props = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
};

export default function PrimaryButton({
  title,
  onPress,
  style,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.button, style]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.maroon,
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});