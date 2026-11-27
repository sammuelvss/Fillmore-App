import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Card,
  Text,
  Chip,
  Button,
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { MODALIDADES } from "../../constants";

/**
 * Card de Aluno — Fase 4
 * Destaca claramente a rota atual (ou badge "Sem rota"), escola, responsável
 * e no máximo 2 ações diretas no rodapé (toque no card abre Detalhe do Aluno).
 */
export default function AlunoCard({
  aluno,
  onPress,
  onVincularRota,
  onWhatsApp,
}) {
  const mod = MODALIDADES[aluno.modalidade] || MODALIDADES.IDA_E_VOLTA;
  const semRota = !aluno.rotaIda && !aluno.rotaVolta;
  const responsavelNome = aluno.responsavel?.usuario?.nome;

  return (
    <Card
      style={styles.card}
      mode="elevated"
      onPress={() => onPress && onPress(aluno)}
    >
      <Card.Content>
        {/* Cabeçalho: Modalidade + Badge Sem Rota quando aplicável */}
        <View style={styles.headerRow}>
          <View style={styles.badgesLeft}>
            <Chip
              icon={mod.icon}
              compact
              style={[styles.modChip, { backgroundColor: mod.bg }]}
              textStyle={[styles.modChipText, { color: mod.text }]}
            >
              {mod.shortLabel}
            </Chip>

            {semRota ? (
              <Chip
                icon="alert-circle-outline"
                compact
                style={styles.semRotaChip}
                textStyle={styles.semRotaChipText}
              >
                Sem rota
              </Chip>
            ) : null}
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.textSecondary}
          />
        </View>

        {/* Nome do Aluno e Escola */}
        <View style={styles.titleRow}>
          <MaterialCommunityIcons
            name="account-school"
            size={24}
            color={colors.primaryDark}
            style={styles.studentIcon}
          />
          <View style={{ flex: 1 }}>
            <Text
              variant="titleMedium"
              style={styles.alunoNome}
              numberOfLines={2}
            >
              {aluno.nome}
            </Text>
            <View style={styles.escolaRow}>
              <MaterialCommunityIcons
                name="school-outline"
                size={15}
                color={colors.textSecondary}
              />
              <Text
                variant="bodySmall"
                style={styles.escolaText}
                numberOfLines={1}
              >
                {aluno.escola}
              </Text>
              {aluno.diaVencimentoMensalidade ? (
                <Text variant="labelSmall" style={styles.vencimentoTag}>
                  • Venc. dia {aluno.diaVencimentoMensalidade}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Responsável */}
        {responsavelNome ? (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="account-tie-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text
              variant="bodySmall"
              style={styles.metaText}
              numberOfLines={1}
            >
              Responsável: {responsavelNome}
            </Text>
          </View>
        ) : null}

        {/* Status das Rotas Vinculadas */}
        <View style={styles.rotasRow}>
          <View
            style={[
              styles.rotaPill,
              aluno.rotaIda ? styles.rotaPillActive : styles.rotaPillEmpty,
            ]}
          >
            <MaterialCommunityIcons
              name="weather-sunny"
              size={14}
              color={aluno.rotaIda ? "#92400E" : colors.textSecondary}
            />
            <Text
              variant="labelSmall"
              style={[
                styles.rotaPillText,
                aluno.rotaIda && { color: "#92400E" },
              ]}
              numberOfLines={1}
            >
              Ida: {aluno.rotaIda?.nome || "Sem rota"}
            </Text>
          </View>

          <View
            style={[
              styles.rotaPill,
              aluno.rotaVolta ? styles.rotaPillVolta : styles.rotaPillEmpty,
            ]}
          >
            <MaterialCommunityIcons
              name="weather-sunset"
              size={14}
              color={aluno.rotaVolta ? "#1E40AF" : colors.textSecondary}
            />
            <Text
              variant="labelSmall"
              style={[
                styles.rotaPillText,
                aluno.rotaVolta && { color: "#1E40AF" },
              ]}
              numberOfLines={1}
            >
              Volta: {aluno.rotaVolta?.nome || "Sem rota"}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Rodapé com até 2 ações rápidas (3ª ação é o toque no card para Detalhe) */}
        <View style={styles.footerRow}>
          {onWhatsApp ? (
            <Button
              mode="outlined"
              icon="whatsapp"
              textColor="#166534"
              style={styles.whatsappBtn}
              contentStyle={styles.footerBtnContent}
              onPress={() => onWhatsApp(aluno)}
            >
              WhatsApp
            </Button>
          ) : null}

          {onVincularRota ? (
            <Button
              mode={semRota ? "contained" : "contained-tonal"}
              icon="bus-stop"
              buttonColor={semRota ? colors.primary : colors.primaryLight}
              textColor={colors.text}
              style={styles.footerBtn}
              contentStyle={styles.footerBtnContent}
              labelStyle={styles.primaryBtnLabel}
              onPress={() => onVincularRota(aluno)}
            >
              {semRota ? "Vincular rota" : "Alterar rota"}
            </Button>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  badgesLeft: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  modChip: {
    borderRadius: 8,
  },
  modChipText: {
    fontWeight: "700",
    fontSize: 11,
  },
  semRotaChip: {
    borderRadius: 8,
    backgroundColor: "#FFEDD5",
  },
  semRotaChipText: {
    fontWeight: "800",
    fontSize: 11,
    color: "#9A3412",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  studentIcon: {
    marginRight: 10,
  },
  alunoNome: {
    fontWeight: "800",
    color: colors.secondary,
  },
  escolaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    flexWrap: "wrap",
  },
  escolaText: {
    color: colors.textSecondary,
    fontWeight: "600",
    flexShrink: 1,
  },
  vencimentoTag: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  metaText: {
    color: colors.textSecondary,
    flex: 1,
  },
  rotasRow: {
    gap: 6,
  },
  rotaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rotaPillActive: {
    backgroundColor: "#FEF3C7",
  },
  rotaPillVolta: {
    backgroundColor: "#DBEAFE",
  },
  rotaPillEmpty: {
    backgroundColor: colors.surfaceVariant,
  },
  rotaPillText: {
    color: colors.textSecondary,
    fontWeight: "700",
    flex: 1,
  },
  divider: {
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
  whatsappBtn: {
    flex: 1,
    borderRadius: 10,
    borderColor: "#86EFAC",
  },
  footerBtn: {
    flex: 1,
    borderRadius: 10,
  },
  footerBtnContent: {
    minHeight: 48,
  },
  primaryBtnLabel: {
    fontWeight: "800",
  },
});
