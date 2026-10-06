export const COLORS = {
  maroon: "#800020",
  darkMaroon: "#5C0018",
  mediumMaroon: "#9B1C31",

  lightMaroon: "#F7E8EC",
  lighterMaroon: "#FCF4F6",

  white: "#FFFFFF",
  black: "#222222",

  gray: "#777777",
  lightGray: "#F4F4F4",
  border: "#DDDDDD",

  // Text colors
  text: "#222222",
  textSecondary: "#777777",

  // Status colors
  green: "#2E7D32",
  lightGreen: "#E8F5E9",

  orange: "#C77700",
  lightOrange: "#FFF3CD",

  blue: "#2563EB",
  lightBlue: "#E8F0FE",

  red: "#C62828",
  lightRed: "#FFEBEE",
} as const;

export type ThemeColor = keyof typeof COLORS;

export const SIZES = {
  small: 8,
  medium: 14,
  large: 20,
  xlarge: 28,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT = {
  title: 24,
  heading: 19,
  subheading: 16,
  body: 14,
  small: 12,
  mono: "monospace",
} as const;