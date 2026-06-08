/**
 * CardioIA Material Design 3 theme for React Native Paper.
 * Medical-focused color palette (red primary, matching web dashboard).
 */

import { MD3LightTheme } from "react-native-paper";

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#DC2626",
    primaryContainer: "#FEE2E2",
    secondary: "#1E40AF",
    secondaryContainer: "#DBEAFE",
    tertiary: "#059669",
    tertiaryContainer: "#D1FAE5",
    error: "#DC2626",
    errorContainer: "#FEE2E2",
    background: "#FAFAFA",
    surface: "#FFFFFF",
    surfaceVariant: "#F5F5F5",
    outline: "#D4D4D4",
  },
};

export type AppTheme = typeof theme;
