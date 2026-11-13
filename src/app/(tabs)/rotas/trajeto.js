import { useState } from "react";
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import EmptyState from "../../../components/EmptyState";
import MapaTrajeto from "../../../components/rotas/MapaTrajeto";
import {
  TURNO_LABELS,
  formatarDataBR,
  getHojeISO,
  getHoraAtual,
  isDataValida,
} from "../../../components/operacao/helpers";
import {
  useOtimizarRotaMutation,
  useTrajetoOtimizadoQuery,
} from "../../../hooks/useRotas";
import { useRegistrarPresencaMutation } from "../../../hooks/useOperacao";
import { useAppStore } from "../../../store/useAppStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { colors } from "../../../theme";

const adicionarDiasISO = (iso, delta) => {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(ano, mes - 1, dia + delta));
  return dt.toISOString().slice(0, 10);
};

const extrairDigitos = (telefone) => String(telefone || "").replace(/\D/g, "");

const montarUrlWhatsApp = (telefone) => {
  const digits = extrairDigitos(telefone);
  if (!digits) return null;
  const comDdi = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${comDdi}`;
};

const extrairCoordenadasTrajeto = (trajeto) => {
  const viaWaypoints = (trajeto?.waypoints || [])
    .filter((w) => w.latitude != null && w.longitude != null)
    .map((w) => `${Number(w.latitude)},${Number(w.longitude)}`);

  if (viaWaypoints.length >= 2) return viaWaypoints;

  const pontos = [];
  if (
    trajeto?.pontoInicial?.latitude != null &&
    trajeto?.pontoInicial?.longitude != null
  ) {
    pontos.push(
      `${Number(trajeto.pontoInicial.latitude)},${Number(trajeto.pontoInicial.longitude)}`,
    );
  }
  for (const parada of trajeto?.paradas || []) {
    if (parada.latitude != null && parada.longitude != null) {
      pontos.push(`${Number(parada.latitude)},${Number(parada.longitude)}`);
    }
  }
  if (
    trajeto?.pontoFinal?.latitude != null &&
    trajeto?.pontoFinal?.longitude != null
  ) {
    pontos.push(
      `${Number(trajeto.pontoFinal.latitude)},${Number(trajeto.pontoFinal.longitude)}`,
    );
  }
  return pontos;
};

export default function TrajetoRotaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rotaId = Array.isArray(params.id) ? params.id[0] : params.id;

  const user = useAuthStore((state) => state.user);
  const showSnackbar = useAppStore((state) => state.showSnackbar);
  const isMotorista = user?.tipo === "MOTORISTA" || !user?.tipo;

  const [dataSelecionada, setDataSelecionada] = useState(getHojeISO);
  const [dataInput, setDataInput] = useState(getHojeISO);
  const [canceladosExpandido, setCanceladosExpandido] = useState(false);
  const [checkinAlunoId, setCheckinAlunoId] = useState(null);
  const [checkinsConfirmados, setCheckinsConfirmados] = useState({});

  const {
    data: trajeto,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useTrajetoOtimizadoQuery(rotaId, dataSelecionada);

  const otimizarMutation = useOtimizarRotaMutation();
  const presencaMutation = useRegistrarPresencaMutation();

  const selecionarNovaData = (novaData) => {
    setDataSelecionada(novaData);
    setDataInput(novaData);
  };

  const handleAplicarDataManual = () => {
    const limpa = dataInput.trim();
    if (!isDataValida(limpa)) {
      showSnackbar("Informe a data no formato AAAA-MM-DD.", "error");
      return;
    }
    setDataSelecionada(limpa);
  };

  const handleRecalcular = () => {
    if (!rotaId) return;
    otimizarMutation.mutate({ id: rotaId, data: dataSelecionada });
  };

  const handleAbrirUrl = async (url, erroMsg) => {
    try {
      await Linking.openURL(url);
    } catch {
      showSnackbar(erroMsg, "error");
    }
  };

  const handleAbrirGoogleMaps = () => {
    const pontos = extrairCoordenadasTrajeto(trajeto);
    if (pontos.length < 2) {
      showSnackbar(
        "São necessários ao menos 2 pontos com coordenadas para navegar no mapa.",
        "info",
      );
      return;
    }

    const origin = pontos[0];
    const destination = pontos[pontos.length - 1];
    const middle = pontos.slice(1, -1).slice(0, 20);

    const queryParts = [
      "api=1",
      `origin=${encodeURIComponent(origin)}`,
      `destination=${encodeURIComponent(destination)}`,
      middle.length > 0
        ? `waypoints=${encodeURIComponent(middle.join("|"))}`
        : null,
      "travelmode=driving",
    ].filter(Boolean);

    handleAbrirUrl(
      `https://www.google.com/maps/dir/?${queryParts.join("&")}`,
      "Não foi possível abrir o Google Maps neste dispositivo.",
    );
  };

  const handleCheckin = async (parada) => {
    if (!isMotorista || !trajeto) return;

    const dataRef = trajeto.dataReferencia || dataSelecionada;
    const turno = trajeto.turno;
    const chave = `${dataRef}:${turno}:${parada.alunoId}`;
    const horarioAtual = getHoraAtual();

    setCheckinAlunoId(parada.alunoId);
    try {
      await presencaMutation.mutateAsync({
        alunoId: parada.alunoId,
        data: {
          data: dataRef,
          turno,
          embarcou: true,
          horarioEmbarque: horarioAtual,
        },
      });
      setCheckinsConfirmados((prev) => ({
        ...prev,
        [chave]: horarioAtual,
      }));
    } catch (err) {
      if (err?.response?.status === 409) {
        setCheckinsConfirmados((prev) => ({
          ...prev,
          [chave]: "já registrado",
        }));
      }
    } finally {
      setCheckinAlunoId(null);
    }
  };

  if (!rotaId) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="map-search-outline"
          title="Rota não selecionada"
          description="Volte para a lista de rotas para visualizar o trajeto do dia."
          actionLabel="Voltar"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  if (isLoading && !trajeto) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Calculando melhor trajeto do dia...
        </Text>
      </View>
    );
  }

  if (isError && !trajeto) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="alert-circle-outline"
          title="Erro ao carregar o trajeto"
          description={
            error?.friendlyMessage ||
            "Não foi possível obter a rota otimizada no momento."
          }
          actionLabel="Tentar novamente"
          onAction={refetch}
        />
      </View>
    );
  }

  const resumo = trajeto?.resumo || {};
  const paradas = trajeto?.paradas || [];
  const cancelados = trajeto?.alunosCanceladosNoDia || [];
  const dataRef = trajeto?.dataReferencia || dataSelecionada;
  const turnoLabel = TURNO_LABELS[trajeto?.turno] || trajeto?.turno || "-";
  const isManha = trajeto?.turno === "MANHA";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Cabeçalho da Rota e Data */}
      <Surface style={styles.headerCard} elevation={1}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleBox}>
            <Text variant="titleMedium" style={styles.rotaNome}>
              {trajeto?.nome || "Rota Escolar"}
            </Text>
            <Text variant="bodySmall" style={styles.dataLabel}>
              Viagem do dia {formatarDataBR(dataRef)}
            </Text>
          </View>

          <View
            style={[
              styles.turnoBadge,
              {
                backgroundColor: isManha
                  ? colors.primaryLight
                  : colors.infoLight,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isManha ? "weather-sunny" : "weather-sunset"}
              size={14}
              color={isManha ? "#92400E" : "#1D4ED8"}
            />
            <Text
              variant="labelSmall"
              style={[
                styles.turnoText,
                { color: isManha ? "#92400E" : "#1D4ED8" },
              ]}
            >
              {turnoLabel}
            </Text>
          </View>
        </View>

        {/* Seletor de Data */}
        <View style={styles.dateStepperRow}>
          <Button
            mode="outlined"
            compact
            icon="chevron-left"
            onPress={() => selecionarNovaData(adicionarDiasISO(dataSelecionada, -1))}
            style={styles.dateNavBtn}
          >
            -1 dia
          </Button>
          <Button
            mode={dataSelecionada === getHojeISO() ? "contained-tonal" : "outlined"}
            compact
            onPress={() => selecionarNovaData(getHojeISO())}
            style={styles.dateNavBtn}
          >
            Hoje
          </Button>
          <Button
            mode="outlined"
            compact
            contentStyle={styles.btnIconRight}
            icon="chevron-right"
            onPress={() => selecionarNovaData(adicionarDiasISO(dataSelecionada, 1))}
            style={styles.dateNavBtn}
          >
            +1 dia
          </Button>
        </View>

        <View style={styles.dateInputRow}>
          <TextInput
            mode="outlined"
            dense
            label="Data (AAAA-MM-DD)"
            value={dataInput}
            onChangeText={setDataInput}
            placeholder="2026-11-13"
            style={styles.dateInput}
            maxLength={10}
          />
          <Button
            mode="outlined"
            onPress={handleAplicarDataManual}
            style={styles.dateApplyBtn}
          >
            Ir
          </Button>
        </View>

        {isMotorista ? (
          <Button
            mode="contained"
            icon="navigation-variant"
            onPress={handleRecalcular}
            loading={otimizarMutation.isPending}
            disabled={otimizarMutation.isPending || isFetching}
            buttonColor={colors.primary}
            textColor="#0F172A"
            style={styles.recalcularBtn}
          >
            Recalcular Melhor Rota
          </Button>
        ) : null}
      </Surface>

      {/* Cards de Resumo */}
      <View style={styles.kpiRow}>
        <Surface style={styles.kpiCard} elevation={1}>
          <MaterialCommunityIcons
            name="map-marker-distance"
            size={20}
            color={colors.primaryDark}
          />
          <Text variant="titleMedium" style={styles.kpiValue}>
            {Number(resumo.distanciaTotalKm || 0).toFixed(2)} km
          </Text>
          <Text variant="labelSmall" style={styles.kpiLabel}>
            Distância total
          </Text>
        </Surface>

        <Surface style={styles.kpiCard} elevation={1}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color={colors.info}
          />
          <Text variant="titleMedium" style={styles.kpiValue}>
            ~{resumo.tempoEstimadoMin ?? 0} min
          </Text>
          <Text variant="labelSmall" style={styles.kpiLabel}>
            Tempo estimado
          </Text>
        </Surface>

        <Surface style={styles.kpiCard} elevation={1}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={20}
            color={colors.success}
          />
          <Text variant="titleMedium" style={styles.kpiValue}>
            {resumo.alunosAtivosHoje ?? 0}/{resumo.totalAlunosVinculados ?? 0}
          </Text>
          <Text variant="labelSmall" style={styles.kpiLabel}>
            Ativos hoje
          </Text>
        </Surface>
      </View>

      {/* Mapa + Botão Google Maps */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionTitle}>
          Mapa do Trajeto
        </Text>

        <MapaTrajeto waypoints={trajeto?.waypoints || []} height={240} />

        <Button
          mode="contained"
          icon="google-maps"
          onPress={handleAbrirGoogleMaps}
          buttonColor={colors.secondary}
          textColor="#FFFFFF"
          style={styles.gmapsBtn}
        >
          Abrir Trajeto no Google Maps
        </Button>
      </View>

      {/* Alerta Retrátil de Alunos Cancelados/Ausentes */}
      {cancelados.length > 0 ? (
        <Surface style={styles.canceladosCard} elevation={0}>
          <TouchableOpacity
            style={styles.canceladosHeader}
            activeOpacity={0.7}
            onPress={() => setCanceladosExpandido((v) => !v)}
          >
            <View style={styles.canceladosTitleRow}>
              <MaterialCommunityIcons
                name="account-cancel-outline"
                size={20}
                color="#B45309"
              />
              <Text variant="titleSmall" style={styles.canceladosTitle}>
                Ausentes no dia ({cancelados.length})
              </Text>
            </View>
            <MaterialCommunityIcons
              name={canceladosExpandido ? "chevron-up" : "chevron-down"}
              size={22}
              color="#B45309"
            />
          </TouchableOpacity>

          {canceladosExpandido ? (
            <View style={styles.canceladosList}>
              {cancelados.map((item) => (
                <View key={item.alunoId} style={styles.canceladoItem}>
                  <View style={styles.canceladoTop}>
                    <Text variant="bodyMedium" style={styles.canceladoNome}>
                      {item.alunoNome}
                    </Text>
                    <View style={styles.canceladoBadge}>
                      <Text variant="labelSmall" style={styles.canceladoBadgeText}>
                        {item.turnoCancelado}
                      </Text>
                    </View>
                  </View>
                  <Text variant="bodySmall" style={styles.canceladoMotivo}>
                    {item.motivoCancelamento || "Viagem cancelada para esta data"}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Surface>
      ) : null}

      {/* Timeline de Paradas */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionTitle}>
          Ordem de Paradas ({paradas.length})
        </Text>

        {paradas.length === 0 ? (
          <Surface style={styles.emptyParadasCard} elevation={0}>
            <MaterialCommunityIcons
              name="van-utility"
              size={28}
              color={colors.textSecondary}
            />
            <Text variant="bodyMedium" style={styles.emptyParadasText}>
              Nenhuma parada programada para esta data.
            </Text>
          </Surface>
        ) : (
          paradas.map((parada) => {
            const chaveCheckin = `${dataRef}:${trajeto?.turno}:${parada.alunoId}`;
            const horarioConfirmado = checkinsConfirmados[chaveCheckin];
            const semCoords =
              parada.latitude == null || parada.longitude == null;
            const telefoneDigitos = extrairDigitos(
              parada.contatoEntrega?.telefone,
            );
            const whatsappUrl = montarUrlWhatsApp(
              parada.contatoEntrega?.telefone,
            );
            const isEmbarque = parada.tipoParada === "EMBARQUE";

            return (
              <Surface
                key={`${parada.alunoId}-${parada.ordem}`}
                style={styles.paradaCard}
                elevation={1}
              >
                <View style={styles.paradaTopRow}>
                  <View style={styles.ordemBadge}>
                    <Text variant="labelLarge" style={styles.ordemText}>
                      #{parada.ordem}
                    </Text>
                  </View>

                  <View style={styles.paradaInfo}>
                    <Text variant="titleSmall" style={styles.alunoNome}>
                      {parada.alunoNome}
                    </Text>
                    {parada.escola ? (
                      <Text variant="bodySmall" style={styles.escolaText}>
                        {parada.escola}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.tipoParadaBadge,
                      {
                        backgroundColor: isEmbarque
                          ? colors.infoLight
                          : colors.primaryLight,
                      },
                    ]}
                  >
                    <Text
                      variant="labelSmall"
                      style={[
                        styles.tipoParadaText,
                        { color: isEmbarque ? "#1D4ED8" : "#92400E" },
                      ]}
                    >
                      {parada.tipoParada}
                    </Text>
                  </View>
                </View>

                <View style={styles.enderecoRow}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={16}
                    color={colors.textSecondary}
                    style={styles.enderecoIcon}
                  />
                  <Text variant="bodySmall" style={styles.enderecoText}>
                    {parada.endereco || "Endereço não cadastrado"}
                  </Text>
                </View>

                <View style={styles.trechoRow}>
                  <Text variant="labelSmall" style={styles.trechoText}>
                    + {Number(parada.distanciaTrechoKm || 0).toFixed(2)} km • ~
                    {parada.tempoTrechoMin ?? 0} min até aqui
                  </Text>
                  {semCoords ? (
                    <Text variant="labelSmall" style={styles.semCoordsText}>
                      Sem GPS
                    </Text>
                  ) : null}
                </View>

                {parada.contatoEntrega?.nome || telefoneDigitos ? (
                  <View style={styles.contatoBox}>
                    <Text variant="bodySmall" style={styles.contatoNome}>
                      Contato:{" "}
                      {parada.contatoEntrega?.nome || "Responsável"}
                    </Text>
                    {telefoneDigitos ? (
                      <View style={styles.contatoAcoes}>
                        <Button
                          mode="outlined"
                          compact
                          icon="phone"
                          onPress={() =>
                            handleAbrirUrl(
                              `tel:${telefoneDigitos}`,
                              "Não foi possível iniciar a ligação.",
                            )
                          }
                          style={styles.contatoBtn}
                        >
                          Ligar
                        </Button>
                        {whatsappUrl ? (
                          <Button
                            mode="outlined"
                            compact
                            icon="whatsapp"
                            textColor={colors.success}
                            onPress={() =>
                              handleAbrirUrl(
                                whatsappUrl,
                                "Não foi possível abrir o WhatsApp.",
                              )
                            }
                            style={styles.contatoBtn}
                          >
                            WhatsApp
                          </Button>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {isMotorista ? (
                  <View style={styles.checkinRow}>
                    {horarioConfirmado ? (
                      <View style={styles.checkinConfirmado}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={18}
                          color={colors.success}
                        />
                        <Text
                          variant="labelMedium"
                          style={styles.checkinConfirmadoText}
                        >
                          Check-in confirmado ({horarioConfirmado})
                        </Text>
                      </View>
                    ) : (
                      <Button
                        mode="contained-tonal"
                        icon="check-circle-outline"
                        loading={checkinAlunoId === parada.alunoId}
                        disabled={presencaMutation.isPending}
                        onPress={() => handleCheckin(parada)}
                        buttonColor={colors.successLight}
                        textColor="#065F46"
                        style={styles.checkinBtn}
                      >
                        Check-in de Embarque
                      </Button>
                    )}
                  </View>
                ) : null}
              </Surface>
            );
          })
        )}
      </View>
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
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  headerTitleBox: {
    flex: 1,
  },
  rotaNome: {
    fontWeight: "700",
    color: colors.text,
  },
  dataLabel: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  turnoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  turnoText: {
    fontWeight: "700",
  },
  dateStepperRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  dateNavBtn: {
    flex: 1,
    borderRadius: 8,
  },
  btnIconRight: {
    flexDirection: "row-reverse",
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  dateInput: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  dateApplyBtn: {
    marginTop: 4,
    borderRadius: 8,
  },
  recalcularBtn: {
    marginTop: 12,
    borderRadius: 10,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  kpiValue: {
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  kpiLabel: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  gmapsBtn: {
    marginTop: 10,
    borderRadius: 10,
  },
  canceladosCard: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  canceladosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  canceladosTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  canceladosTitle: {
    fontWeight: "700",
    color: "#92400E",
  },
  canceladosList: {
    marginTop: 10,
    gap: 8,
  },
  canceladoItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  canceladoTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  canceladoNome: {
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  canceladoBadge: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  canceladoBadgeText: {
    color: colors.error,
    fontWeight: "700",
  },
  canceladoMotivo: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyParadasCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  emptyParadasText: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  paradaCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  paradaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ordemBadge: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  ordemText: {
    color: "#0F172A",
    fontWeight: "800",
  },
  paradaInfo: {
    flex: 1,
  },
  alunoNome: {
    fontWeight: "700",
    color: colors.text,
  },
  escolaText: {
    color: colors.textSecondary,
  },
  tipoParadaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tipoParadaText: {
    fontWeight: "700",
  },
  enderecoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 10,
  },
  enderecoIcon: {
    marginTop: 2,
  },
  enderecoText: {
    flex: 1,
    color: colors.text,
  },
  trechoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  trechoText: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  semCoordsText: {
    color: colors.error,
    fontWeight: "600",
  },
  contatoBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  contatoNome: {
    color: colors.textSecondary,
  },
  contatoAcoes: {
    flexDirection: "row",
    gap: 8,
  },
  contatoBtn: {
    flex: 1,
    borderRadius: 8,
  },
  checkinRow: {
    marginTop: 10,
  },
  checkinBtn: {
    borderRadius: 8,
  },
  checkinConfirmado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.successLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  checkinConfirmadoText: {
    color: "#065F46",
    fontWeight: "700",
  },
});

