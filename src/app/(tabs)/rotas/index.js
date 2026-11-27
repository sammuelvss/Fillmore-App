import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import {
  Text,
  Surface,
  SegmentedButtons,
  Searchbar,
  FAB,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { colors } from "../../../theme";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import { useRotasQuery } from "../../../hooks/useRotas";
import RotaCard from "../../../components/RotaCard";
import EmptyState from "../../../components/EmptyState";
import ErrorState from "../../../components/ErrorState";

/**
 * Listagem de Rotas Escolares — Fase 4
 * - Filtro por turno (Todos | Manhã | Tarde) e busca textual
 * - Cada card mostra lotação (ocupadas/capacidade)
 * - Toque no card abre o Detalhe da Rota (`/(tabs)/rotas/detalhe`)
 * - FAB "+" abre o wizard de Nova Rota (`/(tabs)/rotas/form`)
 */
export default function RotasListScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setRotaAtiva = useAppStore((state) => state.setRotaAtiva);

  const [turnoFiltroLocal, setTurnoFiltroLocal] = useState("TODOS");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: rotas = [],
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
  } = useRotasQuery();

  const rotasFiltradas = useMemo(() => {
    const listaSegura = Array.isArray(rotas) ? rotas : [];
    return listaSegura.filter((rota) => {
      const matchTurno =
        turnoFiltroLocal === "TODOS" || rota.turno === turnoFiltroLocal;
      const matchSearch =
        !searchQuery.trim() ||
        rota.nome?.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchTurno && matchSearch;
    });
  }, [rotas, turnoFiltroLocal, searchQuery]);

  const handleOpenCreate = () => {
    router.push("/(tabs)/rotas/form");
  };

  const handleOpenDetalhe = (rota) => {
    setRotaAtiva(rota);
    router.push({
      pathname: "/(tabs)/rotas/detalhe",
      params: { id: rota.id },
    });
  };

  const handleManageAlunos = (rota) => {
    setRotaAtiva(rota);
    router.push("/(tabs)/alunos/lotacao");
  };

  const handleViewTrajeto = (rota) => {
    setRotaAtiva(rota);
    router.push({
      pathname: "/(tabs)/rotas/trajeto",
      params: { id: rota.id },
    });
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.topControls} elevation={1}>
        <Searchbar
          placeholder="Buscar rota por bairro ou colégio..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />

        <SegmentedButtons
          value={turnoFiltroLocal}
          onValueChange={setTurnoFiltroLocal}
          buttons={[
            {
              value: "TODOS",
              label: "Todas",
              icon: "format-list-bulleted",
            },
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
          density="small"
        />
      </Surface>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Buscando rotas escolares...
          </Text>
        </View>
      ) : isError ? (
        <ErrorState
          message={
            error?.friendlyMessage ||
            "Não foi possível carregar as rotas escolares."
          }
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={rotasFiltradas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <RotaCard
              rota={item}
              capacidadePadrao={user?.motorista?.capacidadeVan || 15}
              onPress={handleOpenDetalhe}
              onManageAlunos={handleManageAlunos}
              onViewTrajeto={handleViewTrajeto}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="map-marker-plus-outline"
              title={
                turnoFiltroLocal === "TODOS"
                  ? "Nenhuma rota escolar cadastrada"
                  : `Nenhuma rota no turno da ${
                      turnoFiltroLocal === "MANHA" ? "Manhã" : "Tarde"
                    }`
              }
              description="Cadastre os trajetos de ida (manhã) e volta (tarde) da sua van escolar para organizar o embarque dos alunos."
              actionLabel="Nova Rota"
              onAction={handleOpenCreate}
            />
          }
        />
      )}

      <FAB
        icon="plus"
        label="Nova Rota"
        style={styles.fab}
        color={colors.text}
        onPress={handleOpenCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topControls: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  searchbar: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    height: 44,
  },
  searchInput: {
    minHeight: 0,
    fontSize: 14,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
  },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
});
