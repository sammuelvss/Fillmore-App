import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Chip,
  Dialog,
  HelperText,
  Portal,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useVincularAlunoRotaMutation } from "../../hooks/useAlunos";

/**
 * Modal/Dialog para vincular um aluno a uma rota escolar (`POST /rotas/:rotaId/alunos`).
 * Mostra a ocupação antes do vínculo (ex.: 14/15) e bloqueia proativamente se a van estiver lotada,
 * mantendo o tratamento de HTTP 409 como rede de segurança.
 */
export default function VincularRotaDialog({
  visible,
  aluno,
  rotas = [],
  rotaInicialId = null,
  capacidadePadrao = 15,
  onDismiss,
  onLotacaoConflito,
}) {
  const [rotaId, setRotaId] = useState("");
  const [tipoTrajeto, setTipoTrajeto] = useState("IDA");
  const [ordemNaRota, setOrdemNaRota] = useState("");
  const [localError, setLocalError] = useState("");

  const vincularMutation = useVincularAlunoRotaMutation();

  const rotaSelecionada = useMemo(
    () => rotas.find((r) => r.id === rotaId) || null,
    [rotas, rotaId],
  );

  const getOcupacaoRota = (rota) => {
    if (!rota) return { ocupadas: 0, max: capacidadePadrao || 15, lotada: false };
    const lista =
      rota.turno === "TARDE" ? rota.alunosVolta || [] : rota.alunosIda || [];
    const ocupadas = Array.isArray(lista) ? lista.length : 0;
    const max = rota.motorista?.capacidadeVan || capacidadePadrao || 15;
    return { ocupadas, max, lotada: ocupadas >= max };
  };

  useEffect(() => {
    if (!visible) return;
    setLocalError("");

    const inicial =
      rotas.find((r) => r.id === rotaInicialId) || rotas[0] || null;

    if (inicial) {
      setRotaId(inicial.id);
      const trajetoPadrao = inicial.turno === "TARDE" ? "VOLTA" : "IDA";
      setTipoTrajeto(trajetoPadrao);
      const { ocupadas } = getOcupacaoRota(inicial);
      setOrdemNaRota(String(ocupadas + 1));
    } else {
      setRotaId("");
      setOrdemNaRota("1");
    }
  }, [visible, rotaInicialId, rotas]);

  const handleSelecionarRota = (rota) => {
    setRotaId(rota.id);
    setLocalError("");
    setTipoTrajeto(rota.turno === "TARDE" ? "VOLTA" : "IDA");
    const { ocupadas } = getOcupacaoRota(rota);
    setOrdemNaRota(String(ocupadas + 1));
  };

  const ocupacaoAtual = getOcupacaoRota(rotaSelecionada);

  const handleConfirm = async () => {
    if (!aluno?.id || !rotaId) {
      setLocalError("Selecione uma rota para vincular o aluno.");
      return;
    }

    if (ocupacaoAtual.lotada) {
      setLocalError(
        `A van já está lotada nesta rota (${ocupacaoAtual.ocupadas}/${ocupacaoAtual.max} vagas). Desvincule um passageiro ou aumente a capacidade da van no Perfil.`,
      );
      return;
    }

    const ordemParsed = ordemNaRota.trim()
      ? Number.parseInt(ordemNaRota.trim(), 10)
      : undefined;

    if (
      ordemNaRota.trim() &&
      (Number.isNaN(ordemParsed) || ordemParsed <= 0)
    ) {
      setLocalError("A ordem de embarque deve ser um número inteiro positivo.");
      return;
    }

    setLocalError("");
    try {
      await vincularMutation.mutateAsync({
        rotaId,
        alunoId: aluno.id,
        tipoTrajeto,
        ...(ordemParsed !== undefined && { ordemNaRota: ordemParsed }),
      });
      onDismiss && onDismiss();
    } catch (error) {
      if (error?.response?.status === 409) {
        onDismiss && onDismiss();
        onLotacaoConflito &&
          onLotacaoConflito({
            message:
              error.friendlyMessage ||
              "Capacidade máxima da van para esta rota foi atingida.",
            rota: rotaSelecionada,
            aluno,
          });
      } else {
        setLocalError(
          error.friendlyMessage || "Não foi possível vincular o aluno à rota.",
        );
      }
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>Vincular Aluno à Rota</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.alunoHeader}>
            Aluno(a):{" "}
            <Text style={styles.bold}>{aluno?.nome || "Selecionado"}</Text>
          </Text>

          {rotas.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="map-marker-off-outline"
                size={24}
                color={colors.warning}
              />
              <Text variant="bodySmall" style={styles.emptyText}>
                Nenhuma rota cadastrada. Crie uma rota na aba &quot;Rotas&quot;
                antes de vincular alunos.
              </Text>
            </View>
          ) : (
            <>
              <Text variant="labelMedium" style={styles.label}>
                Escolha a Rota Escolar (ocupação exibida):
              </Text>
              <ScrollView
                style={styles.rotasScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.rotasList}>
                  {rotas.map((r) => {
                    const selected = r.id === rotaId;
                    const { ocupadas, max, lotada } = getOcupacaoRota(r);
                    return (
                      <Chip
                        key={r.id}
                        selected={selected}
                        icon={
                          r.turno === "TARDE"
                            ? "weather-sunset"
                            : "weather-sunny"
                        }
                        onPress={() => handleSelecionarRota(r)}
                        style={[
                          styles.rotaChip,
                          selected && styles.rotaChipSelected,
                          lotada && styles.rotaChipLotada,
                        ]}
                        textStyle={[
                          styles.rotaChipText,
                          selected && styles.rotaChipTextSelected,
                        ]}
                      >
                        {r.nome} ({r.turno === "MANHA" ? "Manhã" : "Tarde"}) •{" "}
                        {ocupadas}/{max}
                        {lotada ? " (LOTADA)" : ""}
                      </Chip>
                    );
                  })}
                </View>
              </ScrollView>

              {rotaSelecionada ? (
                <Surface
                  style={[
                    styles.capacityNotice,
                    ocupacaoAtual.lotada
                      ? styles.capacityNoticeFull
                      : styles.capacityNoticeOpen,
                  ]}
                  elevation={0}
                >
                  <MaterialCommunityIcons
                    name={
                      ocupacaoAtual.lotada ? "bus-alert" : "seat-passenger"
                    }
                    size={18}
                    color={ocupacaoAtual.lotada ? "#991B1B" : "#166534"}
                  />
                  <Text
                    variant="labelMedium"
                    style={{
                      flex: 1,
                      fontWeight: "700",
                      color: ocupacaoAtual.lotada ? "#991B1B" : "#166534",
                    }}
                  >
                    {ocupacaoAtual.lotada
                      ? `Van lotada (${ocupacaoAtual.ocupadas}/${ocupacaoAtual.max} vagas). Não é possível vincular mais alunos nesta rota.`
                      : `Ocupação atual: ${ocupacaoAtual.ocupadas}/${ocupacaoAtual.max} vagas (${ocupacaoAtual.max - ocupacaoAtual.ocupadas} disponíveis).`}
                  </Text>
                </Surface>
              ) : null}

              <Text variant="labelMedium" style={styles.label}>
                Tipo de Trajeto:
              </Text>
              <SegmentedButtons
                value={tipoTrajeto}
                onValueChange={setTipoTrajeto}
                density="small"
                buttons={[
                  { value: "IDA", label: "Ida (Manhã)", icon: "arrow-right" },
                  { value: "VOLTA", label: "Volta (Tarde)", icon: "arrow-left" },
                ]}
                style={styles.segmented}
              />

              <TextInput
                label="Ordem de Parada na Rota (opcional)"
                mode="outlined"
                keyboardType="numeric"
                value={ordemNaRota}
                onChangeText={setOrdemNaRota}
                dense
                left={<TextInput.Icon icon="format-list-numbered" />}
                style={styles.input}
              />
            </>
          )}

          {localError ? (
            <HelperText type="error" visible style={styles.errorText}>
              {localError}
            </HelperText>
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={onDismiss}
            disabled={vincularMutation.isPending}
            textColor={colors.textSecondary}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            buttonColor={colors.primary}
            textColor={colors.text}
            loading={vincularMutation.isPending}
            disabled={
              vincularMutation.isPending ||
              rotas.length === 0 ||
              ocupacaoAtual.lotada
            }
            onPress={handleConfirm}
          >
            Vincular
          </Button>
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
    fontWeight: "800",
    color: colors.secondary,
  },
  alunoHeader: {
    color: colors.text,
    marginBottom: 12,
  },
  bold: {
    fontWeight: "800",
    color: colors.secondary,
  },
  label: {
    color: colors.secondary,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 4,
  },
  rotasScroll: {
    maxHeight: 150,
    marginBottom: 10,
  },
  rotasList: {
    gap: 6,
  },
  rotaChip: {
    backgroundColor: colors.surfaceVariant,
    justifyContent: "flex-start",
  },
  rotaChipSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  rotaChipLotada: {
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  rotaChipText: {
    fontSize: 12,
    color: colors.text,
  },
  rotaChipTextSelected: {
    fontWeight: "700",
    color: colors.secondary,
  },
  capacityNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  capacityNoticeOpen: {
    backgroundColor: "#DCFCE7",
  },
  capacityNoticeFull: {
    backgroundColor: "#FEE2E2",
  },
  segmented: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.surface,
  },
  emptyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: colors.warningLight,
    borderRadius: 10,
  },
  emptyText: {
    flex: 1,
    color: "#9A3412",
  },
  errorText: {
    fontWeight: "700",
    marginTop: 4,
  },
});
