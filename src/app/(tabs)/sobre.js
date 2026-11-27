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

// Preencha ou atualize facilmente os RAs dos integrantes da equipe aqui:
export const RAS_EQUIPE = {
  sammuel: "00000859900",
  samuel: "00000859887",
  joao: "00000859881",
  paulo: "00000859899",
};

export default function SobreScreen() {
  const equipe = [
    {
      ordem: "1º (Kick-off Mobile)",
      nome: "Sammuel",
      ra: `RA: ${RAS_EQUIPE.sammuel}`,
      papel:
        "Arquitetura Base Mobile, Telas Hoje/Sobre & Gestão Completa de Rotas Escolares",
      endpoints: "GET/POST /rotas, GET/PUT/DELETE /rotas/:id",
      icon: "map-marker-path",
    },
    {
      ordem: "2º",
      nome: "Samuel",
      ra: `RA: ${RAS_EQUIPE.samuel}`,
      papel:
        "Setup Back-end, Autenticação JWT, Cadastro de Motorista, Perfil & Operação Diária",
      endpoints:
        "POST/DELETE /session, POST /users, /alunos/:id/presencas e /viagens",
      icon: "shield-account",
    },
    {
      ordem: "3º",
      nome: "Joao",
      ra: `RA: ${RAS_EQUIPE.joao}`,
      papel:
        "Gestão de Alunos (Guarda Compartilhada) & Relacionamento 1: Rota ↔ Alunos com Lotação",
      endpoints: "CRUD /alunos, GET/POST/DELETE /rotas/:rotaId/alunos",
      icon: "account-group",
    },
    {
      ordem: "4º",
      nome: "Paulo",
      ra: `RA: ${RAS_EQUIPE.paulo}`,
      papel:
        "Controle Financeiro de Mensalidades, Relacionamento 2 & Cobrança com Pix",
      endpoints:
        "CRUD /alunos/:id/mensalidades, PATCH /pagamento, POST /cobrar",
      icon: "cash-multiple",
    },
  ];

  const stackItems = [
    {
      name: "Expo SDK 58 + Expo Router",
      desc: "Navegação File-based em src/app/",
    },
    {
      name: "Zustand + AsyncStorage",
      desc: "Estado global e sessão JWT persistida",
    },
    {
      name: "Axios + Interceptors",
      desc: "Injeção de Bearer Token e tratamento 401/429",
    },
    {
      name: "TanStack Query v5",
      desc: "Cache assíncrono, useQuery e useMutation",
    },
    {
      name: "React Native Paper (MD3)",
      desc: "UI Kit Material Design 3 customizado",
    },
    {
      name: "Express 5 + PostgreSQL (NeonDB)",
      desc: "API REST corporativa hospedada na Vercel",
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
            App do Motorista
          </Chip>
        </View>
      </Surface>

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
            de motoristas autônomos de vans escolares realizam o transporte
            diário de alunos controlando rotas, endereços de guarda
            compartilhada, chamadas de embarque e cobranças manualmente em
            cadernos e grupos dispersos de WhatsApp.
          </Text>
          <Text variant="bodyMedium" style={styles.paragraph}>
            O <Text style={styles.bold}>Fillmore</Text> centraliza o trabalho do
            motorista em 4 áreas: Operação de Hoje (embarque e avisos rápidos
            no WhatsApp), Rotas com controle de lotação da van, Alunos com
            guarda compartilhada e Financeiro com cobrança Pix em 1 toque.
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons
              name="account-supervisor-circle"
              size={24}
              color={colors.primaryDark}
            />
            <Text variant="titleMedium" style={styles.cardTitle}>
              Equipe & Divisão de Módulos (4 Integrantes)
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

      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons
              name="layers-triple-outline"
              size={24}
              color={colors.primaryDark}
            />
            <Text variant="titleMedium" style={styles.cardTitle}>
              Stack Tecnológica
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
  headerBanner: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 24,
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
    fontSize: 12,
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
    fontSize: 12,
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
});
