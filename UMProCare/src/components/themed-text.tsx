import React from "react";
import { StyleSheet, Text, type TextProps } from "react-native";
import { COLORS, FONT, type ThemeColor } from "@/constants/theme";

type Props = TextProps & {
  themeColor?: ThemeColor;
  type?: "default" | "title" | "heading" | "subheading" | "body" | "small";
};

export default function ThemedText({
  style,
  themeColor = "text",
  type = "default",
  ...rest
}: Props) {
  return (
    <Text
      style={[
        styles.default,
        { color: COLORS[themeColor] },
        type === "title" && styles.title,
        type === "heading" && styles.heading,
        type === "subheading" && styles.subheading,
        type === "body" && styles.body,
        type === "small" && styles.small,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: FONT.body,
    lineHeight: 20,
  },

  title: {
    fontSize: FONT.title,
    fontWeight: "700",
    lineHeight: 32,
  },

  heading: {
    fontSize: FONT.heading,
    fontWeight: "700",
    lineHeight: 26,
  },

  subheading: {
    fontSize: FONT.subheading,
    fontWeight: "600",
    lineHeight: 22,
  },

  body: {
    fontSize: FONT.body,
    lineHeight: 20,
  },

  small: {
    fontSize: FONT.small,
    lineHeight: 17,
  },
});