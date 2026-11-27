import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Surface, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme";

// Estado padronizado de erro com mensagem simples e botão de recuperação
export default function ErrorState({
  title = "Não foi possível carregar",
  message = "Verifique sua conexão e tente de novo.",
  actionLabel = "Tentar de novo",
  onRetry,
  icon = "cloud-alert-outline",
}) {
  return (
    <Surface style={styles.container} elevation={0}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={36} color={colors.error} />
      </View>

      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>

      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>

      {onRetry ? (
        <Button
          mode="contained"
          icon="refresh"
          onPress={onRetry}
          buttonColor={colors.primary}
          textColor={colors.text}
          contentStyle={styles.buttonContent}
          style={styles.button}
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
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    borderRadius: 12,
    minWidth: 180,
  },
  buttonContent: {
    height: 48,
  },
});
