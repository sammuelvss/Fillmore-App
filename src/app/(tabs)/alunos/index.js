import React, { useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Banner,
  Button,
  Chip,
  Dialog,
  FAB,
  Portal,
  Searchbar,
  Surface,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../../theme";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import {
  useAlunosDaRotaQuery,
  useAlunosQuery,
  useDeleteAlunoMutation,
  useDesvincularAlunoRotaMutation,
} from "../../../hooks/useAlunos";
import { useRotasQuery } from "../../../hooks/useRotas";
import EmptyState from "../../../components/EmptyState";
import AlunoCard from "../../../components/alunos/AlunoCard";
import VincularRotaDialog from "../../../components/alunos/VincularRotaDialog";
import LotacaoConflitoDialog from "../../../components/alunos/LotacaoConflitoDialog";

const MODALIDADE_FILTERS = [
  { value: "TODOS", label: "Todos" },
  { value: "IDA_E_VOLTA", label: "Ida e Volta" },
  { value: "APENAS_IDA", label: "Só Ida" },
  { value: "APENAS_VOLTA", label: "Só Volta" },
];

/**
 * ============================================================================
 * TELA DE LISTAGEM DE ALUNOS & RELACIONAMENTO 1 (Implementado por: Joao)
 * ============================================================================
 * - Motorista: lista todos os alunos (`GET /alunos`) ou os vinculados à `rotaAtiva` (`GET /rotas/:rotaId/alunos`)
 * - Responsável: lista seus filhos (`GET /responsaveis/:responsavelId/alunos`)
 * - Busca por nome, escola ou responsável + filtro por modalidade
 * - Vínculo / Desvínculo com rotas (`POST/DELETE /rotas/:rotaId/alunos`) com alerta de HTTP 409 (van lotada)
 */
export default function AlunosListScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const rotaAtiva = useAppStore((state) => state.rotaAtiva);
  const setRotaAtiva = useAppStore((state) => state.setRotaAtiva);

  const isMotorista = true;

  const [searchQuery, setSearchQuery] = useState("");
  const [modalidadeFiltro, setModalidadeFiltro] = useState("TODOS");
  const [alunoParaExcluir, setAlunoParaExcluir] = useState(null);
  const [alunoParaDesvincular, setAlunoParaDesvincular] = useState(null);
  const [alunoParaVincular, setAlunoParaVincular] = useState(null);
  const [lotacaoConflito, setLotacaoConflito] = useState(null);

  const filtrarPorRotaAtiva = isMotorista && Boolean(rotaAtiva?.id);

  const alunosQuery = useAlunosQuery({ enabled: !filtrarPorRotaAtiva });
  const alunosDaRotaQuery = useAlunosDaRotaQuery(rotaAtiva?.id, {
    enabled: filtrarPorRotaAtiva,
  });
  const rotasQuery = useRotasQuery({ enabled: isMotorista });

  const deleteMutation = useDeleteAlunoMutation();
  const desvincularMutation = useDesvincularAlunoRotaMutation();

  const activeQuery = filtrarPorRotaAtiva ? alunosDaRotaQuery : alunosQuery;
  const alunos = Array.isArray(activeQuery.data) ? activeQuery.data : [];
  const rotas = Array.isArray(rotasQuery.data) ? rotasQuery.data : [];

  const alunosFiltrados = useMemo(() => {
    const termo = searchQuery.trim().toLowerCase();
    return alunos.filter((aluno) => {
      const matchMod =
        modalidadeFiltro === "TODOS" || aluno.modalidade === modalidadeFiltro;
      if (!matchMod) return false;
      if (!termo) return true;

      const nome = aluno.nome?.toLowerCase() || "";
      const escola = aluno.escola?.toLowerCase() || "";
      const resp = aluno.responsavel?.usuario?.nome?.toLowerCase() || "";
      return (
        nome.includes(termo) ||
        escola.includes(termo) ||
        resp.includes(termo)
      );
    });
  }, [alunos, modalidadeFiltro, searchQuery]);

  const handleOpenCreate = () => {
    router.push("/(tabs)/alunos/form");
  };

  const handleOpenEdit = (aluno) => {
    router.push({
      pathname: "/(tabs)/alunos/form",
      params: { id: aluno.id },
    });
  };

  const handleOpenLotacao = (rota) => {
    if (rota) setRotaAtiva(rota);
    router.push("/(tabs)/alunos/lotacao");
  };

  const handleConfirmDelete = async () => {
    if (!alunoParaExcluir) return;
    try {
      await deleteMutation.mutateAsync(alunoParaExcluir.id);
    } finally {
      setAlunoParaExcluir(null);
    }
  };

  const handleConfirmDesvincular = async () => {
    if (!alunoParaDesvincular || !rotaAtiva?.id) return;
    try {
      await desvincularMutation.mutateAsync({
        rotaId: rotaAtiva.id,
        alunoId: alunoParaDesvincular.id,
      });
    } finally {
      setAlunoParaDesvincular(null);
    }
  };

  const capacidadeVan =
    rotaAtiva?.motorista?.capacidadeVan ||
    user?.motorista?.capacidadeVan ||
    15;

  return (
    <View style={styles.container}>
      {/* Painel Superior de Busca, Filtro e Atalho de Lotação */}
      <Surface style={styles.topControls} elevation={1}>
        <Searchbar
          placeholder="Buscar por aluno, escola ou responsável..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {MODALIDADE_FILTERS.map((f) => {
            const selected = modalidadeFiltro === f.value;
            return (
              <Chip
                key={f.value}
                selected={selected}
                compact
                onPress={() => setModalidadeFiltro(f.value)}
                style={[
                  styles.filterChip,
                  selected && styles.filterChipSelected,
                ]}
                textStyle={[
                  styles.filterChipText,
                  selected && styles.filterChipTextSelected,
                ]}
              >
                {f.label}
              </Chip>
            );
          })}
        </ScrollView>

        {isMotorista ? (
          <Button
            mode="contained-tonal"
            icon="bus-multiple"
            compact
            buttonColor={colors.primaryLight}
            textColor={colors.secondary}
            onPress={() => handleOpenLotacao(rotaAtiva)}
            style={styles.lotacaoBtn}
          >
            Gerenciar Lotação da Van (Rota ↔ Alunos)
          </Button>
        ) : null}
      </Surface>

      {/* Banner de Rota Selecionada no Zustand (quando vem de Rotas -> Alunos) */}
      {filtrarPorRotaAtiva ? (
        <Surface style={styles.rotaActiveBox} elevation={1}>
          <View style={styles.rotaActiveTop}>
            <View style={{ flex: 1 }}>
              <Text variant="labelSmall" style={styles.rotaActiveTag}>
                FILTRANDO POR ROTA SELECIONADA ({rotaAtiva.turno})
              </Text>
              <Text variant="titleSmall" style={styles.rotaActiveTitle}>
                {rotaAtiva.nome}
              </Text>
              <Text variant="labelSmall" style={styles.rotaActiveSub}>
                {alunos.length}/{capacidadeVan} vagas ocupadas nesta rota
              </Text>
            </View>
            <MaterialCommunityIcons
              name="bus-school"
              size={28}
              color="#1E40AF"
            />
          </View>
          <View style={styles.rotaActiveActions}>
            <Button
              mode="contained"
              compact
              icon="seat-passenger"
              buttonColor="#1E40AF"
              textColor="#FFFFFF"
              onPress={() => handleOpenLotacao(rotaAtiva)}
            >
              Lotação da Rota
            </Button>
            <Button
              mode="outlined"
              compact
              icon="close"
              textColor="#1E40AF"
              style={styles.clearRotaBtn}
              onPress={() => setRotaAtiva(null)}
            >
              Ver Todos os Alunos
            </Button>
          </View>
        </Surface>
      ) : null}

      {/* Erro de conexão */}
      {activeQuery.isError ? (
        <Banner
          visible
          icon="cloud-alert"
          actions={[
            { label: "Tentar Novamente", onPress: activeQuery.refetch },
          ]}
          style={styles.errorBanner}
        >
          {activeQuery.error?.friendlyMessage ||
            "Erro ao carregar a lista de alunos."}
        </Banner>
      ) : null}

      {/* Conteúdo Principal */}
      {activeQuery.isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Carregando alunos...
          </Text>
        </View>
      ) : (
        <FlatList
          data={alunosFiltrados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={activeQuery.isRefetching}
              onRefresh={activeQuery.refetch}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <AlunoCard
              aluno={item}
              isMotorista={isMotorista}
              rotaEmFocoId={rotaAtiva?.id || null}
              onEdit={handleOpenEdit}
              onDelete={(aluno) => setAlunoParaExcluir(aluno)}
              onVincularRota={(aluno) => setAlunoParaVincular(aluno)}
              onDesvincularRota={(aluno) => setAlunoParaDesvincular(aluno)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="account-school-outline"
              title={
                filtrarPorRotaAtiva
                  ? "Nenhum aluno vinculado a esta rota"
                  : "Nenhum aluno encontrado"
              }
              description={
                filtrarPorRotaAtiva
                  ? "Use a tela de Lotação da Rota para vincular alunos já cadastrados a este trajeto."
                  : "Cadastre alunos informando escola, modalidade e endereços de embarque e desembarque (guarda compartilhada)."
              }
              actionLabel={
                filtrarPorRotaAtiva ? "Vincular Alunos à Rota" : "Novo Aluno"
              }
              onAction={
                filtrarPorRotaAtiva
                  ? () => handleOpenLotacao(rotaAtiva)
                  : handleOpenCreate
              }
            />
          }
        />
      )}

      {/* Botão Flutuante (FAB) */}
      <FAB
        icon="account-plus"
        label="Novo Aluno"
        style={styles.fab}
        color={colors.secondary}
        onPress={handleOpenCreate}
      />

      {/* Dialog: Confirmar Exclusão de Aluno */}
      <Portal>
        <Dialog
          visible={Boolean(alunoParaExcluir)}
          onDismiss={() => setAlunoParaExcluir(null)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="alert-circle-outline" color={colors.error} />
          <Dialog.Title style={styles.dialogTitle}>
            Excluir Aluno?
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Deseja realmente remover{" "}
              <Text style={styles.boldText}>{alunoParaExcluir?.nome}</Text>?
              Esta ação excluirá o cadastro e seus vínculos no servidor.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setAlunoParaExcluir(null)}
              disabled={deleteMutation.isPending}
              textColor={colors.textSecondary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.error}
              textColor="#FFFFFF"
              loading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
              onPress={handleConfirmDelete}
            >
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog: Confirmar Desvínculo da Rota Ativa */}
      <Portal>
        <Dialog
          visible={Boolean(alunoParaDesvincular)}
          onDismiss={() => setAlunoParaDesvincular(null)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="link-off" color={colors.error} />
          <Dialog.Title style={styles.dialogTitle}>
            Desvincular Aluno da Rota?
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Remover{" "}
              <Text style={styles.boldText}>{alunoParaDesvincular?.nome}</Text>{" "}
              da rota{" "}
              <Text style={styles.boldText}>{rotaAtiva?.nome}</Text>? O
              cadastro do aluno continuará salvo no sistema.
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

      {/* Modal: Vincular Aluno à Rota */}
      <VincularRotaDialog
        visible={Boolean(alunoParaVincular)}
        aluno={alunoParaVincular}
        rotas={rotas}
        rotaInicialId={rotaAtiva?.id || null}
        capacidadePadrao={user?.motorista?.capacidadeVan || 15}
        onDismiss={() => setAlunoParaVincular(null)}
        onLotacaoConflito={(info) => setLotacaoConflito(info)}
      />

      {/* Dialog: Erro 409 Conflict (Van Lotada) */}
      <LotacaoConflitoDialog
        conflito={lotacaoConflito}
        onDismiss={() => setLotacaoConflito(null)}
        onGerenciarLotacao={(rota) => handleOpenLotacao(rota)}
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
    paddingBottom: 12,
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
  filterChipsRow: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.surfaceVariant,
  },
  filterChipSelected: {
    backgroundColor: colors.primaryLight,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: colors.secondary,
    fontWeight: "700",
  },
  lotacaoBtn: {
    borderRadius: 10,
  },
  rotaActiveBox: {
    backgroundColor: "#DBEAFE",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#93C5FD",
    gap: 10,
  },
  rotaActiveTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rotaActiveTag: {
    color: "#1E40AF",
    fontWeight: "800",
  },
  rotaActiveTitle: {
    color: "#1E3A8A",
    fontWeight: "800",
    marginTop: 2,
  },
  rotaActiveSub: {
    color: "#1E40AF",
    marginTop: 2,
  },
  rotaActiveActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  clearRotaBtn: {
    borderColor: "#93C5FD",
  },
  respBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primaryLight,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  respBannerText: {
    flex: 1,
    color: "#92400E",
    fontWeight: "600",
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
