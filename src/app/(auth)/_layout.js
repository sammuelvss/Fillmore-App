import React from "react";
import { Stack } from "expo-router";
import { colors } from "../../theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.secondary },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Fillmore — Acesso",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: "Criar Conta",
        }}
      />
    </Stack>
  );
}
