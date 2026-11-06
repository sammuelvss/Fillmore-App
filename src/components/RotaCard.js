import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Card,
  Text,
  Chip,
  IconButton,
  Button,
  Divider,
  ProgressBar,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme";

/**
 * Card estilizado de Rota Escolar (Implementado por: Sammuel)
 * Exibe:
 * - Nome da rota e badge visual de Turno (MANHÃ / TARDE)
 * - Métricas de distância (km), tempo estimado (min) e coordenadas GPS (Recife)
 * - Barra de lotação da van calculada a partir de `alunosIda` ou `alunosVolta` vs `motorista.capacidadeVan`
 * - Botões de ação para Editar, Excluir e atalho para Alunos da Rota (Relacionamento 1 - Joao)
 */
export default function RotaCard({
  rota,
  capacidadePadrao = 15,
  onEdit,
  onDelete,
  onViewAlunos,
}) {
  const isManha = rota.turno === "MANHA";

  // Calcula quantos alunos estão alocados nesta rota de acordo com o turno
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

  const temCoordenadasIniciais =
    rota.pontoInicialLat !== null &&
    rota.pontoInicialLat !== undefined &&
    rota.pontoInicialLng !== null &&
    rota.pontoInicialLng !== undefined;

  const temCoordenadasFinais =
    rota.pontoFinalLat !== null &&
    rota.pontoFinalLat !== undefined &&
    rota.pontoFinalLng !== null &&
    rota.pontoFinalLng !== undefined;

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        {/* Cabeçalho: Badge de Turno + Ações rápidas */}
        <View style={styles.headerRow}>
          <Chip
            icon={isManha ? "weather-sunny" : "weather-sunset"}
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
            {isManha ? "TURNO MANHÃ (IDA)" : "TURNO TARDE (VOLTA)"}
          </Chip>

          <View style={styles.actionsRight}>
            <IconButton
              icon="pencil-outline"
              size={20}
              iconColor={colors.secondary}
              style={styles.actionIcon}
              onPress={() => onEdit && onEdit(rota)}
              accessibilityLabel="Editar rota"
            />
            <IconButton
              icon="trash-can-outline"
              size={20}
              iconColor={colors.error}
              style={styles.actionIcon}
              onPress={() => onDelete && onDelete(rota)}
              accessibilityLabel="Excluir rota"
            />
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
        </View>

        {/* Indicadores de Distância, Tempo e Capacidade */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBadge}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={18}
              color={colors.secondary}
            />
            <Text variant="bodySmall" style={styles.metricText}>
              {rota.distanciaTotalKm !== null &&
              rota.distanciaTotalKm !== undefined
                ? `${Number(rota.distanciaTotalKm).toFixed(1)} km`
                : "Dist. N/I"}
            </Text>
          </View>

          <View style={styles.metricBadge}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color={colors.secondary}
            />
            <Text variant="bodySmall" style={styles.metricText}>
              {rota.tempoEstimadoMin !== null &&
              rota.tempoEstimadoMin !== undefined
                ? `${rota.tempoEstimadoMin} min`
                : "Tempo N/I"}
            </Text>
          </View>

          <View style={styles.metricBadge}>
            <MaterialCommunityIcons
              name="seat-passenger"
              size={18}
              color={isLotada ? colors.error : colors.success}
            />
            <Text
              variant="bodySmall"
              style={[
                styles.metricText,
                isLotada && { color: colors.error, fontWeight: "700" },
              ]}
            >
              {vagasOcupadas}/{capacidadeMaxima} vagas
            </Text>
          </View>
        </View>

        {/* Barra de Ocupação da Van */}
        <View style={styles.capacityBox}>
          <View style={styles.capacityHeader}>
            <Text variant="labelSmall" style={styles.capacityLabel}>
              Ocupação da Van ({isManha ? "Embarque Manhã" : "Desembarque Tarde"})
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
                : `${capacidadeMaxima - vagasOcupadas} disponíveis`}
            </Text>
          </View>
          <ProgressBar
            progress={percentualLotacao}
            color={isLotada ? colors.error : colors.primary}
            style={styles.progressBar}
          />
        </View>

        {/* Coordenadas Geográficas (se preenchidas) */}
        {(temCoordenadasIniciais || temCoordenadasFinais) && (
          <View style={styles.coordsContainer}>
            {temCoordenadasIniciais && (
              <View style={styles.coordItem}>
                <MaterialCommunityIcons
                  name="ray-start-arrow"
                  size={15}
                  color={colors.success}
                />
                <Text variant="labelSmall" style={styles.coordText}>
                  Origem: {Number(rota.pontoInicialLat).toFixed(4)},{" "}
                  {Number(rota.pontoInicialLng).toFixed(4)}
                </Text>
              </View>
            )}
            {temCoordenadasFinais && (
              <View style={styles.coordItem}>
                <MaterialCommunityIcons
                  name="flag-checkered"
                  size={15}
                  color={colors.error}
                />
                <Text variant="labelSmall" style={styles.coordText}>
                  Destino: {Number(rota.pontoFinalLat).toFixed(4)},{" "}
                  {Number(rota.pontoFinalLng).toFixed(4)}
                </Text>
              </View>
            )}
          </View>
        )}

        <Divider style={styles.divider} />

        {/* Rodapé de Ações */}
        <View style={styles.footerRow}>
          <Button
            mode="outlined"
            icon="account-group-outline"
            compact
            style={styles.footerBtn}
            textColor={colors.secondary}
            onPress={() => onViewAlunos && onViewAlunos(rota)}
          >
            Alunos ({vagasOcupadas})
          </Button>

          <Button
            mode="contained-tonal"
            icon="pencil"
            compact
            style={styles.footerBtn}
            buttonColor={colors.primaryLight}
            textColor="#78350F"
            onPress={() => onEdit && onEdit(rota)}
          >
            Editar Rota
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
    alignItems: "center",
    marginBottom: 8,
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
    fontWeight: "700",
    fontSize: 11,
  },
  manhaChipText: {
    color: "#92400E",
  },
  tardeChipText: {
    color: "#1E40AF",
  },
  actionsRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: -8,
  },
  actionIcon: {
    margin: 0,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  busIcon: {
    marginRight: 8,
  },
  rotaNome: {
    flex: 1,
    fontWeight: "700",
    color: colors.secondary,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
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
    marginBottom: 10,
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
  coordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 8,
  },
  coordItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  coordText: {
    color: colors.textSecondary,
  },
  divider: {
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  footerBtn: {
    borderRadius: 8,
  },
});
