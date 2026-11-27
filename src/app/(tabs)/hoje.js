import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Surface, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/useAuthStore";
import { useRotasQuery } from "../../hooks/useRotas";
import { useAlunosQuery } from "../../hooks/useAlunos";
import { formatarDataBR, hojeLocal } from "../../utils/format";
import OnboardingCard from "../../components/hoje/OnboardingCard";

// Aba Hoje (com Card de Onboarding em 3 passos da Fase 2; recebe Checklist na Fase 3)
export default function HojeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const dataHoje = formatarDataBR(hojeLocal());

  const { data: rotas = [] } = useRotasQuery();
  const { data: alunos = [] } = useAlunosQuery();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.heroCard} elevation={2}>
        <View style={styles.heroRow}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons
              name="bus-school"
              size={32}
              color={colors.text}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="labelMedium" style={styles.dateText}>
              Hoje • {dataHoje}
            </Text>
            <Text variant="titleLarge" style={styles.title}>
              Olá, {user?.nome || "Motorista"}
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Van {user?.motorista?.placaVeiculo || "cadastrada"} • Capacidade{" "}
              {user?.motorista?.capacidadeVan || 15} lugares
            </Text>
          </View>
        </View>
      </Surface>

      {/* Card de Onboarding em 3 passos (some quando rotas, alunos e vínculos existem) */}
      <OnboardingCard rotas={rotas} alunos={alunos} />

      <Surface style={styles.card} elevation={1}>
        <Text variant="titleMedium" style={styles.cardTitle}>
          Operação de Hoje
        </Text>
        <Text variant="bodyMedium" style={styles.cardBody}>
          Acompanhe sua rota do turno, marque o embarque dos alunos e envie
          avisos rápidos por WhatsApp.
        </Text>
        <Button
          mode="contained"
          icon="map-marker-path"
          buttonColor={colors.primary}
          textColor={colors.text}
          contentStyle={styles.mainBtnContent}
          style={styles.mainBtn}
          onPress={() => router.push("/(tabs)/rotas")}
        >
          Ver minhas rotas
        </Button>
      </Surface>
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
    gap: 16,
  },
  heroCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 16,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    color: colors.primaryAccent,
    fontWeight: "700",
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  subtitle: {
    color: "#CBD5E1",
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontWeight: "800",
    color: colors.text,
  },
  cardBody: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  mainBtn: {
    borderRadius: 12,
    marginTop: 4,
  },
  mainBtnContent: {
    height: 52,
  },
});
