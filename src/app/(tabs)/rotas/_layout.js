import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../../theme";
import HeaderPerfilButton from "../../../components/HeaderPerfilButton";

function CustomStackHeader({ options, route, back }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const title = options?.title || route?.name || "";
  const isRoot = route?.name === "index";

  return (
    <View
      style={[
        styles.headerContainer,
        { paddingTop: insets.top, height: 56 + insets.top },
      ]}
    >
      <View style={styles.sideSlot}>
        {back ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Voltar"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>

      <View style={[styles.sideSlot, { alignItems: "flex-end" }]}>
        {isRoot ? <HeaderPerfilButton /> : null}
      </View>
    </View>
  );
}

export default function RotasStackLayout() {
  return (
    <Stack
      screenOptions={{
        header: (props) => <CustomStackHeader {...props} />,
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
        name="detalhe"
        options={{
          title: "Detalhe da Rota",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="form"
        options={{
          title: "Gerenciar Rota",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="trajeto"
        options={{
          title: "Trajeto do Dia",
          presentation: "card",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  sideSlot: {
    width: 56,
    justifyContent: "center",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontWeight: "800",
    textAlign: "center",
  },
});
