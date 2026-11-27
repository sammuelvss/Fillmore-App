import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  SegmentedButtons,
  Surface,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/useAuthStore";
import { useAppStore } from "../../store/useAppStore";
import { useRotasQuery } from "../../hooks/useRotas";
import { useAlunosDaRotaQuery, useAlunosQuery } from "../../hooks/useAlunos";
import { formatarDataBR, hojeLocal } from "../../utils/format";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import OnboardingCard from "../../components/hoje/OnboardingCard";
import AlunoChecklistItem from "../../components/hoje/AlunoChecklistItem";
import AvisarTodosRotaModal from "../../components/rotas/AvisarTodosRotaModal";

// Aba Hoje (Fase 3): seletor de turno, card "Rota de hoje", resumo do dia e checklist de embarque
export default function HojeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const turnoFiltro = useAppStore((state) => state.turnoFiltro);
  const setTurnoFiltro = useAppStore((state) => state.setTurnoFiltro);
  const rotaAtiva = useAppStore((state) => state.rotaAtiva);
  const setRotaAtiva = useAppStore((state) => state.setRotaAtiva);

  const turnoAtivo = turnoFiltro === "TARDE" ? "TARDE" : "MANHA";
  const dataHoje = hojeLocal();
  const capacidadeVan = user?.motorista?.capacidadeVan || 15;

  const [statusMapa, setStatusMapa] = useState({});
  const [atrasosMapa, setAtrasosMapa] = useState({});
  const [avisarTodosVisible, setAvisarTodosVisible] = useState(false);

  useEffect(() => {
    if (turnoFiltro !== "MANHA" && turnoFiltro !== "TARDE") {
      setTurnoFiltro("MANHA");
    }
  }, [turnoFiltro, setTurnoFiltro]);

  const rotasQuery = useRotasQuery();
  const alunosQuery = useAlunosQuery();

  const rotas = Array.isArray(rotasQuery.data) ? rotasQuery.data : [];
  const todosAlunos = Array.isArray(alunosQuery.data) ? alunosQuery.data : [];

  const rotasDoTurno = useMemo(
    () => rotas.filter((r) => r.turno === turnoAtivo),
    [rotas, turnoAtivo],
  );

  const rotaHoje = useMemo(() => {
    if (rotasDoTurno.length === 0) return null;
    return (
      rotasDoTurno.find((r) => r.id === rotaAtiva?.id) || rotasDoTurno[0]
    );
  }, [rotasDoTurno, rotaAtiva?.id]);

  const alunosRotaQuery = useAlunosDaRotaQuery(rotaHoje?.id, {
    enabled: Boolean(rotaHoje?.id),
  });

  const alunosDaRota = useMemo(() => {
    if (Array.isArray(alunosRotaQuery.data)) {
      return alunosRotaQuery.data;
    }
    if (!rotaHoje) return [];
    const embutidos =
      turnoAtivo === "TARDE" ? rotaHoje.alunosVolta : rotaHoje.alunosIda;
    return Array.isArray(embutidos) ? embutidos : [];
  }, [alunosRotaQuery.data, rotaHoje, turnoAtivo]);

  useEffect(() => {
    setStatusMapa({});
  }, [rotaHoje?.id, turnoAtivo, dataHoje]);

  const handleStatusChange = useCallback((alunoId, st) => {
    setStatusMapa((prev) => {
      const atual = prev[alunoId];
      if (
        atual &&
        atual.embarcou === st.embarcou &&
        atual.ausente === st.ausente
      ) {
        return prev;
      }
      return { ...prev, [alunoId]: st };
    });
  }, []);

  const handleAtrasoChange = useCallback((alunoId, qtd) => {
    setAtrasosMapa((prev) => {
      if (prev[alunoId] === qtd) return prev;
      return { ...prev, [alunoId]: qtd };
    });
  }, []);

  const resumoDia = useMemo(() => {
    let embarcaram = 0;
    let ausentes = 0;
    alunosDaRota.forEach((a) => {
      const st = statusMapa[a.id];
      if (st?.ausente) ausentes += 1;
      else if (st?.embarcou) embarcaram += 1;
    });
    const previstos = Math.max(0, alunosDaRota.length - ausentes);
    const totalAtrasadas = Object.values(atrasosMapa).reduce(
      (acc, n) => acc + (Number(n) || 0),
      0,
    );
    return {
      total: alunosDaRota.length,
      previstos,
      embarcaram,
      ausentes,
      totalAtrasadas,
    };
  }, [alunosDaRota, statusMapa, atrasosMapa]);

  const handleRefresh = async () => {
    await Promise.all([
      rotasQuery.refetch(),
      alunosQuery.refetch(),
      rotaHoje?.id ? alunosRotaQuery.refetch() : Promise.resolve(),
      queryClient.invalidateQueries({ queryKey: ["presencas"] }),
      queryClient.invalidateQueries({ queryKey: ["viagens"] }),
      queryClient.invalidateQueries({ queryKey: ["mensalidades"] }),
    ]);
  };

  if (rotasQuery.isLoading && rotas.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Carregando operação de hoje...
        </Text>
      </View>
    );
  }

  if (rotasQuery.isError && rotas.length === 0) {
    return (
      <View style={styles.containerPadding}>
        <ErrorState
          title="Não foi possível carregar o dia"
          message={
            rotasQuery.error?.friendlyMessage ||
            "Verifique sua conexão e tente de novo."
          }
          onRetry={handleRefresh}
        />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      {/* Card de Onboarding em 3 passos (some quando rotas, alunos e vínculos existem) */}
      <OnboardingCard rotas={rotas} alunos={todosAlunos} />

      {/* 1. Seletor de Turno (Manhã | Tarde) + Atalho visível para Meu Perfil / Sair */}
      <Surface style={styles.shiftBox} elevation={1}>
        <View style={styles.shiftTopRow}>
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={styles.shiftLabel}>
              Hoje • {formatarDataBR(dataHoje)}
            </Text>
            <Text variant="labelSmall" style={styles.shiftSub}>
              Olá, {user?.nome?.split(" ")[0] || "Motorista"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.perfilQuickChip}
            activeOpacity={0.75}
            onPress={() => router.push("/perfil")}
            accessibilityRole="button"
            accessibilityLabel="Abrir Meu Perfil e Sair da conta"
          >
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={18}
              color={colors.secondary}
            />
            <Text variant="labelMedium" style={styles.perfilQuickText}>
              Meu Perfil
            </Text>
          </TouchableOpacity>
        </View>
        <SegmentedButtons
          value={turnoAtivo}
          onValueChange={setTurnoFiltro}
          buttons={[
            {
              value: "MANHA",
              label: "Manhã",
              icon: "weather-sunny",
            },
            {
              value: "TARDE",
              label: "Tarde",
              icon: "weather-sunset",
            },
          ]}
        />

        {rotasDoTurno.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rotasChipsRow}
          >
            {rotasDoTurno.map((r) => {
              const sel = r.id === rotaHoje?.id;
              return (
                <Chip
                  key={r.id}
                  selected={sel}
                  onPress={() => setRotaAtiva(r)}
                  style={[styles.rotaChip, sel && styles.rotaChipSel]}
                  textStyle={sel ? styles.rotaChipTextSel : undefined}
                >
                  {r.nome}
                </Chip>
              );
            })}
          </ScrollView>
        ) : null}
      </Surface>

      {/* 2. Card "Rota de hoje" + Resumo do dia */}
      {rotaHoje ? (
        <Surface style={styles.rotaCard} elevation={2}>
          <View style={styles.rotaTopRow}>
            <View style={{ flex: 1 }}>
              <Text variant="labelMedium" style={styles.eyebrow}>
                ROTA DE HOJE ({turnoAtivo === "MANHA" ? "MANHÃ" : "TARDE"})
              </Text>
              <Text variant="titleLarge" style={styles.rotaNome}>
                {rotaHoje.nome}
              </Text>
            </View>
            <Chip
              compact
              icon="seat-passenger"
              style={styles.lotacaoChip}
              textStyle={styles.lotacaoChipText}
            >
              {alunosDaRota.length}/{capacidadeVan}
            </Chip>
          </View>

          <View style={styles.resumoRow}>
            <View style={styles.resumoBadge}>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color="#6EE7B7"
              />
              <Text variant="bodyMedium" style={styles.resumoTexto}>
                {resumoDia.embarcaram} de {resumoDia.previstos} embarcaram
              </Text>
            </View>
            {resumoDia.ausentes > 0 ? (
              <Text variant="bodySmall" style={styles.ausentesTexto}>
                • {resumoDia.ausentes} não{" "}
                {resumoDia.ausentes === 1 ? "vai" : "vão"} hoje
              </Text>
            ) : null}
          </View>

          {resumoDia.totalAtrasadas > 0 ? (
            <TouchableOpacity
              style={styles.atrasoBanner}
              onPress={() => router.push("/(tabs)/financeiro")}
              accessibilityLabel="Ver mensalidades em atraso no Financeiro"
            >
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color="#FCA5A5"
              />
              <Text variant="bodySmall" style={styles.atrasoTexto}>
                {resumoDia.totalAtrasadas}{" "}
                {resumoDia.totalAtrasadas === 1
                  ? "mensalidade em atraso"
                  : "mensalidades em atraso"}{" "}
                • Toque para ver no Financeiro
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color="#FCA5A5"
              />
            </TouchableOpacity>
          ) : null}

          <Button
            mode="contained"
            icon="navigation-variant"
            buttonColor={colors.primary}
            textColor={colors.text}
            contentStyle={styles.mainBtnContent}
            style={styles.mainBtn}
            onPress={() => {
              setRotaAtiva(rotaHoje);
              router.push({
                pathname: "/(tabs)/rotas/trajeto",
                params: { id: rotaHoje.id },
              });
            }}
          >
            Iniciar trajeto
          </Button>

          {alunosDaRota.length > 0 ? (
            <Button
              mode="outlined"
              icon="whatsapp"
              textColor="#FFFFFF"
              contentStyle={{ minHeight: 48 }}
              style={styles.avisarTodosBtn}
              onPress={() => setAvisarTodosVisible(true)}
            >
              Avisar início da rota a todos ({alunosDaRota.length})
            </Button>
          ) : null}
        </Surface>
      ) : null}

      {rotaHoje && alunosDaRota.length > 0 ? (
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Lista de embarque ({alunosDaRota.length})
        </Text>
      ) : null}
    </View>
  );

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={rotaHoje ? alunosDaRota : []}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={rotasQuery.isRefetching || alunosRotaQuery.isRefetching}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <AlunoChecklistItem
            aluno={item}
            turno={turnoAtivo}
            dataHoje={dataHoje}
            motoristaNome={user?.nome}
            onStatusChange={handleStatusChange}
            onAtrasoChange={handleAtrasoChange}
          />
        )}
        ListEmptyComponent={
          !rotaHoje ? (
            <EmptyState
              icon="map-marker-plus-outline"
              title={`Nenhuma rota no turno da ${
                turnoAtivo === "MANHA" ? "manhã" : "tarde"
              }`}
              description="Crie sua rota deste turno para acompanhar os alunos e iniciar o trajeto do dia."
              actionLabel="Criar minha primeira rota"
              onAction={() => router.push("/(tabs)/rotas/form")}
            />
          ) : alunosRotaQuery.isLoading ? (
            <View style={styles.loaderInline}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text variant="bodySmall" style={styles.loadingText}>
                Carregando alunos da rota...
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="account-plus-outline"
              title="Sem alunos nesta rota"
              description={
                todosAlunos.length === 0
                  ? "Cadastre seus alunos para vinculá-los à rota e marcar os embarques do dia."
                  : "Vincule os alunos já cadastrados a esta rota para montar sua lista de embarque."
              }
              actionLabel={
                todosAlunos.length === 0
                  ? "Cadastrar aluno"
                  : "Vincular alunos à rota"
              }
              onAction={() =>
                router.push(
                  todosAlunos.length === 0
                    ? "/(tabs)/alunos/form"
                    : "/(tabs)/alunos/lotacao",
                )
              }
            />
          )
        }
      />

      <AvisarTodosRotaModal
        visible={avisarTodosVisible}
        onDismiss={() => setAvisarTodosVisible(false)}
        rotaNome={rotaHoje?.nome}
        turno={turnoAtivo}
        alunos={alunosDaRota.filter((a) => !statusMapa[a.id]?.ausente)}
        motoristaNome={user?.nome}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerPadding: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
    gap: 12,
  },
  loaderInline: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  headerBlock: {
    gap: 16,
    marginBottom: 12,
  },
  shiftBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  shiftTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shiftLabel: {
    fontWeight: "800",
    color: colors.text,
  },
  shiftSub: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  perfilQuickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  perfilQuickText: {
    color: colors.secondary,
    fontWeight: "800",
  },
  rotasChipsRow: {
    gap: 8,
    paddingTop: 4,
  },
  rotaChip: {
    backgroundColor: colors.surfaceVariant,
  },
  rotaChipSel: {
    backgroundColor: colors.primaryLight,
  },
  rotaChipTextSel: {
    color: colors.text,
    fontWeight: "800",
  },
  rotaCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  rotaTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  eyebrow: {
    color: colors.primaryAccent,
    fontWeight: "800",
  },
  rotaNome: {
    color: "#FFFFFF",
    fontWeight: "800",
    marginTop: 2,
  },
  lotacaoChip: {
    backgroundColor: "#334155",
  },
  lotacaoChipText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  resumoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  resumoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resumoTexto: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  ausentesTexto: {
    color: "#CBD5E1",
  },
  atrasoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.16)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  atrasoTexto: {
    flex: 1,
    color: "#FECACA",
    fontWeight: "700",
  },
  mainBtn: {
    borderRadius: 12,
    marginTop: 4,
  },
  mainBtnContent: {
    height: 52,
  },
  avisarTodosBtn: {
    borderRadius: 12,
    borderColor: "rgba(255,255,255,0.35)",
  },
  sectionTitle: {
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
});
