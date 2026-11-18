import React from "react";
import { Stack } from "expo-router";
import { colors } from "../../../theme";

export default function AlunosStackLayout() {
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
          title: "Alunos & Lotação",
        }}
      />
      <Stack.Screen
        name="form"
        options={{
          title: "Gerenciar Aluno",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="lotacao"
        options={{
          title: "Lotação da Rota (Van)",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
