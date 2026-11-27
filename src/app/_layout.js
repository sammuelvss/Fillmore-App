import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  PaperProvider,
  ActivityIndicator,
  Button,
  Snackbar,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { fillmoreTheme, colors } from "../theme";
import { queryClient } from "../lib/queryClient";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";

// ErrorBoundary oficial do Expo Router para evitar tela branca em erros inesperados
export function ErrorBoundary({ retry }) {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={fillmoreTheme}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-octagon-outline"
            size={56}
            color={colors.error}
          />
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Algo deu errado
          </Text>
          <Text variant="bodyMedium" style={styles.errorSubtitle}>
            Ocorreu um erro inesperado ao abrir esta tela. Tente recarregar o aplicativo.
          </Text>
          <Button
            mode="contained"
            icon="refresh"
            onPress={retry}
            buttonColor={colors.primary}
            textColor={colors.text}
            contentStyle={{ height: 52 }}
            style={styles.errorButton}
          >
            Recarregar
          </Button>
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

function NavigationGuard({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const resetOperacional = useAppStore((state) => state.resetOperacional);
  const showSnackbar = useAppStore((state) => state.showSnackbar);
  const hidratado = isHydrated || Boolean(useAuthStore.persist?.hasHydrated?.());

  useEffect(() => {
    if (!hidratado) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (token && user?.tipo === "RESPONSAVEL") {
      clearAuth();
      resetOperacional();
      queryClient.clear();
      showSnackbar("Este app é para motoristas", "error");
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
      return;
    }

    if (!token && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (token && inAuthGroup) {
      router.replace("/(tabs)/hoje");
    }
  }, [
    token,
    user?.tipo,
    hidratado,
    segments,
    router,
    clearAuth,
    resetOperacional,
    showSnackbar,
  ]);

  if (!hidratado) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Carregando sessão Fillmore...
        </Text>
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  const snackbar = useAppStore((state) => state.snackbar);
  const hideSnackbar = useAppStore((state) => state.hideSnackbar);

  const getSnackbarColor = () => {
    if (snackbar.type === "error") return colors.error;
    if (snackbar.type === "success") return "#065F46";
    return colors.secondary;
  };

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={fillmoreTheme}>
          <StatusBar style="light" backgroundColor={colors.secondary} />
          <NavigationGuard>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </NavigationGuard>

          {/* Feedback global (Toast/Snackbar) para mutações e respostas da API */}
          <Snackbar
            visible={snackbar.visible}
            onDismiss={hideSnackbar}
            duration={snackbar.action ? 5000 : 3500}
            action={
              snackbar.action
                ? {
                    label: snackbar.action.label,
                    textColor: colors.primaryAccent,
                    onPress: () => {
                      const fn = snackbar.action?.onPress;
                      hideSnackbar();
                      if (fn) fn();
                    },
                  }
                : {
                    label: "Fechar",
                    textColor: colors.primaryAccent,
                    onPress: hideSnackbar,
                  }
            }
            style={{ backgroundColor: getSnackbarColor() }}
          >
            {snackbar.message}
          </Snackbar>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    gap: 12,
  },
  loadingText: {
    color: "#FFFFFF",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  errorSubtitle: {
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  errorButton: {
    borderRadius: 12,
    minWidth: 200,
  },
});
