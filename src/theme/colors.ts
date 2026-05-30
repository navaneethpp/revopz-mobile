const PALETTE = {
  // Slate
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",
  slate950: "#111827",

  // Gray
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray900: "#111827",

  // Emerald
  emerald50: "#ECFDF5",
  emerald100: "#D1FAE5",
  emerald200: "#A7F3D0",
  emerald500: "#10B981",
  emerald600: "#059669",

  // Amber
  amber50: "#FFFBEB",
  amber100: "#FEF3C7",
  amber600: "#D97706",
  amber700: "#B45309",

  // Red
  red50: "#FEF2F2",
  red100: "#FEE2E2",
  red300: "#FCA5A5",
  red500: "#EF4444",
  red600: "#DC2626",
  redDark: "#BA1A1A",

  // Blue
  blue50: "#EFF6FF",
  blue100: "#BFDBFE",
  blue500: "#3B82F6",
  blueClassic: "#3B82F6",
  blue600: "#2563EB",
  blue700: "#1D4ED8",
  blueAccent: "#0B57D0",
  blueLink: "#0f52cc",

  // Basics
  white: "#FFFFFF",
  black: "#000000",
  offBlack: "#191C1E",
  darkCharcoal: "#434655",
  lightGray: "#F4F4F4",
};

export const COLORS = {
  ...PALETTE,

  primary: PALETTE.slate950,
  secondary: PALETTE.emerald600,
  warning: PALETTE.amber600,
  error: PALETTE.redDark,

  background: PALETTE.slate50,
  backgroundSecondary: PALETTE.slate100,
  surface: PALETTE.white,
  card: PALETTE.white,

  border: PALETTE.slate200,

  textPrimary: PALETTE.offBlack,
  textSecondary: PALETTE.darkCharcoal,
  textMuted: PALETTE.slate500,

  success: PALETTE.emerald600,

  inputBackground: PALETTE.white,
};