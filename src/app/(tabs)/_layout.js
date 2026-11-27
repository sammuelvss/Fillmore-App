import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/useAuthStore";

// Navegação principal motorista-only: 4 abas (Hoje, Rotas, Alunos, Financeiro) + Avatar para Perfil
export default function TabsLayout() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const iniciais = (user?.nome || "M")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const renderPerfilAvatarButton = () => (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/perfil")}
      style={styles.headerTouch}
      accessibilityLabel="Abrir Meu Perfil"
    >
      <Avatar.Text
        size={34}
        label={iniciais || "M"}
        style={{ backgroundColor: colors.primary }}
        color={colors.text}
        labelStyle={{ fontWeight: "800", fontSize: 13 }}
      />
    </TouchableOpacity>
  );

  const renderVoltarHojeButton = () => (
    <TouchableOpacity
      onPress={() => router.replace("/(tabs)/hoje")}
      style={styles.headerBackTouch}
      accessibilityLabel="Voltar para Hoje"
    >
      <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.secondary,
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "800",
        },
        headerRight: renderPerfilAvatarButton,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="hoje"
        options={{
          title: "Hoje",
          headerTitle: "Fillmore • Hoje",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-check-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="rotas"
        options={{
          title: "Rotas",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="map-marker-path"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="alunos"
        options={{
          title: "Alunos",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-group-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="financeiro/index"
        options={{
          title: "Financeiro",
          headerTitle: "Financeiro & Pix",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="cash-multiple"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil/index"
        options={{
          href: null,
          title: "Perfil",
          headerTitle: "Meu Perfil",
          headerLeft: renderVoltarHojeButton,
          headerRight: () => null,
        }}
      />

      <Tabs.Screen
        name="sobre"
        options={{
          href: null,
          title: "Sobre",
          headerTitle: "Sobre o Projeto & Equipe",
          headerLeft: renderVoltarHojeButton,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTouch: {
    width: 48,
    height: 48,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackTouch: {
    width: 48,
    height: 48,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
