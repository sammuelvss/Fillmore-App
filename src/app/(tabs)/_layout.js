import React from "react";
import { TouchableOpacity } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../theme";

/**
 * Navegação Principal em Abas (5 abas principais; Perfil e Sobre acessíveis pelo cabeçalho/Home)
 */
export default function TabsLayout() {
  const router = useRouter();

  const renderPerfilHeaderButton = () => (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/perfil")}
      style={{ marginRight: 14, padding: 4 }}
      accessibilityLabel="Abrir Meu Perfil"
    >
      <MaterialCommunityIcons
        name="account-circle-outline"
        size={26}
        color="#FFFFFF"
      />
    </TouchableOpacity>
  );

  const renderVoltarHomeButton = () => (
    <TouchableOpacity
      onPress={() => router.replace("/(tabs)")}
      style={{ marginLeft: 14, padding: 4 }}
      accessibilityLabel="Voltar para Início"
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
        headerRight: renderPerfilHeaderButton,
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
          href: null,
          title: "Perfil",
          headerTitle: "Meu Perfil",
          headerLeft: renderVoltarHomeButton,
          headerRight: () => null,
        }}
      />

      <Tabs.Screen
        name="sobre"
        options={{
          href: null,
          title: "Sobre",
          headerTitle: "Sobre o Projeto & Equipe",
          headerLeft: renderVoltarHomeButton,
        }}
      />
    </Tabs>
  );
}
