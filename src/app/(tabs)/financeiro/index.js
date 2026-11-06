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
 * PLACEHOLDER GUIADO: MÓDULO FINANCEIRO & PIX (PAULO — 4º a atuar)
 * ============================================================================
 * Arquivo de API já pronto para o Paulo: `src/api/mensalidadesApi.js`
 */
export default function FinanceiroPlaceholderScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Banner visible icon="cash-register" style={styles.banner}>
        [Módulo reservado para o 4º Integrante — PAULO]: As chamadas Axios já
        estão estruturadas em src/api/mensalidadesApi.js!
      </Banner>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons
              name="cash-multiple"
              size={26}
              color={colors.primaryDark}
            />
            <Text variant="titleMedium" style={styles.title}>
              Checklist de Implementação — Paulo
            </Text>
          </View>

          <List.Item
            title="1. Relacionamento 2 (Aluno ↔ Mensalidades)"
            description="Histórico e CRUD completo em GET/POST /alunos/:alunoId/mensalidades e PUT/DELETE /alunos/:alunoId/mensalidades/:id com badges de status (PAGO, PENDENTE, ATRASADO)."
            descriptionNumberOfLines={4}
            left={(props) => (
              <List.Icon {...props} icon="numeric-1-circle" color={colors.primaryDark} />
            )}
          />
          <Divider />
          <List.Item
            title="2. Extrato de Inadimplência do Responsável + Chave Pix"
            description="Painel consumindo GET /responsaveis/:responsavelId/mensalidades/pendentes exibindo o total em aberto, dias de atraso e botão para copiar a Chave Pix do motorista."
            descriptionNumberOfLines={4}
            left={(props) => (
              <List.Icon {...props} icon="numeric-2-circle" color={colors.primaryDark} />
            )}
          />
          <Divider />
          <List.Item
            title="3. Cobrança em 1 Clique (Motorista)"
            description="Botão para disparar lembrete automático de pagamento via POST /alunos/:alunoId/mensalidades/:id/cobrar."
            descriptionNumberOfLines={3}
            left={(props) => (
              <List.Icon {...props} icon="numeric-3-circle" color={colors.primaryDark} />
            )}
          />

          <View style={styles.chipsRow}>
            <Chip compact icon="code-tags">
              src/api/mensalidadesApi.js
            </Chip>
            <Chip compact icon="hook">
              Criar src/hooks/useMensalidades.js
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
