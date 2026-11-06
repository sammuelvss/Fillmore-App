import React from "react";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../theme";

/**
 * Navegação Principal em Abas (Bottom Tabs — Expo Router)
 * Contempla as telas gerais (Home e Sobre) + 1 fluxo dedicado por módulo da equipe.
 */
export default function TabsLayout() {
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
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          headerTitle: "Fillmore • Painel Escolar",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard-outline"
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
        name="alunos/index"
        options={{
          title: "Alunos",
          headerTitle: "Alunos & Lotação",
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
          headerTitle: "Mensalidades & Pix",
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
        name="operacao/index"
        options={{
          title: "Operação",
          headerTitle: "Diário de Bordo",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil/index"
        options={{
          title: "Perfil",
          headerTitle: "Meu Perfil",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="sobre"
        options={{
          title: "Sobre",
          headerTitle: "Sobre o Projeto & Equipe",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="information-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
