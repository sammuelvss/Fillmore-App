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
  Portal,
  Dialog,
  Button,
  ActivityIndicator,
  Banner,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { colors } from "../../../theme";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import {
  useRotasQuery,
  useDeleteRotaMutation,
} from "../../../hooks/useRotas";
import RotaCard from "../../../components/RotaCard";
import EmptyState from "../../../components/EmptyState";

/**
 * ============================================================================
 * TELA DE LISTAGEM DE ROTAS ESCOLARES (Implementado por: Sammuel — 1º a atuar)
 * ============================================================================
 * Requisitos atendidos:
 * - Listagem consumindo `GET /rotas` via `useRotasQuery` (TanStack Query v5)
 * - Filtro visual por turno (`TODOS`, `MANHA`, `TARDE`) sincronizado com Zustand (`useAppStore`)
 * - Busca textual por nome da rota
 * - Exibição de distância (km), tempo estimado (min) e lotação/capacidade da van
 * - Exclusão (`DELETE /rotas/:id`) com `Dialog` de confirmação e invalidação de cache
 * - FAB (`Floating Action Button`) para criar nova rota
 */
export default function RotasListScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const turnoFiltro = useAppStore((state) => state.turnoFiltro);
  const setTurnoFiltro = useAppStore((state) => state.setTurnoFiltro);
  const setRotaAtiva = useAppStore((state) => state.setRotaAtiva);

  const [searchQuery, setSearchQuery] = useState("");
  const [rotaParaExcluir, setRotaParaExcluir] = useState(null);

  const isMotorista = user?.tipo === "MOTORISTA" || !user?.tipo;

  const {
    data: rotas = [],
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
  } = useRotasQuery({ enabled: isMotorista });

  const deleteRotaMutation = useDeleteRotaMutation();

  // Filtra rotas por turno (Zustand) e pelo texto de busca
  const rotasFiltradas = useMemo(() => {
    const listaSegura = Array.isArray(rotas) ? rotas : [];
    return listaSegura.filter((rota) => {
      const matchTurno =
        turnoFiltro === "TODOS" || rota.turno === turnoFiltro;
      const matchSearch =
        !searchQuery.trim() ||
        rota.nome?.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchTurno && matchSearch;
    });
  }, [rotas, turnoFiltro, searchQuery]);

  const handleOpenCreate = () => {
    router.push("/(tabs)/rotas/form");
  };

  const handleOpenEdit = (rota) => {
    router.push({
      pathname: "/(tabs)/rotas/form",
      params: {
        id: rota.id,
        nome: rota.nome,
        turno: rota.turno,
        pontoInicialLat:
          rota.pontoInicialLat !== null && rota.pontoInicialLat !== undefined
            ? String(rota.pontoInicialLat)
            : "",
        pontoInicialLng:
          rota.pontoInicialLng !== null && rota.pontoInicialLng !== undefined
            ? String(rota.pontoInicialLng)
            : "",
        pontoFinalLat:
          rota.pontoFinalLat !== null && rota.pontoFinalLat !== undefined
            ? String(rota.pontoFinalLat)
            : "",
        pontoFinalLng:
          rota.pontoFinalLng !== null && rota.pontoFinalLng !== undefined
            ? String(rota.pontoFinalLng)
            : "",
        distanciaTotalKm:
          rota.distanciaTotalKm !== null && rota.distanciaTotalKm !== undefined
            ? String(rota.distanciaTotalKm)
            : "",
        tempoEstimadoMin:
          rota.tempoEstimadoMin !== null && rota.tempoEstimadoMin !== undefined
            ? String(rota.tempoEstimadoMin)
            : "",
      },
    });
  };

  const handleViewAlunosDaRota = (rota) => {
    setRotaAtiva(rota);
    router.push("/(tabs)/alunos");
  };

  const handleConfirmDelete = async () => {
    if (!rotaParaExcluir) return;
    try {
      await deleteRotaMutation.mutateAsync(rotaParaExcluir.id);
    } finally {
      setRotaParaExcluir(null);
    }
  };

  if (!isMotorista) {
    return (
      <View style={styles.centeredContainer}>
        <EmptyState
          icon="shield-lock-outline"
          title="Acesso Restrito ao Motorista"
          description="De acordo com as regras de negócio da API (/rotas), apenas usuários autenticados com perfil MOTORISTA podem cadastrar ou gerenciar rotas escolares."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Painel Superior de Busca e Filtro por Turno */}
      <Surface style={styles.topControls} elevation={1}>
        <Searchbar
          placeholder="Buscar rota por bairro ou colégio..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />

        <SegmentedButtons
          value={turnoFiltro}
          onValueChange={setTurnoFiltro}
          buttons={[
            {
              value: "TODOS",
              label: "Todos",
              icon: "format-list-bulleted",
            },
            {
              value: "MANHA",
              label: "Manhã (Ida)",
              icon: "weather-sunny",
            },
            {
              value: "TARDE",
              label: "Tarde (Volta)",
              icon: "weather-sunset",
            },
          ]}
          density="small"
        />
      </Surface>

      {/* Banner de Erro de Conexão (caso a API esteja offline ou URL não configurada) */}
      {isError && (
        <Banner
          visible
          icon="cloud-alert"
          actions={[
            {
              label: "Tentar Novamente",
              onPress: refetch,
            },
          ]}
          style={styles.errorBanner}
        >
          {error?.friendlyMessage ||
            "Erro ao carregar as rotas da API. Verifique sua conexão e a URL configurada."}
        </Banner>
      )}

      {/* Conteúdo Principal: Loading ou Lista */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Buscando rotas escolares no servidor...
          </Text>
        </View>
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
              onEdit={handleOpenEdit}
              onDelete={(rota) => setRotaParaExcluir(rota)}
              onViewAlunos={handleViewAlunosDaRota}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="map-marker-plus-outline"
              title={
                turnoFiltro === "TODOS"
                  ? "Nenhuma rota escolar cadastrada"
                  : `Nenhuma rota no turno da ${
                      turnoFiltro === "MANHA" ? "Manhã" : "Tarde"
                    }`
              }
              description="Cadastre os trajetos de ida (manhã) e volta (tarde) da sua van escolar em Recife para organizar o embarque dos alunos."
              actionLabel="Cadastrar Nova Rota"
              onAction={handleOpenCreate}
            />
          }
        />
      )}

      {/* Botão Flutuante (FAB) para Criar Nova Rota */}
      <FAB
        icon="plus"
        label="Nova Rota"
        style={styles.fab}
        color={colors.secondary}
        onPress={handleOpenCreate}
      />

      {/* Modal/Dialog de Confirmação de Exclusão */}
      <Portal>
        <Dialog
          visible={Boolean(rotaParaExcluir)}
          onDismiss={() => setRotaParaExcluir(null)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="alert-circle-outline" color={colors.error} />
          <Dialog.Title style={styles.dialogTitle}>
            Excluir Rota Escolar?
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Tem certeza que deseja excluir a rota{" "}
              <Text style={styles.boldText}>
                &quot;{rotaParaExcluir?.nome}&quot;
              </Text>{" "}
              ({rotaParaExcluir?.turno})? Esta ação removerá o registro no
              servidor e atualizará a listagem automaticamente.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setRotaParaExcluir(null)}
              disabled={deleteRotaMutation.isPending}
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
              Confirmar Exclusão
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
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
  errorBanner: {
    backgroundColor: colors.errorLight,
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
