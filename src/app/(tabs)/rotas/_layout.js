import React from "react";
import { Stack } from "expo-router";
import { colors } from "../../../theme";

export default function RotasStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.secondary },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Rotas Escolares",
        }}
      />
      <Stack.Screen
        name="form"
        options={{
          title: "Gerenciar Rota",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
