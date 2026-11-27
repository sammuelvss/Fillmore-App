import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  Dialog,
  Divider,
  Portal,
  ProgressBar,
  Surface,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../../../theme";
import { TURNOS } from "../../../constants";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import {
  useCreateRotaMutation,
  useDeleteRotaMutation,
  useRotaDetailQuery,
} from "../../../hooks/useRotas";
import { useAlunosDaRotaQuery } from "../../../hooks/useAlunos";
import ErrorState from "../../../components/ErrorState";

/**
 * Detalhe da Rota Escolar — Fase 4
 * Exibe:
 * - Resumo da rota, turno, distância/tempo e barra de ocupação
 * - Ação primária: "Ver trajeto" (52dp, amarelo com texto escuro)
 * - "Gerenciar alunos" (abre lotação da van)
 * - "Duplicar para o outro turno" (cria nova rota com o turno oposto e abre edição)
 * - "Editar rota" e "Excluir rota"
 * - Lista de alunos vinculados com toque para abrir o Detalhe do Aluno
 */
export default function RotaDetalheScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rotaId = Array.isArray(params.id) ? params.id[0] : params.id;

  const user = useAuthStore((state) => state.user);
  const setRotaAtiva = useAppStore((state) => state.setRotaAtiva);
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const rotaQuery = useRotaDetailQuery(rotaId);
  const alunosQuery = useAlunosDaRotaQuery(rotaId);
  const createRotaMutation = useCreateRotaMutation();
  const deleteRotaMutation = useDeleteRotaMutation();

  const rota = rotaQuery.data;
  const alunos = Array.isArray(alunosQuery.data) ? alunosQuery.data : [];

  if (rotaQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Carregando detalhes da rota...
        </Text>
      </View>
    );
  }

  if (rotaQuery.isError || !rota) {
    return (
      <ErrorState
        message={
          rotaQuery.error?.friendlyMessage ||
          "Não foi possível carregar os detalhes desta rota."
        }
        onRetry={rotaQuery.refetch}
      />
    );
  }

  const isManha = rota.turno === "MANHA";
  const turnoInfo = TURNOS[rota.turno] || TURNOS.MANHA;
  const turnoOposto = isManha ? "TARDE" : "MANHA";
  const turnoOpostoInfo = TURNOS[turnoOposto];

  const capacidadeMaxima =
    rota.motorista?.capacidadeVan || user?.motorista?.capacidadeVan || 15;
  const vagasOcupadas = alunos.length;
  const percentual = Math.min(
    1,
    capacidadeMaxima > 0 ? vagasOcupadas / capacidadeMaxima : 0,
  );
  const isLotada = vagasOcupadas >= capacidadeMaxima;

  const handleVerTrajeto = () => {
    setRotaAtiva(rota);
    router.push({
      pathname: "/(tabs)/rotas/trajeto",
      params: { id: rota.id },
    });
  };

  const handleGerenciarAlunos = () => {
    setRotaAtiva(rota);
    router.push("/(tabs)/alunos/lotacao");
  };

  const handleEditar = () => {
    router.push({
      pathname: "/(tabs)/rotas/form",
      params: { id: rota.id },
    });
  };

  const handleDuplicarOutroTurno = async () => {
    const sufixoLimpo = String(rota.nome || "Rota")
      .replace(/\s*\((manh[ãa]|tarde|ida|volta)\)\s*$/i, "")
      .trim();
    const novoNome = `${sufixoLimpo} (${turnoOpostoInfo.shortLabel})`;

    try {
      const novaRota = await createRotaMutation.mutateAsync({
        nome: novoNome,
        turno: turnoOposto,
        pontoInicialLat:
          rota.pontoFinalLat != null
            ? rota.pontoFinalLat
            : rota.pontoInicialLat ?? null,
        pontoInicialLng:
          rota.pontoFinalLng != null
            ? rota.pontoFinalLng
            : rota.pontoInicialLng ?? null,
        pontoFinalLat:
          rota.pontoInicialLat != null
            ? rota.pontoInicialLat
            : rota.pontoFinalLat ?? null,
        pontoFinalLng:
          rota.pontoInicialLng != null
            ? rota.pontoInicialLng
            : rota.pontoFinalLng ?? null,
        distanciaTotalKm: rota.distanciaTotalKm ?? null,
        tempoEstimadoMin: rota.tempoEstimadoMin ?? null,
      });

      showSnackbar(
        `Rota duplicada para o turno da ${turnoOpostoInfo.shortLabel}! Revise os dados se desejar.`,
        "success",
      );

      if (novaRota?.id) {
        router.push({
          pathname: "/(tabs)/rotas/form",
          params: { id: novaRota.id },
        });
      }
    } catch {
      // erro já exibido pelo hook
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteRotaMutation.mutateAsync(rota.id);
      setConfirmDeleteVisible(false);
      router.replace("/(tabs)/rotas");
    } catch {
      setConfirmDeleteVisible(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={rotaQuery.isRefetching || alunosQuery.isRefetching}
          onRefresh={() => {
            rotaQuery.refetch();
            alunosQuery.refetch();
          }}
          colors={[colors.primary]}
        />
      }
    >
      {/* Card Principal da Rota */}
      <Surface style={styles.heroCard} elevation={1}>
        <View style={styles.headerTopRow}>
          <Chip
            icon={turnoInfo.icon}
            compact
            style={[
              styles.turnoChip,
              isManha ? styles.manhaChip : styles.tardeChip,
            ]}
            textStyle={[
              styles.turnoChipText,
              isManha ? styles.manhaChipText : styles.tardeChipText,
            ]}
          >
            {turnoInfo.label}
          </Chip>

          <Chip
            compact
            icon="seat-passenger"
            style={[
              styles.lotacaoChip,
              isLotada ? styles.lotacaoChipFull : styles.lotacaoChipOpen,
            ]}
            textStyle={{
              fontWeight: "800",
              color: isLotada ? "#991B1B" : "#166534",
            }}
          >
            {vagasOcupadas}/{capacidadeMaxima} vagas
          </Chip>
        </View>

        <Text variant="headlineSmall" style={styles.rotaNome}>
          {rota.nome}
        </Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={18}
              color={colors.secondary}
            />
            <Text variant="bodyMedium" style={styles.metricText}>
              {rota.distanciaTotalKm != null
                ? `${Number(rota.distanciaTotalKm).toFixed(1)} km`
                : "Distância automática"}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color={colors.secondary}
            />
            <Text variant="bodyMedium" style={styles.metricText}>
              {rota.tempoEstimadoMin != null
                ? `~${rota.tempoEstimadoMin} min`
                : "Tempo automático"}
            </Text>
          </View>
        </View>

        <View style={styles.capacityBox}>
          <View style={styles.capacityHeader}>
            <Text variant="labelMedium" style={styles.capacityLabel}>
              Lotação da van neste turno
            </Text>
            <Text
              variant="labelMedium"
              style={{
                fontWeight: "800",
                color: isLotada ? colors.error : colors.success,
              }}
            >
              {isLotada
                ? "VAN LOTADA"
                : `${capacidadeMaxima - vagasOcupadas} vagas disponíveis`}
            </Text>
          </View>
          <ProgressBar
            progress={percentual}
            color={isLotada ? colors.error : colors.primary}
            style={styles.progressBar}
          />
        </View>

        {/* Ação Primária: Ver Trajeto */}
        <Button
          mode="contained"
          icon="navigation-variant"
          onPress={handleVerTrajeto}
          buttonColor={colors.primary}
          textColor={colors.text}
          style={styles.primaryBtn}
          contentStyle={styles.primaryBtnContent}
          labelStyle={styles.primaryBtnLabel}
        >
          Ver trajeto
        </Button>

        {/* Ações Secundárias */}
        <View style={styles.secondaryActionsGrid}>
          <Button
            mode="outlined"
            icon="account-multiple-plus-outline"
            onPress={handleGerenciarAlunos}
            textColor={colors.secondary}
            style={styles.secondaryBtn}
            contentStyle={styles.secondaryBtnContent}
          >
            Gerenciar alunos
          </Button>

          <Button
            mode="outlined"
            icon="pencil-outline"
            onPress={handleEditar}
            textColor={colors.secondary}
            style={styles.secondaryBtn}
            contentStyle={styles.secondaryBtnContent}
          >
            Editar
          </Button>
        </View>

        <Button
          mode="contained-tonal"
          icon="content-duplicate"
          onPress={handleDuplicarOutroTurno}
          loading={createRotaMutation.isPending}
          disabled={createRotaMutation.isPending}
          buttonColor={colors.primaryLight}
          textColor={colors.text}
          style={styles.duplicateBtn}
          contentStyle={styles.secondaryBtnContent}
        >
          Duplicar para o turno da {turnoOpostoInfo.shortLabel}
        </Button>
      </Surface>

      {/* Lista de Alunos Vinculados */}
      <Surface style={styles.sectionCard} elevation={1}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Alunos vinculados ({vagasOcupadas})
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              Toque em um aluno para ver detalhes ou falar com o responsável
            </Text>
          </View>
          <Button
            mode="text"
            compact
            icon="seat-passenger"
            textColor={colors.primaryDark}
            onPress={handleGerenciarAlunos}
          >
            Lotação
          </Button>
        </View>

        <Divider style={styles.divider} />

        {alunosQuery.isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginVertical: 16 }}
          />
        ) : alunos.length === 0 ? (
          <View style={styles.emptyAlunosBox}>
            <MaterialCommunityIcons
              name="account-school-outline"
              size={32}
              color={colors.textSecondary}
            />
            <Text variant="bodyMedium" style={styles.emptyAlunosText}>
              Nenhum aluno vinculado a esta rota ainda.
            </Text>
            <Button
              mode="contained-tonal"
              icon="account-plus-outline"
              buttonColor={colors.primaryLight}
              textColor={colors.text}
              onPress={handleGerenciarAlunos}
            >
              Vincular alunos agora
            </Button>
          </View>
        ) : (
          alunos.map((aluno, index) => {
            const ordem = isManha
              ? aluno.ordemNaRotaIda
              : aluno.ordemNaRotaVolta;
            const endereco = isManha
              ? aluno.enderecoEmbarque || aluno.enderecoDesembarque
              : aluno.enderecoDesembarque || aluno.enderecoEmbarque;

            return (
              <TouchableOpacity
                key={aluno.id}
                style={[
                  styles.alunoRow,
                  index < alunos.length - 1 && styles.alunoRowBorder,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/alunos/detalhe",
                    params: { id: aluno.id },
                  })
                }
              >
                <View style={styles.orderBadge}>
                  <Text variant="labelLarge" style={styles.orderText}>
                    #{ordem || index + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="titleSmall" style={styles.alunoNome}>
                    {aluno.nome}
                  </Text>
                  <Text variant="bodySmall" style={styles.alunoEscola}>
                    {aluno.escola}
                  </Text>
                  {endereco ? (
                    <Text
                      variant="labelSmall"
                      style={styles.alunoEndereco}
                      numberOfLines={1}
                    >
                      {endereco}
                    </Text>
                  ) : null}
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            );
          })
        )}
      </Surface>

      {/* Zona de Exclusão */}
      <Button
        mode="outlined"
        icon="trash-can-outline"
        textColor={colors.error}
        style={styles.deleteBtn}
        contentStyle={styles.secondaryBtnContent}
        onPress={() => setConfirmDeleteVisible(true)}
      >
        Excluir esta rota
      </Button>

      <Portal>
        <Dialog
          visible={confirmDeleteVisible}
          onDismiss={() => setConfirmDeleteVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="alert-circle-outline" color={colors.error} />
          <Dialog.Title style={styles.dialogTitle}>
            Excluir Rota Escolar?
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Tem certeza que deseja excluir a rota{" "}
              <Text style={styles.boldText}>&quot;{rota.nome}&quot;</Text>? Os
              alunos continuarão cadastrados no aplicativo.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setConfirmDeleteVisible(false)}
              textColor={colors.textSecondary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.error}
              textColor="#FFFFFF"
              loading={deleteRotaMutation.isPending}
              disabled={deleteRotaMutation.isPending}
              onPress={handleConfirmDelete}
            >
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  turnoChip: {
    borderRadius: 8,
  },
  manhaChip: {
    backgroundColor: "#FEF3C7",
  },
  tardeChip: {
    backgroundColor: "#DBEAFE",
  },
  turnoChipText: {
    fontWeight: "800",
    fontSize: 12,
  },
  manhaChipText: {
    color: "#92400E",
  },
  tardeChipText: {
    color: "#1E40AF",
  },
  lotacaoChip: {
    borderRadius: 8,
  },
  lotacaoChipOpen: {
    backgroundColor: "#DCFCE7",
  },
  lotacaoChipFull: {
    backgroundColor: "#FEE2E2",
  },
  rotaNome: {
    fontWeight: "800",
    color: colors.secondary,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricText: {
    color: colors.secondary,
    fontWeight: "600",
  },
  capacityBox: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  capacityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  capacityLabel: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  primaryBtn: {
    borderRadius: 12,
    marginTop: 4,
  },
  primaryBtnContent: {
    height: 52,
  },
  primaryBtnLabel: {
    fontWeight: "800",
    fontSize: 16,
  },
  secondaryActionsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    borderColor: colors.border,
  },
  secondaryBtnContent: {
    minHeight: 48,
  },
  duplicateBtn: {
    borderRadius: 12,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: "800",
    color: colors.secondary,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    marginVertical: 12,
  },
  emptyAlunosBox: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  emptyAlunosText: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  alunoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    minHeight: 56,
  },
  alunoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  orderText: {
    fontWeight: "800",
    color: "#92400E",
  },
  alunoNome: {
    fontWeight: "700",
    color: colors.secondary,
  },
  alunoEscola: {
    color: colors.textSecondary,
  },
  alunoEndereco: {
    color: colors.info,
    marginTop: 2,
  },
  deleteBtn: {
    borderRadius: 12,
    borderColor: "#FCA5A5",
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 18,
  },
  dialogTitle: {
    textAlign: "center",
    fontWeight: "800",
    color: colors.secondary,
  },
  dialogText: {
    color: colors.text,
    textAlign: "center",
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "700",
    color: colors.secondary,
  },
});
