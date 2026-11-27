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
  Chip,
  FAB,
  Searchbar,
  Surface,
  Text,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { colors } from "../../../theme";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import { useAlunosQuery } from "../../../hooks/useAlunos";
import { useRotasQuery } from "../../../hooks/useRotas";
import EmptyState from "../../../components/EmptyState";
import ErrorState from "../../../components/ErrorState";
import AlunoCard from "../../../components/alunos/AlunoCard";
import VincularRotaDialog from "../../../components/alunos/VincularRotaDialog";
import LotacaoConflitoDialog from "../../../components/alunos/LotacaoConflitoDialog";
import { abrirWhatsApp } from "../../../utils/whatsapp";
import { mensagemContatoResponsavel } from "../../../utils/mensagens";

const FILTROS_ALUNOS = [
  { value: "TODOS", label: "Todos" },
  { value: "SEM_ROTA", label: "Sem rota" },
  { value: "IDA_E_VOLTA", label: "Ida e Volta" },
  { value: "APENAS_IDA", label: "Só Ida" },
  { value: "APENAS_VOLTA", label: "Só Volta" },
];

/**
 * Listagem de Alunos — Fase 4
 * - Busca por nome, escola ou responsável
 * - Filtro rápido incluindo "Sem rota" e modalidades
 * - Card destaca a rota atual (ou "Sem rota") e toque abre o Detalhe do Aluno
 * - Botão "+" abre o wizard de Novo Aluno em 4 etapas
 */
export default function AlunosListScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  const [searchQuery, setSearchQuery] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("TODOS");
  const [alunoParaVincular, setAlunoParaVincular] = useState(null);
  const [lotacaoConflito, setLotacaoConflito] = useState(null);

  const alunosQuery = useAlunosQuery();
  const rotasQuery = useRotasQuery();

  const alunos = Array.isArray(alunosQuery.data) ? alunosQuery.data : [];
  const rotas = Array.isArray(rotasQuery.data) ? rotasQuery.data : [];

  const alunosFiltrados = useMemo(() => {
    const termo = searchQuery.trim().toLowerCase();
    return alunos.filter((aluno) => {
      if (filtroAtivo === "SEM_ROTA") {
        if (aluno.rotaIda || aluno.rotaVolta) return false;
      } else if (filtroAtivo !== "TODOS") {
        if (aluno.modalidade !== filtroAtivo) return false;
      }

      if (!termo) return true;
      const nome = aluno.nome?.toLowerCase() || "";
      const escola = aluno.escola?.toLowerCase() || "";
      const resp = aluno.responsavel?.usuario?.nome?.toLowerCase() || "";
      return (
        nome.includes(termo) || escola.includes(termo) || resp.includes(termo)
      );
    });
  }, [alunos, filtroAtivo, searchQuery]);

  const handleOpenCreate = () => {
    router.push("/(tabs)/alunos/form");
  };

  const handleOpenDetalhe = (aluno) => {
    router.push({
      pathname: "/(tabs)/alunos/detalhe",
      params: { id: aluno.id },
    });
  };

  const handleWhatsAppResponsavel = async (aluno) => {
    const telefone =
      aluno?.responsavel?.usuario?.telefone || aluno?.telefoneContatoEntrega;
    const msg = mensagemContatoResponsavel({
      responsavelNome:
        aluno?.responsavel?.usuario?.nome || aluno?.nomeContatoEntrega,
      alunoNome: aluno?.nome,
      motoristaNome: user?.nome,
    });
    await abrirWhatsApp(telefone, msg, (erroMsg) =>
      showSnackbar(erroMsg, "error"),
    );
  };

  return (
    <View style={styles.container}>
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
          {FILTROS_ALUNOS.map((f) => {
            const selected = filtroAtivo === f.value;
            return (
              <Chip
                key={f.value}
                selected={selected}
                compact
                onPress={() => setFiltroAtivo(f.value)}
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
      </Surface>

      {alunosQuery.isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Carregando alunos...
          </Text>
        </View>
      ) : alunosQuery.isError ? (
        <ErrorState
          message={
            alunosQuery.error?.friendlyMessage ||
            "Não foi possível carregar a lista de alunos."
          }
          onRetry={alunosQuery.refetch}
        />
      ) : (
        <FlatList
          data={alunosFiltrados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={alunosQuery.isRefetching}
              onRefresh={alunosQuery.refetch}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <AlunoCard
              aluno={item}
              onPress={handleOpenDetalhe}
              onVincularRota={(aluno) => setAlunoParaVincular(aluno)}
              onWhatsApp={handleWhatsAppResponsavel}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="account-school-outline"
              title="Nenhum aluno encontrado"
              description="Cadastre seus alunos informando escola, responsável, modalidade e endereços de embarque e desembarque."
              actionLabel="Novo Aluno"
              onAction={handleOpenCreate}
            />
          }
        />
      )}

      <FAB
        icon="account-plus"
        label="Novo Aluno"
        style={styles.fab}
        color={colors.text}
        onPress={handleOpenCreate}
      />

      <VincularRotaDialog
        visible={Boolean(alunoParaVincular)}
        aluno={alunoParaVincular}
        rotas={rotas}
        capacidadePadrao={user?.motorista?.capacidadeVan || 15}
        onDismiss={() => setAlunoParaVincular(null)}
        onLotacaoConflito={(info) => setLotacaoConflito(info)}
      />

      <LotacaoConflitoDialog
        conflito={lotacaoConflito}
        onDismiss={() => setLotacaoConflito(null)}
        onGerenciarLotacao={() => router.push("/(tabs)/alunos/lotacao")}
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
