import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Chip,
  Surface,
  SegmentedButtons,
  HelperText,
  Divider,
  ActivityIndicator,
  ProgressBar,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { colors } from "../../../theme";
import { TURNOS } from "../../../constants";
import {
  useRotaDetailQuery,
  useCreateRotaMutation,
  useUpdateRotaMutation,
} from "../../../hooks/useRotas";
import { BAIRROS_RECIFE, geocodificarEndereco } from "../../../utils/geocoding";

/**
 * Formulário de Rota Escolar em 3 Etapas — Fase 4
 * Etapa 1: Nome da rota e Turno (Manhã | Tarde)
 * Etapa 2: Ponto inicial e Ponto final (com presets de bairros de Recife e geocodificação)
 * Etapa 3: Revisão e botão primário "Salvar rota" (52dp, amarelo com texto escuro)
 */
export default function RotaFormScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const rotaId = params.id ? String(params.id) : null;
  const isEditMode = Boolean(rotaId);

  const [etapa, setEtapa] = useState(1);

  const [nome, setNome] = useState(params.nome ? String(params.nome) : "");
  const [turno, setTurno] = useState(
    params.turno === "TARDE" ? "TARDE" : "MANHA",
  );
  const [pontoInicialLat, setPontoInicialLat] = useState(
    params.pontoInicialLat ? String(params.pontoInicialLat) : "",
  );
  const [pontoInicialLng, setPontoInicialLng] = useState(
    params.pontoInicialLng ? String(params.pontoInicialLng) : "",
  );
  const [pontoFinalLat, setPontoFinalLat] = useState(
    params.pontoFinalLat ? String(params.pontoFinalLat) : "",
  );
  const [pontoFinalLng, setPontoFinalLng] = useState(
    params.pontoFinalLng ? String(params.pontoFinalLng) : "",
  );
  const [localPartida, setLocalPartida] = useState("");
  const [localDestino, setLocalDestino] = useState("");
  const [geocodificando, setGeocodificando] = useState(false);
  const [distanciaTotalKm, setDistanciaTotalKm] = useState(
    params.distanciaTotalKm ? String(params.distanciaTotalKm) : "",
  );
  const [tempoEstimadoMin, setTempoEstimadoMin] = useState(
    params.tempoEstimadoMin ? String(params.tempoEstimadoMin) : "",
  );
  const [formError, setFormError] = useState("");

  const { data: rotaDetalhe, isLoading: loadingDetalhe } = useRotaDetailQuery(
    isEditMode ? rotaId : null,
  );

  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Editar Rota Escolar" : "Nova Rota Escolar",
    });
  }, [isEditMode, navigation]);

  useEffect(() => {
    if (rotaDetalhe) {
      setNome(rotaDetalhe.nome || "");
      setTurno(rotaDetalhe.turno === "TARDE" ? "TARDE" : "MANHA");
      setPontoInicialLat(
        rotaDetalhe.pontoInicialLat != null
          ? String(rotaDetalhe.pontoInicialLat)
          : "",
      );
      setPontoInicialLng(
        rotaDetalhe.pontoInicialLng != null
          ? String(rotaDetalhe.pontoInicialLng)
          : "",
      );
      setPontoFinalLat(
        rotaDetalhe.pontoFinalLat != null
          ? String(rotaDetalhe.pontoFinalLat)
          : "",
      );
      setPontoFinalLng(
        rotaDetalhe.pontoFinalLng != null
          ? String(rotaDetalhe.pontoFinalLng)
          : "",
      );
      setDistanciaTotalKm(
        rotaDetalhe.distanciaTotalKm != null
          ? String(rotaDetalhe.distanciaTotalKm)
          : "",
      );
      setTempoEstimadoMin(
        rotaDetalhe.tempoEstimadoMin != null
          ? String(rotaDetalhe.tempoEstimadoMin)
          : "",
      );
    }
  }, [rotaDetalhe]);

  const createMutation = useCreateRotaMutation();
  const updateMutation = useUpdateRotaMutation();
  const isSubmitting =
    geocodificando || createMutation.isPending || updateMutation.isPending;

  const parseOptionalFloat = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const normalized = String(val).replace(",", ".").trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? NaN : parsed;
  };

  const parseOptionalInt = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const parsed = Number.parseInt(String(val).trim(), 10);
    return Number.isNaN(parsed) ? NaN : parsed;
  };

  const handleNextStep1 = () => {
    setFormError("");
    if (!nome.trim() || nome.trim().length < 3) {
      setFormError("Informe o nome da rota escolar (mínimo 3 caracteres).");
      return;
    }
    setEtapa(2);
  };

  const handleNextStep2 = async () => {
    setFormError("");
    const distKm = parseOptionalFloat(distanciaTotalKm);
    const tempoMin = parseOptionalInt(tempoEstimadoMin);

    if (Number.isNaN(distKm) || (distKm !== null && distKm < 0)) {
      setFormError("Informe uma distância em km válida (ex.: 12.5).");
      return;
    }
    if (Number.isNaN(tempoMin) || (tempoMin !== null && tempoMin < 0)) {
      setFormError("Informe um tempo estimado em minutos válido (ex.: 45).");
      return;
    }

    if (localPartida.trim() || localDestino.trim()) {
      setGeocodificando(true);
      try {
        if (localPartida.trim()) {
          const geoIni = await geocodificarEndereco(localPartida);
          if (geoIni) {
            setPontoInicialLat(String(geoIni.latitude));
            setPontoInicialLng(String(geoIni.longitude));
          }
        }
        if (localDestino.trim()) {
          const geoFim = await geocodificarEndereco(localDestino);
          if (geoFim) {
            setPontoFinalLat(String(geoFim.latitude));
            setPontoFinalLng(String(geoFim.longitude));
          }
        }
      } finally {
        setGeocodificando(false);
      }
    }

    setEtapa(3);
  };

  const handleSubmit = async () => {
    setFormError("");

    const latIni = parseOptionalFloat(pontoInicialLat);
    const lngIni = parseOptionalFloat(pontoInicialLng);
    const latFim = parseOptionalFloat(pontoFinalLat);
    const lngFim = parseOptionalFloat(pontoFinalLng);
    const distKm = parseOptionalFloat(distanciaTotalKm);
    const tempoMin = parseOptionalInt(tempoEstimadoMin);

    const payload = {
      nome: nome.trim(),
      turno,
      pontoInicialLat: Number.isNaN(latIni) ? null : latIni,
      pontoInicialLng: Number.isNaN(lngIni) ? null : lngIni,
      pontoFinalLat: Number.isNaN(latFim) ? null : latFim,
      pontoFinalLng: Number.isNaN(lngFim) ? null : lngFim,
      distanciaTotalKm: Number.isNaN(distKm) ? null : distKm,
      tempoEstimadoMin: Number.isNaN(tempoMin) ? null : tempoMin,
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: rotaId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      router.back();
    } catch (error) {
      setFormError(
        error.friendlyMessage || "Ocorreu um erro ao salvar a rota.",
      );
    }
  };

  if (loadingDetalhe) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Carregando dados da rota...
        </Text>
      </View>
    );
  }

  const turnoInfo = TURNOS[turno] || TURNOS.MANHA;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabeçalho de Progresso */}
        <Surface style={styles.stepHeaderCard} elevation={1}>
          <View style={styles.stepHeaderTop}>
            <Text variant="labelLarge" style={styles.stepTag}>
              ETAPA {etapa} DE 3
            </Text>
            <Text variant="bodySmall" style={styles.stepSubtitle}>
              {etapa === 1
                ? "Nome e Turno"
                : etapa === 2
                  ? "Pontos Inicial e Final"
                  : "Revisão da Rota"}
            </Text>
          </View>
          <ProgressBar
            progress={etapa / 3}
            color={colors.primary}
            style={styles.progressBar}
          />
        </Surface>

        <Surface style={styles.formCard} elevation={1}>
          {etapa === 1 ? (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                1. Nome e Turno da Rota
              </Text>
              <Text variant="bodySmall" style={styles.helperCopy}>
                Dê um nome fácil de reconhecer pelo bairro ou escola atendida.
              </Text>

              <TextInput
                label="Nome da Rota Escolar *"
                placeholder="Ex.: Rota Boa Viagem → Colégio Santa Maria"
                mode="outlined"
                value={nome}
                onChangeText={(v) => {
                  setNome(v);
                  if (formError) setFormError("");
                }}
                left={<TextInput.Icon icon="routes" />}
                style={styles.input}
              />

              <Text variant="labelLarge" style={styles.fieldLabel}>
                Turno da Viagem *
              </Text>
              <SegmentedButtons
                value={turno}
                onValueChange={setTurno}
                buttons={[
                  {
                    value: "MANHA",
                    label: "Manhã (Ida)",
                    icon: "weather-sunny",
                  },
                  {
                    value: "TARDE",
                    label: "Tarde (Volta)",
                    icon: "weather-sunset",
                  },
                ]}
                style={styles.segmented}
              />

              {formError ? (
                <HelperText type="error" visible style={styles.errorText}>
                  {formError}
                </HelperText>
              ) : null}

              <View style={styles.actionsRow}>
                <Button
                  mode="outlined"
                  onPress={() => router.back()}
                  style={styles.backBtn}
                  contentStyle={styles.secondaryBtnContent}
                  textColor={colors.secondary}
                >
                  Cancelar
                </Button>

                <Button
                  mode="contained"
                  icon="arrow-right"
                  contentStyle={[
                    styles.primaryBtnContent,
                    { flexDirection: "row-reverse" },
                  ]}
                  style={styles.primaryBtn}
                  buttonColor={colors.primary}
                  textColor={colors.text}
                  labelStyle={styles.primaryBtnLabel}
                  onPress={handleNextStep1}
                >
                  Continuar
                </Button>
              </View>
            </>
          ) : null}

          {etapa === 2 ? (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                2. Pontos Inicial e Final
              </Text>
              <Text variant="bodySmall" style={styles.helperCopy}>
                Escolha um bairro de Recife ou digite o endereço para calcular
                as coordenadas no mapa automaticamente.
              </Text>

              <TextInput
                label="Ponto Inicial (Bairro ou Endereço)"
                placeholder="Ex.: Boa Viagem ou Av. Conselheiro Aguiar"
                mode="outlined"
                value={localPartida}
                onChangeText={setLocalPartida}
                left={<TextInput.Icon icon="map-marker-outline" />}
                style={styles.input}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bairrosRow}
              >
                {BAIRROS_RECIFE.map((b) => (
                  <Chip
                    key={`ini-${b.label}`}
                    compact
                    selected={localPartida === b.label}
                    onPress={() => {
                      setLocalPartida(b.label);
                      setPontoInicialLat(String(b.lat));
                      setPontoInicialLng(String(b.lng));
                    }}
                    style={styles.bairroChip}
                  >
                    {b.label}
                  </Chip>
                ))}
              </ScrollView>

              <TextInput
                label="Ponto Final / Escola de Destino"
                placeholder="Ex.: Colégio Santa Maria ou Derby"
                mode="outlined"
                value={localDestino}
                onChangeText={setLocalDestino}
                left={<TextInput.Icon icon="flag-checkered" />}
                style={styles.input}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bairrosRow}
              >
                {BAIRROS_RECIFE.map((b) => (
                  <Chip
                    key={`fim-${b.label}`}
                    compact
                    selected={localDestino === b.label}
                    onPress={() => {
                      setLocalDestino(b.label);
                      setPontoFinalLat(String(b.lat));
                      setPontoFinalLng(String(b.lng));
                    }}
                    style={styles.bairroChip}
                  >
                    {b.label}
                  </Chip>
                ))}
              </ScrollView>

              <Divider style={styles.divider} />

              <Text variant="labelLarge" style={styles.fieldLabel}>
                Estimativa Manual (opcional)
              </Text>
              <View style={styles.row}>
                <TextInput
                  label="Distância (km)"
                  placeholder="Ex.: 12.5"
                  mode="outlined"
                  keyboardType="decimal-pad"
                  value={distanciaTotalKm}
                  onChangeText={setDistanciaTotalKm}
                  left={<TextInput.Icon icon="map-marker-distance" />}
                  style={[styles.input, styles.halfInput]}
                />

                <TextInput
                  label="Tempo (min)"
                  placeholder="Ex.: 45"
                  mode="outlined"
                  keyboardType="numeric"
                  value={tempoEstimadoMin}
                  onChangeText={setTempoEstimadoMin}
                  left={<TextInput.Icon icon="clock-outline" />}
                  style={[styles.input, styles.halfInput]}
                />
              </View>

              {formError ? (
                <HelperText type="error" visible style={styles.errorText}>
                  {formError}
                </HelperText>
              ) : null}

              <View style={styles.actionsRow}>
                <Button
                  mode="outlined"
                  icon="arrow-left"
                  onPress={() => setEtapa(1)}
                  disabled={geocodificando}
                  style={styles.backBtn}
                  contentStyle={styles.secondaryBtnContent}
                  textColor={colors.secondary}
                >
                  Voltar
                </Button>

                <Button
                  mode="contained"
                  icon="arrow-right"
                  loading={geocodificando}
                  disabled={geocodificando}
                  contentStyle={[
                    styles.primaryBtnContent,
                    { flexDirection: "row-reverse" },
                  ]}
                  style={styles.primaryBtn}
                  buttonColor={colors.primary}
                  textColor={colors.text}
                  labelStyle={styles.primaryBtnLabel}
                  onPress={handleNextStep2}
                >
                  Revisar
                </Button>
              </View>
            </>
          ) : null}

          {etapa === 3 ? (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                3. Revisão da Rota
              </Text>
              <Text variant="bodySmall" style={styles.helperCopy}>
                Confira os dados antes de salvar a rota escolar.
              </Text>

              <View style={styles.reviewBox}>
                <View style={styles.reviewRow}>
                  <MaterialCommunityIcons
                    name="bus-school"
                    size={20}
                    color={colors.primaryDark}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="labelSmall" style={styles.reviewLabel}>
                      NOME DA ROTA
                    </Text>
                    <Text variant="titleMedium" style={styles.reviewValue}>
                      {nome.trim()}
                    </Text>
                  </View>
                </View>

                <Divider style={styles.reviewDivider} />

                <View style={styles.reviewRow}>
                  <MaterialCommunityIcons
                    name={turnoInfo.icon}
                    size={20}
                    color={colors.secondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="labelSmall" style={styles.reviewLabel}>
                      TURNO
                    </Text>
                    <Text variant="bodyLarge" style={styles.reviewValue}>
                      {turnoInfo.label}
                    </Text>
                  </View>
                </View>

                <Divider style={styles.reviewDivider} />

                <View style={styles.reviewRow}>
                  <MaterialCommunityIcons
                    name="map-marker-path"
                    size={20}
                    color={colors.success}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="labelSmall" style={styles.reviewLabel}>
                      PONTOS DE PARTIDA E DESTINO
                    </Text>
                    <Text variant="bodyMedium" style={styles.reviewValue}>
                      Partida:{" "}
                      {localPartida.trim() ||
                        (pontoInicialLat
                          ? `GPS (${Number(pontoInicialLat).toFixed(4)}, ${Number(pontoInicialLng).toFixed(4)})`
                          : "Automático pelos alunos")}
                    </Text>
                    <Text variant="bodyMedium" style={styles.reviewValue}>
                      Destino:{" "}
                      {localDestino.trim() ||
                        (pontoFinalLat
                          ? `GPS (${Number(pontoFinalLat).toFixed(4)}, ${Number(pontoFinalLng).toFixed(4)})`
                          : "Automático pelos alunos")}
                    </Text>
                  </View>
                </View>

                {(distanciaTotalKm || tempoEstimadoMin) && (
                  <>
                    <Divider style={styles.reviewDivider} />
                    <View style={styles.reviewRow}>
                      <MaterialCommunityIcons
                        name="clock-fast"
                        size={20}
                        color={colors.info}
                      />
                      <View style={{ flex: 1 }}>
                        <Text variant="labelSmall" style={styles.reviewLabel}>
                          ESTIMATIVA
                        </Text>
                        <Text variant="bodyMedium" style={styles.reviewValue}>
                          {distanciaTotalKm ? `${distanciaTotalKm} km` : "—"}{" "}
                          • {tempoEstimadoMin ? `${tempoEstimadoMin} min` : "—"}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              {formError ? (
                <HelperText type="error" visible style={styles.errorText}>
                  {formError}
                </HelperText>
              ) : null}

              <View style={styles.actionsRow}>
                <Button
                  mode="outlined"
                  icon="arrow-left"
                  onPress={() => setEtapa(2)}
                  disabled={isSubmitting}
                  style={styles.backBtn}
                  contentStyle={styles.secondaryBtnContent}
                  textColor={colors.secondary}
                >
                  Voltar
                </Button>

                <Button
                  mode="contained"
                  icon="check-bold"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  style={styles.primaryBtn}
                  contentStyle={styles.primaryBtnContent}
                  buttonColor={colors.primary}
                  textColor={colors.text}
                  labelStyle={styles.primaryBtnLabel}
                >
                  Salvar rota
                </Button>
              </View>
            </>
          ) : null}
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  stepHeaderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  stepHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepTag: {
    fontWeight: "800",
    color: colors.primaryDark,
  },
  stepSubtitle: {
    fontWeight: "700",
    color: colors.secondary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceVariant,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontWeight: "800",
    color: colors.secondary,
    marginBottom: 4,
  },
  helperCopy: {
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  fieldLabel: {
    color: colors.secondary,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  segmented: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 14,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  bairrosRow: {
    gap: 6,
    marginBottom: 14,
  },
  bairroChip: {
    backgroundColor: colors.surfaceVariant,
  },
  reviewBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  reviewLabel: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
  reviewValue: {
    color: colors.secondary,
    fontWeight: "700",
    marginTop: 2,
  },
  reviewDivider: {
    marginVertical: 10,
  },
  errorText: {
    fontWeight: "700",
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  backBtn: {
    borderRadius: 12,
    borderColor: colors.border,
  },
  secondaryBtnContent: {
    minHeight: 48,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 12,
  },
  primaryBtnContent: {
    height: 52,
  },
  primaryBtnLabel: {
    fontWeight: "800",
    fontSize: 15,
  },
});
