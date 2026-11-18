import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Card,
  Text,
  Chip,
  IconButton,
  Button,
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../theme";

const MODALIDADE_CONFIG = {
  IDA_E_VOLTA: {
    label: "Ida e Volta",
    icon: "swap-horizontal-bold",
    bg: "#DBEAFE",
    text: "#1E40AF",
  },
  APENAS_IDA: {
    label: "Apenas Ida (Manhã)",
    icon: "arrow-right-bold",
    bg: "#FEF3C7",
    text: "#92400E",
  },
  APENAS_VOLTA: {
    label: "Apenas Volta (Tarde)",
    icon: "arrow-left-bold",
    bg: "#EDE9FE",
    text: "#5B21B6",
  },
};

/**
 * Card de Aluno com foco em Guarda Compartilhada e Vínculo de Rota (Joao)
 */
export default function AlunoCard({
  aluno,
  isMotorista = false,
  onEdit,
  onDelete,
  onVincularRota,
  onDesvincularRota,
  rotaEmFocoId = null,
}) {
  const mod =
    MODALIDADE_CONFIG[aluno.modalidade] || MODALIDADE_CONFIG.IDA_E_VOLTA;

  const temGuardaCompartilhada =
    Boolean(aluno.enderecoEmbarque) &&
    Boolean(aluno.enderecoDesembarque) &&
    aluno.enderecoEmbarque.trim().toLowerCase() !==
      aluno.enderecoDesembarque.trim().toLowerCase();

  const responsavelNome = aluno.responsavel?.usuario?.nome;
  const responsavelTel = aluno.responsavel?.usuario?.telefone;

  const vinculadoNaRotaEmFoco =
    rotaEmFocoId &&
    (aluno.rotaIdaId === rotaEmFocoId || aluno.rotaVoltaId === rotaEmFocoId);

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        {/* Cabeçalho: Modalidade + Ações */}
        <View style={styles.headerRow}>
          <View style={styles.badgesLeft}>
            <Chip
              icon={mod.icon}
              compact
              style={[styles.modChip, { backgroundColor: mod.bg }]}
              textStyle={[styles.modChipText, { color: mod.text }]}
            >
              {mod.label}
            </Chip>
            {temGuardaCompartilhada ? (
              <Chip
                icon="home-switch-outline"
                compact
                style={styles.guardaChip}
                textStyle={styles.guardaChipText}
              >
                Guarda Compartilhada
              </Chip>
            ) : null}
          </View>

          <View style={styles.actionsRight}>
            <IconButton
              icon="pencil-outline"
              size={20}
              iconColor={colors.secondary}
              style={styles.actionIcon}
              onPress={() => onEdit && onEdit(aluno)}
              accessibilityLabel="Editar aluno"
            />
            <IconButton
              icon="trash-can-outline"
              size={20}
              iconColor={colors.error}
              style={styles.actionIcon}
              onPress={() => onDelete && onDelete(aluno)}
              accessibilityLabel="Excluir aluno"
            />
          </View>
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
            <Text variant="titleMedium" style={styles.alunoNome} numberOfLines={2}>
              {aluno.nome}
            </Text>
            <View style={styles.escolaRow}>
              <MaterialCommunityIcons
                name="school-outline"
                size={15}
                color={colors.textSecondary}
              />
              <Text variant="bodySmall" style={styles.escolaText} numberOfLines={1}>
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

        {/* Endereços de Embarque e Desembarque (Guarda Compartilhada) */}
        {(aluno.enderecoEmbarque || aluno.enderecoDesembarque) && (
          <View style={styles.addressBox}>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons
                name="home-export-outline"
                size={16}
                color={colors.success}
              />
              <Text variant="bodySmall" style={styles.addressText}>
                <Text style={styles.addressLabel}>Embarque: </Text>
                {aluno.enderecoEmbarque || "Não informado"}
              </Text>
            </View>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons
                name="home-import-outline"
                size={16}
                color={colors.info}
              />
              <Text variant="bodySmall" style={styles.addressText}>
                <Text style={styles.addressLabel}>Desembarque: </Text>
                {aluno.enderecoDesembarque || "Não informado"}
              </Text>
            </View>
          </View>
        )}

        {/* Responsável e Contato de Entrega */}
        {(responsavelNome || aluno.nomeContatoEntrega) && (
          <View style={styles.metaList}>
            {responsavelNome ? (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="account-tie-outline"
                  size={15}
                  color={colors.textSecondary}
                />
                <Text variant="labelSmall" style={styles.metaText}>
                  Responsável: {responsavelNome}
                  {responsavelTel ? ` (${responsavelTel})` : ""}
                </Text>
              </View>
            ) : null}
            {aluno.nomeContatoEntrega ? (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="phone-check-outline"
                  size={15}
                  color={colors.textSecondary}
                />
                <Text variant="labelSmall" style={styles.metaText}>
                  Entrega: {aluno.nomeContatoEntrega}
                  {aluno.telefoneContatoEntrega
                    ? ` (${aluno.telefoneContatoEntrega})`
                    : ""}
                </Text>
              </View>
            ) : null}
          </View>
        )}

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
              Ida: {aluno.rotaIda?.nome || "Não vinculada"}
              {aluno.ordemNaRotaIda ? ` (#${aluno.ordemNaRotaIda})` : ""}
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
              Volta: {aluno.rotaVolta?.nome || "Não vinculada"}
              {aluno.ordemNaRotaVolta ? ` (#${aluno.ordemNaRotaVolta})` : ""}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Rodapé de Ações */}
        <View style={styles.footerRow}>
          {isMotorista && vinculadoNaRotaEmFoco && onDesvincularRota ? (
            <Button
              mode="outlined"
              icon="link-off"
              compact
              textColor={colors.error}
              style={styles.desvincularBtn}
              onPress={() => onDesvincularRota(aluno)}
            >
              Desvincular
            </Button>
          ) : null}

          {isMotorista && onVincularRota ? (
            <Button
              mode="contained"
              icon="bus-stop"
              compact
              buttonColor={colors.secondary}
              textColor="#FFFFFF"
              style={styles.footerBtn}
              onPress={() => onVincularRota(aluno)}
            >
              Vincular Rota
            </Button>
          ) : null}

          <Button
            mode="contained-tonal"
            icon="pencil"
            compact
            buttonColor={colors.primaryLight}
            textColor="#78350F"
            style={styles.footerBtn}
            onPress={() => onEdit && onEdit(aluno)}
          >
            Editar
          </Button>
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
    alignItems: "flex-start",
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
  guardaChip: {
    borderRadius: 8,
    backgroundColor: "#DCFCE7",
  },
  guardaChipText: {
    fontWeight: "700",
    fontSize: 11,
    color: "#166534",
  },
  actionsRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: -8,
    marginTop: -4,
  },
  actionIcon: {
    margin: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
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
  addressBox: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  addressText: {
    flex: 1,
    color: colors.text,
    lineHeight: 18,
  },
  addressLabel: {
    fontWeight: "700",
    color: colors.secondary,
  },
  metaList: {
    gap: 4,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: colors.textSecondary,
    flex: 1,
  },
  rotasRow: {
    gap: 6,
    marginBottom: 4,
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
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8,
  },
  footerBtn: {
    borderRadius: 8,
  },
  desvincularBtn: {
    borderRadius: 8,
    borderColor: "#FCA5A5",
  },
});
