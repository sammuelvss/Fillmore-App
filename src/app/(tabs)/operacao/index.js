import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  Text,
  Card,
  Chip,
  Banner,
  List,
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../theme";

/**
 * ============================================================================
 * PLACEHOLDER GUIADO: OPERAÇÃO DIÁRIA (EDMUNDO — 5º a atuar)
 * ============================================================================
 * Arquivo de API já pronto para o Edmundo: `src/api/operacaoApi.js`
 */
export default function OperacaoPlaceholderScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Banner visible icon="clipboard-check-outline" style={styles.banner}>
        [Módulo reservado para o 5º Integrante — EDMUNDO]: As chamadas Axios já
        estão prontas em src/api/operacaoApi.js!
      </Banner>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons
              name="clipboard-list-outline"
              size={26}
              color={colors.primaryDark}
            />
            <Text variant="titleMedium" style={styles.title}>
              Checklist de Implementação — Edmundo
            </Text>
          </View>

          <List.Item
            title="1. Check-list Diário de Presença (Embarque)"
            description="Consumir GET/POST/PUT/DELETE /alunos/:alunoId/presencas para marcar presença, turno (MANHA/TARDE) e horário de embarque."
            descriptionNumberOfLines={4}
            left={(props) => (
              <List.Icon {...props} icon="numeric-1-circle" color={colors.primaryDark} />
            )}
          />
          <Divider />
          <List.Item
            title="2. Cancelamento de Viagem Diária"
            description="Consumir GET/POST /alunos/:alunoId/viagens permitindo ao responsável cancelar pontualmente MANHA, TARDE ou AMBOS com motivo."
            descriptionNumberOfLines={4}
            left={(props) => (
              <List.Icon {...props} icon="numeric-2-circle" color={colors.primaryDark} />
            )}
          />
          <Divider />
          <List.Item
            title="3. Central de Avisos e Notificações"
            description="Consumir GET/POST /alunos/:alunoId/notificacoes (ou /rotas/:rotaId/avisos) e marcar aviso como lido via PATCH /notificacoes/:id/lida."
            descriptionNumberOfLines={4}
            left={(props) => (
              <List.Icon {...props} icon="numeric-3-circle" color={colors.primaryDark} />
            )}
          />

          <View style={styles.chipsRow}>
            <Chip compact icon="code-tags">
              src/api/operacaoApi.js
            </Chip>
            <Chip compact icon="hook">
              Criar src/hooks/useOperacao.js
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
