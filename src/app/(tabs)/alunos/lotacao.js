import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  FAB,
  IconButton,
  Portal,
  ProgressBar,
  Surface,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../../theme";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import { useRotasQuery } from "../../../hooks/useRotas";
import {
  useAlunosDaRotaQuery,
  useAlunosQuery,
  useDesvincularAlunoRotaMutation,
  useVincularAlunoRotaMutation,
} from "../../../hooks/useAlunos";
import EmptyState from "../../../components/EmptyState";
import LotacaoConflitoDialog from "../../../components/alunos/LotacaoConflitoDialog";

/**
 * ============================================================================
 * TELA DE LOTAÇÃO DA ROTA — RELACIONAMENTO 1: ROTA ↔ ALUNOS (Joao)
 * ============================================================================
 * Consome:
 * - `GET /rotas/:rotaId/alunos`
 * - `POST /rotas/:rotaId/alunos` (valida `capacidadeVan` e trata erro 409)
 * - `DELETE /rotas/:rotaId/alunos/:alunoId`
 */
export default function LotacaoRotaScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const rotaAtiva = useAppStore((state) => state.rotaAtiva);
  const setRotaAtiva = useAppStore((state) => state.setRotaAtiva);

  const isMotorista = user?.tipo === "MOTORISTA" || !user?.tipo;

  const rotasQuery = useRotasQuery({ enabled: isMotorista });
  const rotas = Array.isArray(rotasQuery.data) ? rotasQuery.data : [];

  const rotaSelecionada = useMemo(() => {
    if (rotas.length === 0) return null;
    return rotas.find((r) => r.id === rotaAtiva?.id) || rotas[0];
  }, [rotas, rotaAtiva?.id]);

  useEffect(() => {
    if (rotaSelecionada && rotaSelecionada.id !== rotaAtiva?.id) {
      setRotaAtiva(rotaSelecionada);
    }
  }, [rotaSelecionada, rotaAtiva?.id, setRotaAtiva]);

  const alunosRotaQuery = useAlunosDaRotaQuery(rotaSelecionada?.id);
  const todosAlunosQuery = useAlunosQuery({ enabled: isMotorista });

  const vincularMutation = useVincularAlunoRotaMutation();
  const desvincularMutation = useDesvincularAlunoRotaMutation();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [alunoParaDesvincular, setAlunoParaDesvincular] = useState(null);
  const [lotacaoConflito, setLotacaoConflito] = useState(null);

  const alunosDaRota = useMemo(() => {
    const lista = Array.isArray(alunosRotaQuery.data)
      ? [...alunosRotaQuery.data]
      : [];
    const isTarde = rotaSelecionada?.turno === "TARDE";
    return lista.sort((a, b) => {
      const ordA = isTarde ? a.ordemNaRotaVolta : a.ordemNaRotaIda;
      const ordB = isTarde ? b.ordemNaRotaVolta : b.ordemNaRotaIda;
      return (ordA ?? 999) - (ordB ?? 999);
    });
  }, [alunosRotaQuery.data, rotaSelecionada?.turno]);

  const todosAlunos = Array.isArray(todosAlunosQuery.data)
    ? todosAlunosQuery.data
    : [];

  // Alunos ainda não vinculados a esta rota específica (para facilitar o picker)
  const alunosDisponiveis = useMemo(() => {
    if (!rotaSelecionada) return [];
    const idsNaRota = new Set(alunosDaRota.map((a) => a.id));
    return todosAlunos.filter((a) => !idsNaRota.has(a.id));
  }, [todosAlunos, alunosDaRota, rotaSelecionada]);

  const capacidadeMaxima =
    rotaSelecionada?.motorista?.capacidadeVan ||
    user?.motorista?.capacidadeVan ||
    15;
  const vagasOcupadas = alunosDaRota.length;
  const percentual = Math.min(
    1,
    capacidadeMaxima > 0 ? vagasOcupadas / capacidadeMaxima : 0,
  );
  const isLotada = vagasOcupadas >= capacidadeMaxima;

  const handleVincularAluno = async (aluno) => {
    if (!rotaSelecionada) return;
    if (isLotada) {
      setPickerVisible(false);
      setLotacaoConflito({
        message: `A van já atingiu a capacidade máxima (${vagasOcupadas}/${capacidadeMaxima} vagas) nesta rota. Desvincule um passageiro ou aumente a capacidade no Perfil.`,
        rota: rotaSelecionada,
        aluno,
      });
      return;
    }
    const tipoTrajeto = rotaSelecionada.turno === "TARDE" ? "VOLTA" : "IDA";
    try {
      await vincularMutation.mutateAsync({
        rotaId: rotaSelecionada.id,
        alunoId: aluno.id,
        tipoTrajeto,
        ordemNaRota: vagasOcupadas + 1,
      });
      setPickerVisible(false);
    } catch (error) {
      setPickerVisible(false);
      if (error?.response?.status === 409) {
        setLotacaoConflito({
          message:
            error.friendlyMessage ||
            "Capacidade máxima da van para esta rota foi atingida.",
          rota: rotaSelecionada,
          aluno,
        });
      }
    }
  };

  const handleConfirmDesvincular = async () => {
    if (!alunoParaDesvincular || !rotaSelecionada) return;
    try {
      await desvincularMutation.mutateAsync({
        rotaId: rotaSelecionada.id,
        alunoId: alunoParaDesvincular.id,
      });
    } finally {
      setAlunoParaDesvincular(null);
    }
  };

  if (rotasQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Carregando rotas da van...
        </Text>
      </View>
    );
  }

  if (rotas.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="map-marker-plus-outline"
          title="Nenhuma rota cadastrada"
          description="Cadastre uma rota na aba Rotas antes de alocar alunos na van."
          actionLabel="Ir para Rotas"
          onAction={() => router.push("/(tabs)/rotas")}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Seletor de Rota */}
      <Surface style={styles.selectorPanel} elevation={1}>
        <Text variant="labelSmall" style={styles.selectorLabel}>
          Selecione a Rota para Gerenciar Lotação
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rotasRow}
        >
          {rotas.map((r) => {
            const selected = r.id === rotaSelecionada?.id;
            return (
              <Chip
                key={r.id}
                selected={selected}
                icon={r.turno === "TARDE" ? "weather-sunset" : "weather-sunny"}
                onPress={() => setRotaAtiva(r)}
                style={[
                  styles.rotaChip,
                  selected && styles.rotaChipSelected,
                ]}
                textStyle={selected ? styles.rotaChipTextSelected : undefined}
              >
                {r.nome} ({r.turno})
              </Chip>
            );
          })}
        </ScrollView>

        {/* Card de Capacidade da Van */}
        {rotaSelecionada ? (
          <View
            style={[
              styles.capacityCard,
              isLotada && styles.capacityCardLotada,
            ]}
          >
            <View style={styles.capacityHeader}>
              <View style={styles.capacityTitleRow}>
                <MaterialCommunityIcons
                  name={isLotada ? "bus-alert" : "seat-passenger"}
                  size={20}
                  color={isLotada ? colors.error : colors.secondary}
                />
                <Text variant="titleSmall" style={styles.capacityTitle}>
                  {vagasOcupadas} / {capacidadeMaxima} passageiros
                </Text>
              </View>
              <Chip
                compact
                style={[
                  styles.statusChip,
                  isLotada ? styles.statusChipFull : styles.statusChipOpen,
                ]}
                textStyle={[
                  styles.statusChipText,
                  { color: isLotada ? "#991B1B" : "#166534" },
                ]}
              >
                {isLotada
                  ? "VAN LOTADA"
                  : `${capacidadeMaxima - vagasOcupadas} vagas livres`}
              </Chip>
            </View>
            <ProgressBar
              progress={percentual}
              color={isLotada ? colors.error : colors.primary}
              style={styles.progressBar}
            />
          </View>
        ) : null}
      </Surface>

      {/* Lista de Alunos da Rota */}
      {alunosRotaQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Buscando passageiros da rota...
          </Text>
        </View>
      ) : (
        <FlatList
          data={alunosDaRota}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={alunosRotaQuery.isRefetching}
              onRefresh={alunosRotaQuery.refetch}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item, index }) => {
            const ordem =
              rotaSelecionada?.turno === "TARDE"
                ? item.ordemNaRotaVolta
                : item.ordemNaRotaIda;
            const endereco =
              rotaSelecionada?.turno === "TARDE"
                ? item.enderecoDesembarque || item.enderecoEmbarque
                : item.enderecoEmbarque || item.enderecoDesembarque;

            return (
              <Card style={styles.passengerCard} mode="elevated">
                <Card.Content style={styles.passengerRow}>
                  <View style={styles.orderBadge}>
                    <Text variant="labelLarge" style={styles.orderText}>
                      #{ordem || index + 1}
                    </Text>
                  </View>
                  <View style={styles.passengerInfo}>
                    <Text variant="titleSmall" style={styles.passengerName}>
                      {item.nome}
                    </Text>
                    <Text variant="bodySmall" style={styles.passengerMeta}>
                      {item.escola} • {item.modalidade}
                    </Text>
                    {endereco ? (
                      <Text
                        variant="labelSmall"
                        style={styles.passengerAddress}
                        numberOfLines={1}
                      >
                        {endereco}
                      </Text>
                    ) : null}
                  </View>
                  <IconButton
                    icon="link-off"
                    iconColor={colors.error}
                    size={22}
                    onPress={() => setAlunoParaDesvincular(item)}
                    accessibilityLabel="Desvincular aluno da rota"
                  />
                </Card.Content>
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="seat-outline"
              title="Van vazia nesta rota"
              description="Nenhum aluno está alocado nesta rota ainda. Toque em 'Vincular Aluno' para adicionar passageiros."
              actionLabel="Vincular Aluno"
              onAction={() => setPickerVisible(true)}
            />
          }
        />
      )}

      {/* FAB para Vincular Novo Aluno */}
      <FAB
        icon="account-plus"
        label="Vincular Aluno"
        style={[styles.fab, isLotada && styles.fabWarning]}
        color={isLotada ? "#FFFFFF" : colors.secondary}
        onPress={() => setPickerVisible(true)}
      />

      {/* Dialog: Selecionar Aluno para Vincular (POST /rotas/:rotaId/alunos) */}
      <Portal>
        <Dialog
          visible={pickerVisible}
          onDismiss={() => setPickerVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            Vincular Aluno à Rota
          </Dialog.Title>
          <Dialog.Content>
            {isLotada ? (
              <Surface style={styles.lotadaWarningBox} elevation={0}>
                <MaterialCommunityIcons
                  name="alert-outline"
                  size={18}
                  color="#991B1B"
                />
                <Text variant="labelSmall" style={styles.lotadaWarningText}>
                  Atenção: a van atingiu {vagasOcupadas}/{capacidadeMaxima}{" "}
                  vagas. Tentar vincular acionará a trava 409 da API.
                </Text>
              </Surface>
            ) : null}

            {todosAlunosQuery.isLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginVertical: 16 }}
              />
            ) : alunosDisponiveis.length === 0 ? (
              <Text variant="bodyMedium" style={styles.dialogText}>
                Todos os alunos cadastrados já estão vinculados a esta rota (ou
                nenhum aluno foi cadastrado ainda).
              </Text>
            ) : (
              <ScrollView style={styles.pickerScroll}>
                {alunosDisponiveis.map((aluno, idx) => (
                  <View key={aluno.id}>
                    <View style={styles.pickerItem}>
                      <View style={{ flex: 1 }}>
                        <Text variant="titleSmall" style={styles.passengerName}>
                          {aluno.nome}
                        </Text>
                        <Text variant="labelSmall" style={styles.passengerMeta}>
                          {aluno.escola}
                        </Text>
                      </View>
                      <Button
                        mode="contained"
                        compact
                        buttonColor={colors.primary}
                        textColor={colors.text}
                        loading={vincularMutation.isPending}
                        disabled={vincularMutation.isPending || isLotada}
                        onPress={() => handleVincularAluno(aluno)}
                      >
                        {isLotada ? "Lotada" : "Vincular"}
                      </Button>
                    </View>
                    {idx < alunosDisponiveis.length - 1 && <Divider />}
                  </View>
                ))}
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setPickerVisible(false)}
              textColor={colors.textSecondary}
            >
              Fechar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog: Confirmar Desvínculo */}
      <Portal>
        <Dialog
          visible={Boolean(alunoParaDesvincular)}
          onDismiss={() => setAlunoParaDesvincular(null)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="link-off" color={colors.error} />
          <Dialog.Title style={styles.dialogTitle}>
            Desvincular da Rota?
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Desvincular{" "}
              <Text style={styles.boldText}>{alunoParaDesvincular?.nome}</Text>{" "}
              da rota{" "}
              <Text style={styles.boldText}>{rotaSelecionada?.nome}</Text>?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setAlunoParaDesvincular(null)}
              disabled={desvincularMutation.isPending}
              textColor={colors.textSecondary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.error}
              textColor="#FFFFFF"
              loading={desvincularMutation.isPending}
              disabled={desvincularMutation.isPending}
              onPress={handleConfirmDesvincular}
            >
              Desvincular
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog: Erro 409 Conflict (Van Lotada) */}
      <LotacaoConflitoDialog
        conflito={lotacaoConflito}
        onDismiss={() => setLotacaoConflito(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  selectorPanel: {
    backgroundColor: colors.surface,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  selectorLabel: {
    color: colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rotasRow: {
    gap: 8,
  },
  rotaChip: {
    backgroundColor: colors.surfaceVariant,
  },
  rotaChipSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  rotaChipTextSelected: {
    fontWeight: "700",
    color: colors.secondary,
  },
  capacityCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  capacityCardLotada: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  capacityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  capacityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  capacityTitle: {
    fontWeight: "800",
    color: colors.secondary,
  },
  statusChip: {
    borderRadius: 8,
  },
  statusChipOpen: {
    backgroundColor: "#DCFCE7",
  },
  statusChipFull: {
    backgroundColor: "#FEE2E2",
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "800",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
  },
  passengerCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  orderBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  orderText: {
    fontWeight: "800",
    color: "#92400E",
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontWeight: "700",
    color: colors.secondary,
  },
  passengerMeta: {
    color: colors.textSecondary,
  },
  passengerAddress: {
    color: colors.info,
    marginTop: 2,
  },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  fabWarning: {
    backgroundColor: colors.error,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 18,
  },
  dialogTitle: {
    fontWeight: "800",
    color: colors.secondary,
  },
  dialogText: {
    color: colors.text,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "700",
    color: colors.secondary,
  },
  lotadaWarningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  lotadaWarningText: {
    flex: 1,
    color: "#991B1B",
    fontWeight: "700",
  },
  pickerScroll: {
    maxHeight: 280,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
});
