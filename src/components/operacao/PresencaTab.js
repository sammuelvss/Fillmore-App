import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  SegmentedButtons,
  Chip,
  IconButton,
  HelperText,
  ActivityIndicator,
} from "react-native-paper";
import { colors } from "../../theme";
import EmptyState from "../EmptyState";
import {
  usePresencasQuery,
  useRegistrarPresencaMutation,
  useAtualizarPresencaMutation,
  useRemoverPresencaMutation,
} from "../../hooks/useOperacao";
import {
  getHojeISO,
  getHoraAtual,
  isDataValida,
  isHoraValida,
  formatarDataBR,
  TURNO_LABELS,
} from "./helpers";

// Aba 1: Check-list diário de presença (embarque)
export default function PresencaTab({
  alunoId,
  isMotorista,
  turnoInicial = "MANHA",
  onConfirmDelete,
}) {
  const [data, setData] = useState(getHojeISO);
  const [turno, setTurno] = useState(
    turnoInicial === "TARDE" ? "TARDE" : "MANHA",
  );
  const [horario, setHorario] = useState(getHoraAtual);
  const [formError, setFormError] = useState("");

  const presencasQuery = usePresencasQuery(alunoId);
  const registrar = useRegistrarPresencaMutation();
  const atualizar = useAtualizarPresencaMutation();
  const remover = useRemoverPresencaMutation();

  const lista = Array.isArray(presencasQuery.data) ? presencasQuery.data : [];

  const handleRegistrar = (embarcou) => {
    const dataLimpa = data.trim();
    const horaLimpa = horario.trim();

    if (!isDataValida(dataLimpa)) {
      return setFormError("Informe a data no formato AAAA-MM-DD.");
    }
    if (embarcou && horaLimpa && !isHoraValida(horaLimpa)) {
      return setFormError("Informe o horário no formato HH:MM (ex.: 06:45).");
    }

    setFormError("");
    registrar.mutate({
      alunoId,
      data: {
        data: dataLimpa,
        turno,
        embarcou,
        horarioEmbarque: embarcou ? horaLimpa || getHoraAtual() : null,
      },
    });
  };

  const handleAlternarStatus = (item) => {
    const proximoEmbarcou = !item.embarcou;
    atualizar.mutate({
      alunoId,
      presencaId: item.id,
      data: {
        embarcou: proximoEmbarcou,
        horarioEmbarque: proximoEmbarcou
          ? item.horarioEmbarque || getHoraAtual()
          : null,
      },
    });
  };

  return (
    <View>
      {isMotorista ? (
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Registrar Embarque
          </Text>

          <View style={styles.row}>
            <TextInput
              label="Data (AAAA-MM-DD)"
              mode="outlined"
              value={data}
              onChangeText={(v) => {
                setData(v);
                setFormError("");
              }}
              style={[styles.input, styles.half]}
            />
            <TextInput
              label="Horário (HH:MM)"
              mode="outlined"
              value={horario}
              onChangeText={(v) => {
                setHorario(v);
                setFormError("");
              }}
              placeholder="06:45"
              style={[styles.input, styles.half]}
            />
          </View>

          <SegmentedButtons
            value={turno}
            onValueChange={setTurno}
            density="small"
            buttons={[
              { value: "MANHA", label: "Manhã", icon: "weather-sunny" },
              { value: "TARDE", label: "Tarde", icon: "weather-sunset" },
            ]}
            style={styles.segmented}
          />

          {formError ? (
            <HelperText type="error" visible>
              {formError}
            </HelperText>
          ) : null}

          <View style={styles.row}>
            <Button
              mode="contained"
              icon="check-bold"
              loading={registrar.isPending}
              disabled={registrar.isPending}
              onPress={() => handleRegistrar(true)}
              buttonColor={colors.success}
              textColor="#FFFFFF"
              style={styles.half}
            >
              Embarcou
            </Button>
            <Button
              mode="outlined"
              icon="close-circle-outline"
              loading={registrar.isPending}
              disabled={registrar.isPending}
              onPress={() => handleRegistrar(false)}
              textColor={colors.error}
              style={[styles.half, { borderColor: colors.error }]}
            >
              Faltou
            </Button>
          </View>
        </Surface>
      ) : (
        <Surface style={styles.infoBox} elevation={0}>
          <Text variant="bodySmall" style={styles.infoText}>
            Acompanhe aqui os embarques registrados pelo motorista.
          </Text>
        </Surface>
      )}

      <Text variant="titleSmall" style={styles.listHeader}>
        Histórico de Presenças ({lista.length})
      </Text>

      {presencasQuery.isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : lista.length === 0 ? (
        <EmptyState
          icon="clipboard-check-outline"
          title="Nenhuma presença registrada"
          description="Os registros de embarque deste aluno aparecerão aqui."
        />
      ) : (
        lista.map((item) => (
          <Surface key={item.id} style={styles.itemCard} elevation={1}>
            <View style={styles.itemTop}>
              <View style={styles.itemMeta}>
                <Text variant="titleSmall" style={styles.itemDate}>
                  {formatarDataBR(item.data)}
                </Text>
                <Chip compact style={styles.turnoChip}>
                  {TURNO_LABELS[item.turno] || item.turno}
                </Chip>
              </View>

              <Chip
                compact
                icon={item.embarcou ? "check-circle" : "close-circle"}
                style={{
                  backgroundColor: item.embarcou
                    ? colors.successLight
                    : colors.errorLight,
                }}
                textStyle={{
                  color: item.embarcou ? "#065F46" : "#991B1B",
                  fontWeight: "700",
                }}
              >
                {item.embarcou ? "Embarcou" : "Não embarcou"}
              </Chip>
            </View>

            {item.horarioEmbarque ? (
              <Text variant="bodySmall" style={styles.horaText}>
                Horário do embarque: {item.horarioEmbarque}
              </Text>
            ) : null}

            {isMotorista && (
              <View style={styles.itemActions}>
                <Button
                  mode="text"
                  compact
                  icon="swap-horizontal"
                  disabled={atualizar.isPending}
                  onPress={() => handleAlternarStatus(item)}
                >
                  {item.embarcou ? "Marcar falta" : "Marcar embarque"}
                </Button>
                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor={colors.error}
                  disabled={remover.isPending}
                  onPress={() =>
                    onConfirmDelete({
                      title: "Excluir presença?",
                      description: `Remover o registro de ${formatarDataBR(item.data)} (${TURNO_LABELS[item.turno] || item.turno})?`,
                      onConfirm: () =>
                        remover.mutate({ alunoId, presencaId: item.id }),
                    })
                  }
                />
              </View>
            )}
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
  row: {
    flexDirection: "row",
    gap: 10,
  },
  half: {
    flex: 1,
  },
  input: {
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  segmented: {
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: colors.infoLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  infoText: {
    color: "#1E40AF",
    fontWeight: "600",
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
    gap: 8,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemDate: {
    fontWeight: "800",
    color: colors.secondary,
  },
  turnoChip: {
    backgroundColor: colors.surfaceVariant,
  },
  horaText: {
    color: colors.textSecondary,
    marginTop: 6,
  },
  itemActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 4,
  },
});

