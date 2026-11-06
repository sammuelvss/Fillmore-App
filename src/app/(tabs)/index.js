import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import {
  Text,
  Surface,
  Card,
  Button,
  Chip,
  SegmentedButtons,
  Avatar,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/useAuthStore";
import { useAppStore } from "../../store/useAppStore";
import { useRotasQuery } from "../../hooks/useRotas";
import { logoutRequest } from "../../api/authApi";
import { API_BASE_URL } from "../../api/client";

/**
 * ============================================================================
 * TELA HOME — DASHBOARD DINÂMICO (Implementado por: Sammuel — 1º a atuar)
 * ============================================================================
 * Funcionalidades:
 * - Cabeçalho com boas-vindas ao usuário logado (`MOTORISTA` ou `RESPONSAVEL`), placa/capacidade da van e botão de Logout (`DELETE /session`).
 * - Seletor Global de Turno sincronizado no Zustand (`useAppStore.turnoFiltro`), refletindo automaticamente na aba de Rotas e Operação.
 * - Resumo estatístico em tempo real consumindo `useRotasQuery` (TanStack Query v5):
 *   total de rotas, rotas filtradas por turno, distância total (km), tempo estimado e vagas ocupadas.
 * - Atalhos diretos para todos os módulos da equipe (Rotas, Alunos, Financeiro/Pix, Operação Diária e Sobre).
 */
export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const turnoFiltro = useAppStore((state) => state.turnoFiltro);
  const setTurnoFiltro = useAppStore((state) => state.setTurnoFiltro);
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  const [loggingOut, setLoggingOut] = useState(false);

  const isMotorista = user?.tipo === "MOTORISTA" || !user?.tipo;
  const {
    data: rotas = [],
    isLoading,
    isRefetching,
    refetch,
  } = useRotasQuery({ enabled: isMotorista });

  // Estatísticas calculadas sobre as rotas retornadas pela API
  const stats = useMemo(() => {
    const listaSegura = Array.isArray(rotas) ? rotas : [];
    const filtradas =
      turnoFiltro === "TODOS"
        ? listaSegura
        : listaSegura.filter((r) => r.turno === turnoFiltro);

    const rotasManha = listaSegura.filter((r) => r.turno === "MANHA").length;
    const rotasTarde = listaSegura.filter((r) => r.turno === "TARDE").length;

    const kmTotal = filtradas.reduce(
      (acc, r) => acc + (Number(r.distanciaTotalKm) || 0),
      0,
    );
    const minTotal = filtradas.reduce(
      (acc, r) => acc + (Number(r.tempoEstimadoMin) || 0),
      0,
    );
    const alunosAlocados = filtradas.reduce((acc, r) => {
      const lista =
        r.turno === "TARDE" ? r.alunosVolta || [] : r.alunosIda || [];
      return acc + (Array.isArray(lista) ? lista.length : 0);
    }, 0);

    return {
      totalGeral: listaSegura.length,
      totalFiltrado: filtradas.length,
      rotasManha,
      rotasTarde,
      kmTotal: kmTotal.toFixed(1),
      minTotal,
      alunosAlocados,
      recentes: filtradas.slice(0, 3),
    };
  }, [rotas, turnoFiltro]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutRequest();
    } catch {
      // Mesmo se o token for de preview ou a rede falhar, garantimos a limpeza local
    } finally {
      clearAuth();
      setLoggingOut(false);
      showSnackbar("Sessão encerrada com segurança.", "info");
      router.replace("/(auth)/login");
    }
  };

  const shortcuts = [
    {
      title: "Rotas Escolares",
      subtitle: "Criar, editar e gerenciar trajetos",
      owner: "Sammuel",
      icon: "map-marker-path",
      color: "#F59E0B",
      bg: "#FEF3C7",
      route: "/(tabs)/rotas",
    },
    {
      title: "Alunos & Lotação",
      subtitle: "Cadastro e vínculo com a van",
      owner: "Joao",
      icon: "account-group",
      color: "#2563EB",
      bg: "#DBEAFE",
      route: "/(tabs)/alunos",
    },
    {
      title: "Mensalidades & Pix",
      subtitle: "Faturas, status e cobrança 1-click",
      owner: "Paulo",
      icon: "cash-check",
      color: "#059669",
      bg: "#D1FAE5",
      route: "/(tabs)/financeiro",
    },
    {
      title: "Operação Diária",
      subtitle: "Presença, faltas e avisos da rota",
      owner: "Edmundo",
      icon: "clipboard-check",
      color: "#7C3AED",
      bg: "#EDE9FE",
      route: "/(tabs)/operacao",
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[colors.primary]}
        />
      }
    >
      {/* Hero Card: Identificação do Motorista / Responsável e Dados da Van */}
      <Surface style={styles.heroCard} elevation={2}>
        <View style={styles.heroTopRow}>
          <View style={styles.userRow}>
            <Avatar.Icon
              size={50}
              icon={isMotorista ? "bus-school" : "account-child-circle"}
              style={styles.avatar}
              color={colors.secondary}
            />
            <View style={styles.userInfo}>
              <View style={styles.badgeRow}>
                <Chip
                  compact
                  style={styles.roleChip}
                  textStyle={styles.roleChipText}
                >
                  {user?.tipo || "MOTORISTA"}
                </Chip>
                {user?.motorista?.placaVeiculo ? (
                  <Chip
                    compact
                    icon="car-info"
                    style={styles.vanChip}
                    textStyle={styles.vanChipText}
                  >
                    {user.motorista.placaVeiculo}
                  </Chip>
                ) : null}
              </View>
              <Text variant="titleMedium" style={styles.userName}>
                Olá, {user?.nome || "Motorista Fillmore"}
              </Text>
              <Text variant="bodySmall" style={styles.userEmail}>
                {user?.email || "Sessão autenticada"}
              </Text>
            </View>
          </View>

          <Button
            mode="outlined"
            icon="logout"
            compact
            loading={loggingOut}
            onPress={handleLogout}
            textColor="#FCA5A5"
            style={styles.logoutBtn}
          >
            Sair
          </Button>
        </View>

        <Divider style={styles.heroDivider} />

        <View style={styles.vanMetaRow}>
          <View style={styles.vanMetaItem}>
            <MaterialCommunityIcons
              name="seat-passenger"
              size={18}
              color={colors.primaryAccent}
            />
            <Text variant="labelMedium" style={styles.vanMetaText}>
              Capacidade: {user?.motorista?.capacidadeVan || 15} lugares
            </Text>
          </View>

          <View style={styles.vanMetaItem}>
            <MaterialCommunityIcons
              name="qrcode"
              size={18}
              color={colors.primaryAccent}
            />
            <Text variant="labelMedium" style={styles.vanMetaText}>
              Pix: {user?.motorista?.chavePix || "Configurar no Perfil"}
            </Text>
          </View>
        </View>
      </Surface>

      {/* Filtro Global de Turno (Zustand `useAppStore`) */}
      <Surface style={styles.filterSection} elevation={1}>
        <View style={styles.filterHeader}>
          <MaterialCommunityIcons
            name="clock-time-four-outline"
            size={20}
            color={colors.secondary}
          />
          <Text variant="titleSmall" style={styles.filterTitle}>
            Filtro Global de Turno (Zustand Store)
          </Text>
        </View>
        <SegmentedButtons
          value={turnoFiltro}
          onValueChange={setTurnoFiltro}
          buttons={[
            {
              value: "TODOS",
              label: `Todos (${stats.totalGeral})`,
              icon: "view-grid-outline",
            },
            {
              value: "MANHA",
              label: `Manhã (${stats.rotasManha})`,
              icon: "weather-sunny",
            },
            {
              value: "TARDE",
              label: `Tarde (${stats.rotasTarde})`,
              icon: "weather-sunset",
            },
          ]}
        />
      </Surface>

      {/* KPIs Operacionais das Rotas */}
      <View style={styles.sectionHeaderRow}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Resumo de Rotas ({turnoFiltro})
        </Text>
        <Button
          mode="text"
          compact
          icon="plus-circle-outline"
          textColor={colors.primaryDark}
          onPress={() => router.push("/(tabs)/rotas/form")}
        >
          Nova Rota
        </Button>
      </View>

      {isLoading ? (
        <Surface style={styles.loadingCard} elevation={1}>
          <ActivityIndicator color={colors.primary} />
          <Text variant="bodySmall" style={styles.loadingLabel}>
            Sincronizando rotas com a API ({API_BASE_URL})...
          </Text>
        </Surface>
      ) : (
        <View style={styles.kpiGrid}>
          <Surface style={styles.kpiCard} elevation={1}>
            <MaterialCommunityIcons
              name="routes"
              size={26}
              color={colors.primaryDark}
            />
            <Text variant="headlineSmall" style={styles.kpiValue}>
              {stats.totalFiltrado}
            </Text>
            <Text variant="labelSmall" style={styles.kpiLabel}>
              Rotas no Turno
            </Text>
          </Surface>

          <Surface style={styles.kpiCard} elevation={1}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={26}
              color="#2563EB"
            />
            <Text variant="headlineSmall" style={styles.kpiValue}>
              {stats.kmTotal} km
            </Text>
            <Text variant="labelSmall" style={styles.kpiLabel}>
              Distância Somada
            </Text>
          </Surface>

          <Surface style={styles.kpiCard} elevation={1}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={26}
              color="#059669"
            />
            <Text variant="headlineSmall" style={styles.kpiValue}>
              {stats.minTotal} min
            </Text>
            <Text variant="labelSmall" style={styles.kpiLabel}>
              Tempo Estimado
            </Text>
          </Surface>

          <Surface style={styles.kpiCard} elevation={1}>
            <MaterialCommunityIcons
              name="account-check-outline"
              size={26}
              color="#7C3AED"
            />
            <Text variant="headlineSmall" style={styles.kpiValue}>
              {stats.alunosAlocados}
            </Text>
            <Text variant="labelSmall" style={styles.kpiLabel}>
              Alunos Vinculados
            </Text>
          </Surface>
        </View>
      )}

      {/* Prévia rápida das rotas cadastradas */}
      {stats.recentes.length > 0 && (
        <Surface style={styles.previewBox} elevation={1}>
          <View style={styles.previewHeader}>
            <Text variant="titleSmall" style={styles.previewTitle}>
              Rotas Ativas no Turno Selecionado
            </Text>
            <Button
              mode="text"
              compact
              onPress={() => router.push("/(tabs)/rotas")}
            >
              Ver todas
            </Button>
          </View>

          {stats.recentes.map((rota) => (
            <View key={rota.id} style={styles.previewItem}>
              <View style={styles.previewLeft}>
                <MaterialCommunityIcons
                  name={
                    rota.turno === "MANHA" ? "weather-sunny" : "weather-sunset"
                  }
                  size={20}
                  color={rota.turno === "MANHA" ? "#D97706" : "#2563EB"}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="bodyMedium"
                    style={styles.previewRotaNome}
                    numberOfLines={1}
                  >
                    {rota.nome}
                  </Text>
                  <Text variant="labelSmall" style={styles.previewRotaMeta}>
                    {rota.turno} • {rota.distanciaTotalKm ?? "-"} km •{" "}
                    {rota.tempoEstimadoMin ?? "-"} min
                  </Text>
                </View>
              </View>
              <Button
                mode="outlined"
                compact
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/rotas/form",
                    params: { id: rota.id },
                  })
                }
              >
                Editar
              </Button>
            </View>
          ))}
        </Surface>
      )}

      {/* Atalhos para os Módulos dos 5 Integrantes */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Módulos do Sistema (4 Pilares Fillmore)
      </Text>
      <View style={styles.shortcutsGrid}>
        {shortcuts.map((item) => (
          <Card
            key={item.title}
            style={styles.shortcutCard}
            mode="elevated"
            onPress={() => router.push(item.route)}
          >
            <Card.Content style={styles.shortcutContent}>
              <View
                style={[styles.shortcutIconBox, { backgroundColor: item.bg }]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={28}
                  color={item.color}
                />
              </View>
              <View style={styles.shortcutTextContainer}>
                <View style={styles.shortcutTitleRow}>
                  <Text variant="titleSmall" style={styles.shortcutTitle}>
                    {item.title}
                  </Text>
                  <Chip compact style={styles.ownerChip} textStyle={styles.ownerChipText}>
                    {item.owner}
                  </Chip>
                </View>
                <Text variant="bodySmall" style={styles.shortcutSubtitle}>
                  {item.subtitle}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={colors.textSecondary}
              />
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Card institucional de acesso à tela Sobre */}
      <Card
        style={styles.aboutBanner}
        mode="outlined"
        onPress={() => router.push("/(tabs)/sobre")}
      >
        <Card.Content style={styles.aboutBannerContent}>
          <MaterialCommunityIcons
            name="school-outline"
            size={28}
            color={colors.primaryDark}
          />
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={styles.aboutBannerTitle}>
              Sobre o Projeto Fillmore & Equipe UNICAP
            </Text>
            <Text variant="bodySmall" style={styles.aboutBannerSub}>
              Veja os detalhes da arquitetura, RAs da equipe e problema
              resolvido em Recife.
            </Text>
          </View>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={colors.secondary}
          />
        </Card.Content>
      </Card>
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
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  roleChip: {
    backgroundColor: colors.primary,
    height: 24,
  },
  roleChipText: {
    color: colors.secondary,
    fontWeight: "800",
    fontSize: 10,
  },
  vanChip: {
    backgroundColor: "#334155",
    height: 24,
  },
  vanChipText: {
    color: "#F8FAFC",
    fontSize: 10,
    fontWeight: "700",
  },
  userName: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  userEmail: {
    color: "#94A3B8",
  },
  logoutBtn: {
    borderColor: "#475569",
    borderRadius: 10,
  },
  heroDivider: {
    backgroundColor: "#334155",
    marginVertical: 12,
  },
  vanMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  vanMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vanMetaText: {
    color: "#E2E8F0",
  },
  filterSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  filterTitle: {
    fontWeight: "700",
    color: colors.secondary,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: "800",
    color: colors.secondary,
    marginBottom: 10,
  },
  loadingCard: {
    padding: 20,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  loadingLabel: {
    color: colors.textSecondary,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 18,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "flex-start",
  },
  kpiValue: {
    fontWeight: "800",
    color: colors.secondary,
    marginTop: 6,
  },
  kpiLabel: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  previewBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  previewTitle: {
    fontWeight: "700",
    color: colors.secondary,
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    gap: 8,
  },
  previewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  previewRotaNome: {
    fontWeight: "700",
    color: colors.secondary,
  },
  previewRotaMeta: {
    color: colors.textSecondary,
  },
  shortcutsGrid: {
    gap: 10,
    marginBottom: 18,
  },
  shortcutCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
  },
  shortcutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shortcutIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutTextContainer: {
    flex: 1,
  },
  shortcutTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  shortcutTitle: {
    fontWeight: "700",
    color: colors.secondary,
  },
  ownerChip: {
    backgroundColor: colors.surfaceVariant,
    height: 22,
  },
  ownerChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  shortcutSubtitle: {
    color: colors.textSecondary,
  },
  aboutBanner: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderRadius: 14,
  },
  aboutBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aboutBannerTitle: {
    fontWeight: "700",
    color: "#92400E",
  },
  aboutBannerSub: {
    color: "#78350F",
  },
});
