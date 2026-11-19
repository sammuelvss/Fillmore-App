import React from "react";
import { TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../theme";

export default function AlunosStackLayout() {
  const router = useRouter();

  const renderPerfilButton = () => (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/perfil")}
      style={{ marginRight: 6, padding: 4 }}
      accessibilityLabel="Abrir Meu Perfil"
    >
      <MaterialCommunityIcons
        name="account-circle-outline"
        size={26}
        color="#FFFFFF"
      />
    </TouchableOpacity>
  );

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
          headerRight: renderPerfilButton,
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
