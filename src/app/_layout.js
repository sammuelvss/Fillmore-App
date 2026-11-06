import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  PaperProvider,
  ActivityIndicator,
  Snackbar,
  Text,
} from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { fillmoreTheme, colors } from "../theme";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function NavigationGuard({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!token && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (token && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [token, isHydrated, segments, router]);

  if (!isHydrated) {
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
            duration={3500}
            action={{
              label: "OK",
              textColor: colors.primaryAccent,
              onPress: hideSnackbar,
            }}
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
});
