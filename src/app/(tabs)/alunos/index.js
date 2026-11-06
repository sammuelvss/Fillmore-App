import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  Text,
  Surface,
  Card,
  Chip,
  Banner,
  List,
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../theme";
import { useAppStore } from "../../../store/useAppStore";

/**
 * ============================================================================
 * PLACEHOLDER GUIADO: MÓDULO DE ALUNOS & RELACIONAMENTO 1 (JOAO — 3º a atuar)
 * ============================================================================
 * Arquivos já preparados na base para o Joao:
 * - Cliente HTTP: `src/api/alunosApi.js`
 * - Estado Global de Rota Selecionada: `useAppStore.rotaAtiva`
 */
export default function AlunosPlaceholderScreen() {
  const rotaAtiva = useAppStore((state) => state.rotaAtiva);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Banner visible icon="account-hard-hat" style={styles.banner}>
        [Módulo reservado para o 3º Integrante — JOAO]: As funções Axios já
        estão prontas em src/api/alunosApi.js para você conectar com TanStack
        Query!
      </Banner>

      {rotaAtiva ? (
        <Surface style={styles.rotaActiveBox} elevation={1}>
          <Text variant="labelSmall" style={styles.rotaActiveTag}>
            ROTA SELECIONADA NO ZUSTAND (RELACIONAMENTO 1)
          </Text>
          <Text variant="titleMedium" style={styles.rotaActiveTitle}>
            {rotaAtiva.nome} ({rotaAtiva.turno})
          </Text>
          <Text variant="bodySmall" style={styles.rotaActiveSub}>
            ID: {rotaAtiva.id} • Consumir GET /rotas/{rotaAtiva.id}/alunos
          </Text>
        </Surface>
      ) : null}

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons
              name="account-group"
              size={26}
              color={colors.primaryDark}
            />
            <Text variant="titleMedium" style={styles.title}>
              Checklist de Implementação — Joao
            </Text>
          </View>

          <List.Item
            title="1. CRUD Completo de Alunos (/alunos)"
            description="Listar, cadastrar, editar e remover alunos com escola, modalidade (IDA_E_VOLTA, APENAS_IDA, APENAS_VOLTA) e endereços independentes de embarque/desembarque (guarda compartilhada)."
            descriptionNumberOfLines={4}
            left={(props) => (
              <List.Icon {...props} icon="numeric-1-circle" color={colors.primaryDark} />
            )}
          />
          <Divider />
          <List.Item
            title="2. Relacionamento 1 (URL Composta)"
            description="Tela/Modal para GET /rotas/:rotaId/alunos, POST /rotas/:rotaId/alunos (exibindo alerta amigável no erro 409 quando atingir capacidade máxima da van) e DELETE /rotas/:rotaId/alunos/:alunoId."
            descriptionNumberOfLines={4}
            left={(props) => (
              <List.Icon {...props} icon="numeric-2-circle" color={colors.primaryDark} />
            )}
          />
          <Divider />
          <List.Item
            title="3. Visão do Responsável"
            description="Quando user.tipo === 'RESPONSAVEL', listar os filhos via GET /responsaveis/:responsavelId/alunos."
            descriptionNumberOfLines={3}
            left={(props) => (
              <List.Icon {...props} icon="numeric-3-circle" color={colors.primaryDark} />
            )}
          />

          <View style={styles.chipsRow}>
            <Chip compact icon="code-tags">
              src/api/alunosApi.js
            </Chip>
            <Chip compact icon="hook">
              Criar src/hooks/useAlunos.js
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  banner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    marginBottom: 14,
  },
  rotaActiveBox: {
    backgroundColor: "#DBEAFE",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  rotaActiveTag: { color: "#1E40AF", fontWeight: "800" },
  rotaActiveTitle: { color: "#1E3A8A", fontWeight: "800", marginTop: 2 },
  rotaActiveSub: { color: "#1E40AF", marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: { fontWeight: "800", color: colors.secondary },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
});
