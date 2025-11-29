/**
 * SEMANTIC COLOR TOKENS
 * 
 * Following Reddit consensus:
 * - Base palette: raw colors (rarely used directly)
 * - Semantic tokens: map to base colors (USE THESE in code)
 */

// Base Palette
const palette = {
  green: {
    100: "#d1fae5",
    500: "#10b981",
    600: "#059669",
    800: "#065f46",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    700: "#374151",
    900: "#111827",
  },
  red: {
    100: "#fee2e2",
    500: "#ef4444",
    800: "#991b1b",
  },
  amber: {
    100: "#fef3c7",
    500: "#f59e0b",
    800: "#92400e",
  },
  blue: {
    100: "#dbeafe",
    500: "#3b82f6",
    800: "#1e40af",
  },
  white: "#ffffff",
};

// Semantic Tokens - USE THESE
const colors = {
  primary: {
    DEFAULT: palette.green[500],
    light: palette.green[100],
    dark: palette.green[800],
  },
  secondary: {
    DEFAULT: palette.gray[500],
    light: palette.gray[100],
    dark: palette.gray[700],
  },
  text: {
    primary: palette.gray[900],
    secondary: palette.gray[500],
    tertiary: palette.gray[400],
    inverse: palette.white,
  },
  background: {
    primary: palette.white,
    secondary: palette.gray[50],
    tertiary: palette.gray[100],
  },
  border: {
    primary: palette.gray[200],
    secondary: palette.gray[300],
  },
  status: {
    pending: {
      DEFAULT: palette.amber[500],
      bg: palette.amber[100],
      text: palette.amber[800],
    },
    live: {
      DEFAULT: palette.green[500],
      bg: palette.green[100],
      text: palette.green[800],
    },
    rated: {
      DEFAULT: palette.blue[500],
      bg: palette.blue[100],
      text: palette.blue[800],
    },
  },
  success: palette.green[500],
  warning: palette.amber[500],
  danger: palette.red[500],
  info: palette.blue[500],
};

module.exports = { colors, palette };
