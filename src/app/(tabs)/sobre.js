import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  Text,
  Surface,
  Card,
  Chip,
  Divider,
  List,
  Avatar,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { API_BASE_URL } from "../../api/client";

/**
 * ============================================================================
 * TELA SOBRE — INFORMAÇÕES DO PROJETO E EQUIPE (Implementado por: Sammuel)
 * ============================================================================
 * Apresenta:
 * 1. O Problema Real em Recife (transporte escolar informal em vans/kombis).
 * 2. Os 4 Pilares Funcionais do MVP Fillmore.
 * 3. Stack Tecnológica Completa (Mobile React Native + Expo & Back-end Express 5 + NeonDB).
 * 4. Lista Oficial dos 5 Integrantes da Equipe com Nome, RA e Responsabilidade no Projeto.
 */
export default function SobreScreen() {
  const equipe = [
    {
      ordem: "1º (Kick-off Mobile)",
      nome: "Sammuel",
      ra: "RA: [Preencher RA de Sammuel]",
      papel: "Arquitetura Base Mobile, Telas Home/Sobre & CRUD Completo de Rotas Escolares (Rota)",
      endpoints: "GET/POST /rotas, GET/PUT/DELETE /rotas/:id",
      icon: "map-marker-path",
    },
    {
      ordem: "2º",
      nome: "Samuel",
      ra: "RA: [Preencher RA de Samuel]",
      papel: "Setup Back-end, Autenticação JWT, Sign Up Multi-perfil (Motorista/Responsável) & Perfil",
      endpoints: "POST/DELETE /session, POST /users, GET/PUT/DELETE /users/:id",
      icon: "shield-account",
    },
    {
      ordem: "3º",
      nome: "Joao",
      ra: "RA: [Preencher RA de Joao]",
      papel: "CRUD de Alunos (Guarda Compartilhada) & Relacionamento 1: Rota ↔ Alunos com Lotação",
      endpoints: "CRUD /alunos, GET/POST/DELETE /rotas/:rotaId/alunos",
      icon: "account-group",
    },
    {
      ordem: "4º",
      nome: "Paulo",
      ra: "RA: [Preencher RA de Paulo]",
      papel: "Controle Financeiro de Mensalidades, Relacionamento 2 & Extrato de Pendências + Pix",
      endpoints: "CRUD /alunos/:id/mensalidades, GET /responsaveis/:id/mensalidades/pendentes",
      icon: "cash-multiple",
    },
    {
      ordem: "5º",
      nome: "Edmundo",
      ra: "RA: [Preencher RA de Edmundo]",
      papel: "Operação Diária: Check-list de Presença, Cancelamento de Viagens & Central de Avisos",
      endpoints: "/alunos/:id/presencas, /alunos/:id/viagens, /alunos/:id/notificacoes",
      icon: "clipboard-check",
    },
  ];

  const stackItems = [
    { name: "Expo SDK 58 + Expo Router", desc: "Navegação File-based em src/app/" },
    { name: "Zustand + AsyncStorage", desc: "Estado global e sessão JWT persistida" },
    { name: "Axios + Interceptors", desc: "Injeção de Bearer Token e tratamento 401/429" },
    { name: "TanStack Query v5", desc: "Cache assíncrono, useQuery e useMutation" },
    { name: "React Native Paper (MD3)", desc: "UI Kit Material Design 3 customizado" },
    { name: "Express 5 + PostgreSQL (NeonDB)", desc: "API REST corporativa hospedada na Vercel" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Banner Institucional */}
      <Surface style={styles.headerBanner} elevation={2}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons
            name="bus-school"
            size={40}
            color={colors.secondary}
          />
        </View>
        <Text variant="headlineSmall" style={styles.title}>
          Fillmore Mobile
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Gestão Inteligente de Transporte Escolar Informal em Recife/PE
        </Text>
        <View style={styles.tagsRow}>
          <Chip compact style={styles.tagChip} textStyle={styles.tagChipText}>
            UNICAP 2026.2
          </Chip>
          <Chip compact style={styles.tagChip} textStyle={styles.tagChipText}>
            Etapa 2 • Front-end Mobile
          </Chip>
        </View>
      </Surface>

      {/* O Problema e Contexto em Recife */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons
              name="city-variant-outline"
              size={24}
              color={colors.primaryDark}
            />
            <Text variant="titleMedium" style={styles.cardTitle}>
              O Problema Resolvido em Recife
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.paragraph}>
            Em bairros como Boa Viagem, Derby, Espinheiro e Casa Forte, centenas
            de motoristas autônomos de vans e kombis escolares realizam o
            transporte diário de alunos controlando rotas, endereços de guarda
            compartilhada, chamadas de embarque e cobranças de mensalidades
            manualmente em cadernos de papel e grupos dispersos de WhatsApp.
          </Text>
          <Text variant="bodyMedium" style={styles.paragraph}>
            O <Text style={styles.bold}>Fillmore</Text> centraliza a operação em
            4 pilares: Gestão de Rotas com controle de capacidade máxima da van,
            Gestão de Alunos com ida/volta independentes, Controle Financeiro
            com Chave Pix transparente para os responsáveis e Check-list Diário
            de Presença e Avisos.
          </Text>
        </Card.Content>
      </Card>

      {/* Equipe de Desenvolvimento (5 Integrantes) */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons
              name="account-supervisor-circle"
              size={24}
              color={colors.primaryDark}
            />
            <Text variant="titleMedium" style={styles.cardTitle}>
              Equipe & Divisão de Módulos (5 Integrantes)
            </Text>
          </View>

          {equipe.map((membro, index) => (
            <View key={membro.nome}>
              <View style={styles.memberItem}>
                <Avatar.Icon
                  size={44}
                  icon={membro.icon}
                  style={styles.memberAvatar}
                  color={colors.secondary}
                />
                <View style={styles.memberInfo}>
                  <View style={styles.memberTopRow}>
                    <Text variant="titleSmall" style={styles.memberName}>
                      {membro.nome}
                    </Text>
                    <Chip
                      compact
                      style={styles.orderChip}
                      textStyle={styles.orderChipText}
                    >
                      {membro.ordem}
                    </Chip>
                  </View>
                  <Text variant="labelSmall" style={styles.memberRa}>
                    {membro.ra}
                  </Text>
                  <Text variant="bodySmall" style={styles.memberRole}>
                    {membro.papel}
                  </Text>
                  <Text variant="labelSmall" style={styles.memberEndpoints}>
                    API: {membro.endpoints}
                  </Text>
                </View>
              </View>
              {index < equipe.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Arquitetura e Stack Tecnológica */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons
              name="layers-triple-outline"
              size={24}
              color={colors.primaryDark}
            />
            <Text variant="titleMedium" style={styles.cardTitle}>
              Stack Tecnológica Obrigatória
            </Text>
          </View>

          {stackItems.map((item) => (
            <List.Item
              key={item.name}
              title={item.name}
              description={item.desc}
              titleStyle={styles.stackTitle}
              descriptionStyle={styles.stackDesc}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="check-decagram"
                  color={colors.primaryDark}
                />
              )}
              style={styles.stackItem}
            />
          ))}

          <Divider style={styles.divider} />
          <Text variant="labelSmall" style={styles.apiFooter}>
            Endpoint Ativo (.env): {API_BASE_URL}
          </Text>
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
    paddingBottom: 36,
  },
  headerBanner: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    marginBottom: 16,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  subtitle: {
    color: "#CBD5E1",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tagChip: {
    backgroundColor: "#334155",
  },
  tagChipText: {
    color: colors.primaryAccent,
    fontWeight: "700",
    fontSize: 11,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: "800",
    color: colors.secondary,
  },
  paragraph: {
    color: colors.text,
    lineHeight: 21,
    marginBottom: 10,
  },
  bold: {
    fontWeight: "700",
    color: colors.secondary,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
  },
  memberAvatar: {
    backgroundColor: colors.primaryLight,
    marginTop: 2,
  },
  memberInfo: {
    flex: 1,
  },
  memberTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  memberName: {
    fontWeight: "800",
    color: colors.secondary,
  },
  orderChip: {
    backgroundColor: colors.surfaceVariant,
    height: 24,
  },
  orderChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.secondary,
  },
  memberRa: {
    color: colors.primaryDark,
    fontWeight: "700",
    marginBottom: 4,
  },
  memberRole: {
    color: colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  memberEndpoints: {
    color: colors.textSecondary,
    fontFamily: "monospace",
  },
  divider: {
    marginVertical: 4,
  },
  stackItem: {
    paddingVertical: 2,
  },
  stackTitle: {
    fontWeight: "700",
    color: colors.secondary,
    fontSize: 14,
  },
  stackDesc: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  apiFooter: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
  },
});
