import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, ProgressBar, Surface, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme";

// Card de Onboarding em 3 passos calculados a partir dos dados reais do motorista
export default function OnboardingCard({ rotas = [], alunos = [] }) {
  const router = useRouter();

  const temRota = Array.isArray(rotas) && rotas.length > 0;
  const temAluno = Array.isArray(alunos) && alunos.length > 0;
  const temVinculo =
    (Array.isArray(alunos) &&
      alunos.some((a) => Boolean(a?.rotaIdaId || a?.rotaVoltaId || a?.rotaIda || a?.rotaVolta))) ||
    (Array.isArray(rotas) &&
      rotas.some(
        (r) =>
          (Array.isArray(r?.alunosIda) && r.alunosIda.length > 0) ||
          (Array.isArray(r?.alunosVolta) && r.alunosVolta.length > 0),
      ));

  const passos = [
    {
      id: 1,
      titulo: "1. Criar a primeira rota",
      descricao: "Defina o turno e o trajeto da sua van escolar.",
      concluido: temRota,
      acaoLabel: "Criar primeira rota",
      onPress: () => router.push("/(tabs)/rotas/form"),
    },
    {
      id: 2,
      titulo: "2. Cadastrar alunos",
      descricao: "Adicione os alunos, escola, endereços e responsável.",
      concluido: temAluno,
      acaoLabel: "Cadastrar primeiro aluno",
      onPress: () => router.push("/(tabs)/alunos/form"),
    },
    {
      id: 3,
      titulo: "3. Vincular alunos à rota",
      descricao: "Coloque os alunos cadastrados dentro da rota do turno.",
      concluido: temVinculo,
      acaoLabel: "Vincular alunos à rota",
      onPress: () => router.push("/(tabs)/alunos/lotacao"),
    },
  ];

  const concluidosCount = passos.filter((p) => p.concluido).length;

  // Some automaticamente quando os 3 passos estiverem concluídos
  if (concluidosCount === 3) {
    return null;
  }

  const proximoPasso = passos.find((p) => !p.concluido) || passos[0];
  const progresso = concluidosCount / 3;

  return (
    <Surface style={styles.card} elevation={2}>
      <View style={styles.headerRow}>
        <View style={styles.badgeIcon}>
          <MaterialCommunityIcons
            name="rocket-launch-outline"
            size={24}
            color={colors.text}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.title}>
            Primeiros passos na sua van
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            {concluidosCount} de 3 concluídos para começar a rodar
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={progresso}
        color={colors.primary}
        style={styles.progressBar}
      />

      <View style={styles.stepsList}>
        {passos.map((passo) => (
          <View key={passo.id} style={styles.stepRow}>
            <MaterialCommunityIcons
              name={
                passo.concluido
                  ? "check-circle"
                  : passo.id === proximoPasso.id
                    ? "arrow-right-circle"
                    : "checkbox-blank-circle-outline"
              }
              size={22}
              color={
                passo.concluido
                  ? colors.success
                  : passo.id === proximoPasso.id
                    ? colors.primaryDark
                    : colors.textSecondary
              }
            />
            <View style={{ flex: 1 }}>
              <Text
                variant="bodyMedium"
                style={[
                  styles.stepTitle,
                  passo.concluido && styles.stepTitleDone,
                ]}
              >
                {passo.titulo}
              </Text>
              {!passo.concluido ? (
                <Text variant="bodySmall" style={styles.stepDesc}>
                  {passo.descricao}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <Button
        mode="contained"
        icon="arrow-right"
        buttonColor={colors.primary}
        textColor={colors.text}
        contentStyle={styles.mainBtnContent}
        style={styles.mainBtn}
        onPress={proximoPasso.onPress}
      >
        {proximoPasso.acaoLabel}
      </Button>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primaryAccent,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceVariant,
  },
  stepsList: {
    gap: 10,
    marginVertical: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepTitle: {
    fontWeight: "700",
    color: colors.text,
  },
  stepTitleDone: {
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  stepDesc: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  mainBtn: {
    borderRadius: 12,
    marginTop: 4,
  },
  mainBtnContent: {
    height: 52,
  },
});
