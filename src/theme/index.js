import { MD3LightTheme } from "react-native-paper";

/**
 * Paleta oficial Fillmore — Transporte Escolar Informal (Recife)
 * Inspirada nas faixas escolares amarelas e sobriedade corporativa em azul escuro.
 */
export const colors = {
  primary: "#F59E0B", // Amarelo Escolar Principal (Amber 500)
  primaryLight: "#FEF3C7", // Amber 100
  primaryAccent: "#FBBF24", // Amber 400
  primaryDark: "#D97706", // Amber 600
  secondary: "#1E293B", // Azul Escuro Corporativo (Slate 800)
  secondaryLight: "#334155", // Slate 700
  background: "#F8FAFC", // Cinza muito claro / Branco gelo (Slate 50)
  surface: "#FFFFFF",
  surfaceVariant: "#F1F5F9", // Slate 100
  text: "#0F172A", // Slate 900
  textSecondary: "#64748B", // Slate 500
  border: "#E2E8F0", // Slate 200
  success: "#10B981", // Emerald 500
  successLight: "#D1FAE5",
  warning: "#F59E0B", // Amber 500
  warningLight: "#FEF3C7",
  error: "#EF4444", // Red 500
  errorLight: "#FEE2E2",
  info: "#3B82F6", // Blue 500
  infoLight: "#DBEAFE",
};

export const fillmoreTheme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: "#0F172A", // Alto contraste sobre o amarelo escolar
    primaryContainer: colors.primaryLight,
    onPrimaryContainer: "#78350F",
    secondary: colors.secondary,
    onSecondary: "#FFFFFF",
    secondaryContainer: "#E2E8F0",
    onSecondaryContainer: colors.secondary,
    background: colors.background,
    onBackground: colors.text,
    surface: colors.surface,
    onSurface: colors.text,
    surfaceVariant: colors.surfaceVariant,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    error: colors.error,
    onError: "#FFFFFF",
    errorContainer: colors.errorLight,
    onErrorContainer: "#991B1B",
  },
};

export default fillmoreTheme;
