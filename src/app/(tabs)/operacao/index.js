import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  Surface,
  Chip,
  SegmentedButtons,
  ActivityIndicator,
  Portal,
  Dialog,
  Button,
} from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { colors } from "../../../theme";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import EmptyState from "../../../components/EmptyState";
import PresencaTab from "../../../components/operacao/PresencaTab";
import ViagensTab from "../../../components/operacao/ViagensTab";
import AvisosTab from "../../../components/operacao/AvisosTab";
import {
  OPERACAO_KEYS,
  useOperacaoAlunosQuery,
} from "../../../hooks/useOperacao";

// Operação Diária: Presenças, Cancelamento de Viagens e Avisos
export default function OperacaoScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const alunoAtivo = useAppStore((s) => s.alunoAtivo);
  const setAlunoAtivo = useAppStore((s) => s.setAlunoAtivo);
  const turnoFiltro = useAppStore((s) => s.turnoFiltro);

  const isMotorista = user?.tipo === "MOTORISTA";
  const isResponsavel = user?.tipo === "RESPONSAVEL";

  const [aba, setAba] = useState("presencas"); // "presencas" | "viagens" | "avisos"
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const alunosQuery = useOperacaoAlunosQuery();
  const alunos = Array.isArray(alunosQuery.data) ? alunosQuery.data : [];

  // Garante que o aluno ativo no Zustand pertence à lista atual
  const alunoSelecionado =
    alunos.find((a) => a.id === alunoAtivo?.id) || alunos[0] || null;

  useEffect(() => {
    if (alunoSelecionado && alunoSelecionado.id !== alunoAtivo?.id) {
      setAlunoAtivo(alunoSelecionado);
    }
  }, [alunoSelecionado, alunoAtivo?.id, setAlunoAtivo]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      alunosQuery.refetch(),
      alunoSelecionado?.id &&
        queryClient.invalidateQueries({
          queryKey: OPERACAO_KEYS.presencas(alunoSelecionado.id),
        }),
      alunoSelecionado?.id &&
        queryClient.invalidateQueries({
          queryKey: OPERACAO_KEYS.viagens(alunoSelecionado.id),
        }),
      alunoSelecionado?.id &&
        queryClient.invalidateQueries({
          queryKey: OPERACAO_KEYS.notificacoes(alunoSelecionado.id),
        }),
      queryClient.invalidateQueries({ queryKey: ["notificacoes-responsavel"] }),
    ]);
    setRefreshing(false);
  };

  if (alunosQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Carregando operação diária...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {alunosQuery.isError ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Erro ao carregar alunos"
            description={
              alunosQuery.error?.friendlyMessage ||
              "Verifique sua conexão com o servidor."
            }
            actionLabel="Tentar novamente"
            onAction={() => alunosQuery.refetch()}
          />
        ) : alunos.length === 0 ? (
          <EmptyState
            icon="account-school-outline"
            title="Nenhum aluno disponível"
            description={
              isMotorista
                ? "Vincule alunos às suas rotas primeiro para registrar embarques, cancelamentos e avisos."
                : "Nenhum aluno vinculado ao seu perfil de responsável ainda."
            }
            actionLabel={isMotorista ? "Ver Rotas" : undefined}
            onAction={isMotorista ? () => router.push("/(tabs)/rotas") : undefined}
          />
        ) : (
          <>
            {/* Seletor de Aluno */}
            <Surface style={styles.selectorCard} elevation={1}>
              <Text variant="labelMedium" style={styles.selectorLabel}>
                Aluno em foco
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {alunos.map((aluno) => {
                  const selected = aluno.id === alunoSelecionado?.id;
                  return (
                    <Chip
                      key={aluno.id}
                      selected={selected}
                      icon="account-school"
                      onPress={() => setAlunoAtivo(aluno)}
                      style={[
                        styles.alunoChip,
                        selected && styles.alunoChipSelected,
                      ]}
                      textStyle={selected ? styles.alunoChipTextSelected : undefined}
                    >
                      {aluno.nome}
                    </Chip>
                  );
                })}
              </ScrollView>
              {alunoSelecionado?.escola ? (
                <Text variant="bodySmall" style={styles.escolaText}>
                  Escola: {alunoSelecionado.escola}
                </Text>
              ) : null}
            </Surface>

            {/* Navegação entre as 3 frentes operacionais */}
            <SegmentedButtons
              value={aba}
              onValueChange={setAba}
              style={styles.tabs}
              buttons={[
                {
                  value: "presencas",
                  label: "Presença",
                  icon: "checkbox-marked-circle-outline",
                },
                {
                  value: "viagens",
                  label: "Viagens",
                  icon: "calendar-remove-outline",
                },
                {
                  value: "avisos",
                  label: "Avisos",
                  icon: "bell-ring-outline",
                },
              ]}
            />

            {aba === "presencas" && (
              <PresencaTab
                alunoId={alunoSelecionado.id}
                isMotorista={isMotorista}
                turnoInicial={turnoFiltro}
                onConfirmDelete={setConfirmDialog}
              />
            )}

            {aba === "viagens" && (
              <ViagensTab
                alunoId={alunoSelecionado.id}
                onConfirmDelete={setConfirmDialog}
              />
            )}

            {aba === "avisos" && (
              <AvisosTab
                alunoId={alunoSelecionado.id}
                isResponsavel={isResponsavel}
                onConfirmDelete={setConfirmDialog}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Dialog compartilhado de confirmação */}
      <Portal>
        <Dialog
          visible={Boolean(confirmDialog)}
          onDismiss={() => setConfirmDialog(null)}
        >
          <Dialog.Title>{confirmDialog?.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{confirmDialog?.description}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialog(null)}>Cancelar</Button>
            <Button
              textColor={colors.error}
              onPress={() => {
                const action = confirmDialog?.onConfirm;
                setConfirmDialog(null);
                if (action) action();
              }}
            >
              {confirmDialog?.confirmLabel || "Excluir"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 36 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 10,
  },
  loadingText: { color: colors.textSecondary },
  selectorCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  selectorLabel: {
    color: colors.textSecondary,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  chipsRow: {
    gap: 8,
  },
  alunoChip: {
    backgroundColor: colors.surfaceVariant,
  },
  alunoChipSelected: {
    backgroundColor: colors.primaryLight,
  },
  alunoChipTextSelected: {
    color: colors.secondary,
    fontWeight: "700",
  },
  escolaText: {
    color: colors.textSecondary,
    marginTop: 8,
  },
  tabs: {
    marginBottom: 14,
  },
});
