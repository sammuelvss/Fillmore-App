import React from "react";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../theme";
import HeaderPerfilButton from "../../components/HeaderPerfilButton";

// Navegação principal motorista-only: exatamente 4 abas (Hoje, Rotas, Alunos, Financeiro)
// Perfil (/perfil) e Sobre (/sobre) ficam na Stack raiz (src/app/_layout.js) para evitar colisão de rotas no Expo Router.
export default function TabsLayout() {
  const renderPerfilAvatarButton = () => <HeaderPerfilButton />;

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
    </Tabs>
  );
}
