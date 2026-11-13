import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  SegmentedButtons,
  Chip,
  HelperText,
  ActivityIndicator,
} from "react-native-paper";
import { colors } from "../../theme";
import EmptyState from "../EmptyState";
import {
  useViagensQuery,
  useCancelarViagemMutation,
  useRemoverViagemMutation,
} from "../../hooks/useOperacao";
import {
  getHojeISO,
  isDataValida,
  formatarDataBR,
  TURNO_LABELS,
} from "./helpers";

// Aba 2: Cancelamento pontual de viagem diária
export default function ViagensTab({ alunoId, onConfirmDelete }) {
  const [data, setData] = useState(getHojeISO);
  const [turnoCancelado, setTurnoCancelado] = useState("MANHA");
  const [motivo, setMotivo] = useState("");
  const [formError, setFormError] = useState("");

  const viagensQuery = useViagensQuery(alunoId);
  const cancelar = useCancelarViagemMutation();
  const remover = useRemoverViagemMutation();

  const lista = Array.isArray(viagensQuery.data) ? viagensQuery.data : [];

  const handleCancelarViagem = () => {
    const dataLimpa = data.trim();
    if (!isDataValida(dataLimpa)) {
      return setFormError("Informe a data no formato AAAA-MM-DD.");
    }

    setFormError("");
    cancelar.mutate(
      {
        alunoId,
        data: {
          data: dataLimpa,
          turnoCancelado,
          motivoCancelamento: motivo.trim() || undefined,
        },
      },
      {
        onSuccess: () => setMotivo(""),
      },
    );
  };

  return (
    <View>
      <Surface style={styles.card} elevation={1}>
        <Text variant="titleMedium" style={styles.cardTitle}>
          Cancelar Viagem Pontual
        </Text>

        <TextInput
          label="Data da viagem (AAAA-MM-DD)"
          mode="outlined"
          value={data}
          onChangeText={(v) => {
            setData(v);
            setFormError("");
          }}
          style={styles.input}
        />

        <Text variant="labelMedium" style={styles.fieldLabel}>
          Turno cancelado
        </Text>
        <SegmentedButtons
          value={turnoCancelado}
          onValueChange={setTurnoCancelado}
          density="small"
          buttons={[
            { value: "MANHA", label: "Manhã" },
            { value: "TARDE", label: "Tarde" },
            { value: "AMBOS", label: "Ambos" },
          ]}
          style={styles.segmented}
        />

        <TextInput
          label="Motivo (opcional)"
          mode="outlined"
          placeholder="Ex.: Consulta médica"
          value={motivo}
          onChangeText={setMotivo}
          style={styles.input}
        />

        {formError ? (
          <HelperText type="error" visible>
            {formError}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          icon="calendar-remove"
          loading={cancelar.isPending}
          disabled={cancelar.isPending}
          onPress={handleCancelarViagem}
          buttonColor={colors.error}
          textColor="#FFFFFF"
          style={styles.submitBtn}
        >
          Registrar Cancelamento
        </Button>
      </Surface>

      <Text variant="titleSmall" style={styles.listHeader}>
        Viagens Canceladas ({lista.length})
      </Text>

      {viagensQuery.isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : lista.length === 0 ? (
        <EmptyState
          icon="bus-clock"
          title="Nenhum cancelamento registrado"
          description="Quando uma viagem for cancelada na data, ela ficará listada aqui."
        />
      ) : (
        lista.map((item) => (
          <Surface key={item.id} style={styles.itemCard} elevation={1}>
            <View style={styles.itemTop}>
              <Text variant="titleSmall" style={styles.itemDate}>
                {formatarDataBR(item.data)}
              </Text>
              <Chip
                compact
                style={styles.turnoChip}
                textStyle={styles.turnoChipText}
              >
                {TURNO_LABELS[item.turnoCancelado] || item.turnoCancelado}
              </Chip>
            </View>

            <Text variant="bodySmall" style={styles.originText}>
              {item.canceladaPeloResponsavel
                ? "Cancelada pelo responsável"
                : "Cancelada pelo motorista"}
            </Text>

            {item.motivoCancelamento ? (
              <Text variant="bodyMedium" style={styles.motivoText}>
                Motivo: {item.motivoCancelamento}
              </Text>
            ) : null}

            <View style={styles.actionsRow}>
              <Button
                mode="text"
                compact
                icon="backup-restore"
                disabled={remover.isPending}
                onPress={() =>
                  onConfirmDelete({
                    title: "Reativar viagem?",
                    description: `Desfazer o cancelamento do dia ${formatarDataBR(item.data)} (${TURNO_LABELS[item.turnoCancelado] || item.turnoCancelado})?`,
                    confirmLabel: "Reativar",
                    onConfirm: () =>
                      remover.mutate({ alunoId, viagemId: item.id }),
                  })
                }
              >
                Reativar viagem
              </Button>
            </View>
          </Surface>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: "800",
    color: colors.secondary,
    marginBottom: 12,
  },
  fieldLabel: {
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  segmented: {
    marginBottom: 12,
  },
  submitBtn: {
    marginTop: 4,
    borderRadius: 10,
  },
  listHeader: {
    fontWeight: "700",
    color: colors.secondary,
    marginBottom: 8,
  },
  loader: {
    marginVertical: 24,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemDate: {
    fontWeight: "800",
    color: colors.secondary,
  },
  turnoChip: {
    backgroundColor: colors.errorLight,
  },
  turnoChipText: {
    color: "#991B1B",
    fontWeight: "700",
  },
  originText: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  motivoText: {
    color: colors.text,
    marginTop: 6,
  },
  actionsRow: {
    alignItems: "flex-end",
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 4,
  },
});

