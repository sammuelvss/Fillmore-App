import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Surface } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme";

/**
 * Componente reutilizável para listas vazias ou estados de erro em todas as abas.
 */
export default function EmptyState({
  icon = "bus-alert",
  title = "Nenhum registro encontrado",
  description = "Não há itens cadastrados para o filtro selecionado.",
  actionLabel,
  onAction,
}) {
  return (
    <Surface style={styles.container} elevation={0}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={42} color={colors.primaryDark} />
      </View>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Button
          mode="contained"
          icon="plus"
          onPress={onAction}
          style={styles.button}
          buttonColor={colors.primary}
          textColor={colors.secondary}
        >
          {actionLabel}
        </Button>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    marginVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontWeight: "700",
    color: colors.secondary,
    textAlign: "center",
    marginBottom: 6,
  },
  description: {
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    marginTop: 4,
    borderRadius: 10,
  },
});
