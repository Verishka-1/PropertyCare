import React from "react";
import {
  TextInput,
  StyleSheet,
  Text,
  View,
  TextInputProps,
} from "react-native";

import { COLORS } from "../constants/theme";

type Props = TextInputProps & {
  label: string;
};

export default function InputField({
  label,
  ...props
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#999"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 7,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: COLORS.white,
    color: "#333333",
  },
});