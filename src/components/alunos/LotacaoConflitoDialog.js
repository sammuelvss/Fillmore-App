import React from "react";
import { StyleSheet } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { colors } from "../../theme";

/**
 * Dialog dedicado para o erro HTTP 409 Conflict (Capacidade máxima da van atingida).
 */
export default function LotacaoConflitoDialog({
  conflito,
  onDismiss,
  onGerenciarLotacao,
}) {
  return (
    <Portal>
      <Dialog
        visible={Boolean(conflito)}
        onDismiss={onDismiss}
        style={styles.dialog}
      >
        <Dialog.Icon icon="bus-alert" color={colors.error} size={36} />
        <Dialog.Title style={styles.title}>
          Van Lotada (Erro 409)
        </Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.message}>
            {conflito?.message ||
              "A capacidade máxima de passageiros da van para esta rota foi atingida."}
          </Text>
          {conflito?.rota?.nome ? (
            <Text variant="bodySmall" style={styles.hint}>
              Rota: <Text style={styles.bold}>{conflito.rota.nome}</Text> (
              {conflito.rota.turno}). Desvincule um aluno inativo desta rota ou
              atualize a capacidade da van no seu Perfil.
            </Text>
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor={colors.textSecondary}>
            Entendi
          </Button>
          {onGerenciarLotacao ? (
            <Button
              mode="contained"
              buttonColor={colors.secondary}
              textColor="#FFFFFF"
              onPress={() => {
                const rota = conflito?.rota;
                onDismiss && onDismiss();
                onGerenciarLotacao(rota);
              }}
            >
              Ver Lotação da Rota
            </Button>
          ) : null}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 18,
  },
  title: {
    textAlign: "center",
    fontWeight: "800",
    color: colors.error,
  },
  message: {
    color: colors.text,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 10,
  },
  hint: {
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  bold: {
    fontWeight: "700",
    color: colors.secondary,
  },
});
