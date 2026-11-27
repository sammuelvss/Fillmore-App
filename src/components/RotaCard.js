import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Card,
  Text,
  Chip,
  Button,
  Divider,
  ProgressBar,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme";
import { TURNOS } from "../constants";

/**
 * Card de Rota Escolar — Fase 4
 * Exibe turno, nome, lotação (ocupadas/capacidade) e no máximo 2 ações diretas
 * ("Ver trajeto" e "Detalhes"), mantendo áreas de toque >= 48dp.
 */
export default function RotaCard({
  rota,
  capacidadePadrao = 15,
  onPress,
  onViewTrajeto,
  onManageAlunos,
}) {
  const isManha = rota.turno === "MANHA";
  const turnoInfo = TURNOS[rota.turno] || TURNOS.MANHA;

  const listaAlunosTurno = isManha
    ? rota.alunosIda || []
    : rota.alunosVolta || [];
  const vagasOcupadas = Array.isArray(listaAlunosTurno)
    ? listaAlunosTurno.length
    : 0;
  const capacidadeMaxima =
    rota.motorista?.capacidadeVan || capacidadePadrao || 15;
  const percentualLotacao = Math.min(
    1,
    capacidadeMaxima > 0 ? vagasOcupadas / capacidadeMaxima : 0,
  );
  const isLotada = vagasOcupadas >= capacidadeMaxima;

  return (
    <Card
      style={styles.card}
      mode="elevated"
      onPress={() => onPress && onPress(rota)}
    >
      <Card.Content>
        {/* Cabeçalho: Badge de Turno + Lotação */}
        <View style={styles.headerRow}>
          <Chip
            icon={turnoInfo.icon}
            style={[
              styles.turnoChip,
              isManha ? styles.manhaChip : styles.tardeChip,
            ]}
            textStyle={[
              styles.turnoChipText,
              isManha ? styles.manhaChipText : styles.tardeChipText,
            ]}
            compact
          >
            {turnoInfo.shortLabel}
          </Chip>

          <View
            style={[
              styles.lotacaoPill,
              isLotada ? styles.lotacaoPillFull : styles.lotacaoPillOpen,
            ]}
          >
            <MaterialCommunityIcons
              name="seat-passenger"
              size={15}
              color={isLotada ? "#991B1B" : "#166534"}
            />
            <Text
              variant="labelSmall"
              style={[
                styles.lotacaoText,
                { color: isLotada ? "#991B1B" : "#166534" },
              ]}
            >
              {vagasOcupadas}/{capacidadeMaxima} vagas
            </Text>
          </View>
        </View>

        {/* Título da Rota */}
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="bus-school"
            size={24}
            color={colors.primaryDark}
            style={styles.busIcon}
          />
          <Text variant="titleMedium" style={styles.rotaNome} numberOfLines={2}>
            {rota.nome}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.textSecondary}
          />
        </View>

        {/* Indicadores de Distância e Tempo */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBadge}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={16}
              color={colors.secondary}
            />
            <Text variant="bodySmall" style={styles.metricText}>
              {rota.distanciaTotalKm != null
                ? `${Number(rota.distanciaTotalKm).toFixed(1)} km`
                : "Dist. automática"}
            </Text>
          </View>

          <View style={styles.metricBadge}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.secondary}
            />
            <Text variant="bodySmall" style={styles.metricText}>
              {rota.tempoEstimadoMin != null
                ? `~${rota.tempoEstimadoMin} min`
                : "Tempo automático"}
            </Text>
          </View>
        </View>

        {/* Barra de Ocupação da Van */}
        <View style={styles.capacityBox}>
          <View style={styles.capacityHeader}>
            <Text variant="labelSmall" style={styles.capacityLabel}>
              Ocupação ({isManha ? "Ida" : "Volta"})
            </Text>
            <Text
              variant="labelSmall"
              style={[
                styles.capacityStatus,
                { color: isLotada ? colors.error : colors.textSecondary },
              ]}
            >
              {isLotada
                ? "VAN LOTADA"
                : `${capacidadeMaxima - vagasOcupadas} livres`}
            </Text>
          </View>
          <ProgressBar
            progress={percentualLotacao}
            color={isLotada ? colors.error : colors.primary}
            style={styles.progressBar}
          />
        </View>

        <Divider style={styles.divider} />

        {/* Rodapé com até 2 ações rápidas (3ª ação é o toque no card para Detalhes) */}
        <View style={styles.footerRow}>
          {onManageAlunos ? (
            <Button
              mode="outlined"
              icon="account-group-outline"
              style={styles.footerBtn}
              contentStyle={styles.footerBtnContent}
              textColor={colors.secondary}
              onPress={() => onManageAlunos(rota)}
            >
              Alunos ({vagasOcupadas})
            </Button>
          ) : null}

          {onViewTrajeto ? (
            <Button
              mode="contained"
              icon="map-marker-path"
              style={styles.footerBtn}
              contentStyle={styles.footerBtnContent}
              buttonColor={colors.primary}
              textColor={colors.text}
              labelStyle={styles.primaryBtnLabel}
              onPress={() => onViewTrajeto(rota)}
            >
              Ver trajeto
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
    marginBottom: 10,
  },
  turnoChip: {
    borderRadius: 8,
  },
  manhaChip: {
    backgroundColor: "#FEF3C7",
  },
  tardeChip: {
    backgroundColor: "#DBEAFE",
  },
  turnoChipText: {
    fontWeight: "800",
    fontSize: 12,
  },
  manhaChipText: {
    color: "#92400E",
  },
  tardeChipText: {
    color: "#1E40AF",
  },
  lotacaoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  lotacaoPillOpen: {
    backgroundColor: "#DCFCE7",
  },
  lotacaoPillFull: {
    backgroundColor: "#FEE2E2",
  },
  lotacaoText: {
    fontWeight: "800",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  busIcon: {
    marginRight: 8,
  },
  rotaNome: {
    flex: 1,
    fontWeight: "800",
    color: colors.secondary,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  metricBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  metricText: {
    color: colors.secondary,
    fontWeight: "600",
  },
  capacityBox: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  capacityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  capacityLabel: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  capacityStatus: {
    fontWeight: "700",
  },
  progressBar: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  divider: {
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
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
