import { Platform } from "react-native";

export const colors = {
  // Primary (Köfte Turuncusu - Enerjik ve Güven Veren)
  primary: "#FF6B00",
  primaryDark: "#CC5500",
  primaryLight: "#FFF0E5",
  
  // Secondary (Koyu Lacivert / Siyah - Premium His)
  secondary: "#1A1B25",
  secondaryLight: "#2A2D3E",
  
  // Backgrounds
  background: "#F8F9FA", // Soft gri/beyaz
  surface: "#FFFFFF",
  card: "#FFFFFF",
  
  // Text
  text: "#1A1B25",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  
  // States
  border: "#E5E7EB",
  success: "#10B981",
  successLight: "#D1FAE5",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  warning: "#F59E0B",
  info: "#3B82F6",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const shadows = {
  sm: Platform.select({
    ios: { shadowColor: colors.secondary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
    android: { elevation: 2 },
    web: { boxShadow: "0px 2px 4px rgba(26, 27, 37, 0.05)" },
  }),
  md: Platform.select({
    ios: { shadowColor: colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
    android: { elevation: 4 },
    web: { boxShadow: "0px 4px 8px rgba(26, 27, 37, 0.08)" },
  }),
  lg: Platform.select({
    ios: { shadowColor: colors.secondary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16 },
    android: { elevation: 8 },
    web: { boxShadow: "0px 8px 16px rgba(26, 27, 37, 0.12)" },
  }),
};

