import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Avatar } from "react-native-paper";
import { useRouter } from "expo-router";
import { colors } from "../theme";
import { useAuthStore } from "../store/useAuthStore";

/**
 * Botão padronizado de acesso ao Perfil do Motorista no canto superior direito
 * de todas as 4 abas (Hoje, Rotas, Alunos, Financeiro).
 */
export default function HeaderPerfilButton() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const iniciais = (user?.nome || "M")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <TouchableOpacity
      onPress={() => router.push("/perfil")}
      style={styles.touchTarget}
      activeOpacity={0.75}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel="Abrir Meu Perfil"
    >
      <Avatar.Text
        size={34}
        label={iniciais || "M"}
        style={styles.avatar}
        color={colors.text}
        labelStyle={styles.label}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  avatar: {
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  label: {
    fontWeight: "800",
    fontSize: 12,
  },
});
