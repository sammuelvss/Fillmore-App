import React, { useEffect, useRef, useState } from "react";
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
import {
  BAIRROS_RECIFE,
  geocodificarEndereco,
  geocodificarReverso,
  identificarBairroPorCoordenadas,
} from "../../../utils/geocoding";

/**
 * Formulário de Rota Escolar em 3 Etapas — Fase 4
 * Etapa 1: Nome da rota e Turno (Manhã | Tarde)
 * Etapa 2: Ponto inicial e Ponto final (pré-preenchidos ao editar/duplicar + presets de Recife)
 * Etapa 3: Revisão e botão primário "Salvar rota" (52dp, amarelo com texto escuro)
 */
export default function RotaFormScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const rotaId = params.id ? String(params.id) : null;
  const isEditMode = Boolean(rotaId);

  const [etapa, setEtapa] = useState(1);

  const [nome, setNome] = useState(
    params.nome ? String(params.nome).replace(/\s*\(undefined\)\s*/gi, "") : "",
  );
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
  const [partidaEditada, setPartidaEditada] = useState(false);
  const [destinoEditado, setDestinoEditado] = useState(false);
  const [geocodificando, setGeocodificando] = useState(false);
  const [distanciaTotalKm, setDistanciaTotalKm] = useState(
    params.distanciaTotalKm ? String(params.distanciaTotalKm) : "",
  );
  const [tempoEstimadoMin, setTempoEstimadoMin] = useState(
    params.tempoEstimadoMin ? String(params.tempoEstimadoMin) : "",
  );
  const [formError, setFormError] = useState("");

  const partidaEditadaRef = useRef(false);
  const destinoEditadoRef = useRef(false);

  const { data: rotaDetalhe, isLoading: loadingDetalhe } = useRotaDetailQuery(
    isEditMode ? rotaId : null,
  );

  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Editar Rota Escolar" : "Nova Rota Escolar",
    });
  }, [isEditMode, navigation]);

  // Carrega dados da rota (em edição ou recém-duplicada) e pré-preenche os nomes dos pontos inicial e final
  useEffect(() => {
    if (!rotaDetalhe) return;

    let cancelado = false;

    const nomeLimpo = String(rotaDetalhe.nome || "").replace(
      /\s*\(undefined\)\s*/gi,
      "",
    );
    setNome(nomeLimpo);
    setTurno(rotaDetalhe.turno === "TARDE" ? "TARDE" : "MANHA");

    const latIni = rotaDetalhe.pontoInicialLat;
    const lngIni = rotaDetalhe.pontoInicialLng;
    const latFim = rotaDetalhe.pontoFinalLat;
    const lngFim = rotaDetalhe.pontoFinalLng;

    setPontoInicialLat(latIni != null ? String(latIni) : "");
    setPontoInicialLng(lngIni != null ? String(lngIni) : "");
    setPontoFinalLat(latFim != null ? String(latFim) : "");
    setPontoFinalLng(lngFim != null ? String(lngFim) : "");

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

    setPartidaEditada(false);
    setDestinoEditado(false);
    partidaEditadaRef.current = false;
    destinoEditadoRef.current = false;

    if (latIni != null && lngIni != null) {
      const imediatoIni = identificarBairroPorCoordenadas(latIni, lngIni);
      setLocalPartida(
        imediatoIni || `${Number(latIni).toFixed(4)}, ${Number(lngIni).toFixed(4)}`,
      );
      if (!imediatoIni) {
        geocodificarReverso(latIni, lngIni).then((nomeResolvido) => {
          if (!cancelado && !partidaEditadaRef.current && nomeResolvido) {
            setLocalPartida(nomeResolvido);
          }
        });
      }
    } else {
      setLocalPartida("");
    }

    if (latFim != null && lngFim != null) {
      const imediatoFim = identificarBairroPorCoordenadas(latFim, lngFim);
      setLocalDestino(
        imediatoFim || `${Number(latFim).toFixed(4)}, ${Number(lngFim).toFixed(4)}`,
      );
      if (!imediatoFim) {
        geocodificarReverso(latFim, lngFim).then((nomeResolvido) => {
          if (!cancelado && !destinoEditadoRef.current && nomeResolvido) {
            setLocalDestino(nomeResolvido);
          }
        });
      }
    } else {
      setLocalDestino("");
    }

    return () => {
      cancelado = true;
    };
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

    const precisaGeoPartida = partidaEditada && Boolean(localPartida.trim());
    const precisaGeoDestino = destinoEditado && Boolean(localDestino.trim());

    if (precisaGeoPartida || precisaGeoDestino) {
      setGeocodificando(true);
      try {
        if (precisaGeoPartida) {
          const geoIni = await geocodificarEndereco(localPartida);
          if (geoIni) {
            setPontoInicialLat(String(geoIni.latitude));
            setPontoInicialLng(String(geoIni.longitude));
          }
        } else if (partidaEditada && !localPartida.trim()) {
          setPontoInicialLat("");
          setPontoInicialLng("");
        }

        if (precisaGeoDestino) {
          const geoFim = await geocodificarEndereco(localDestino);
          if (geoFim) {
            setPontoFinalLat(String(geoFim.latitude));
            setPontoFinalLng(String(geoFim.longitude));
          }
        } else if (destinoEditado && !localDestino.trim()) {
          setPontoFinalLat("");
          setPontoFinalLng("");
        }
      } finally {
        setGeocodificando(false);
      }
    } else {
      if (partidaEditada && !localPartida.trim()) {
        setPontoInicialLat("");
        setPontoInicialLng("");
      }
      if (destinoEditado && !localDestino.trim()) {
        setPontoFinalLat("");
        setPontoFinalLng("");
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
  const temCoordsIni =
    pontoInicialLat !== "" &&
    pontoInicialLng !== "" &&
    !Number.isNaN(Number(pontoInicialLat));
  const temCoordsFim =
    pontoFinalLat !== "" &&
    pontoFinalLng !== "" &&
    !Number.isNaN(Number(pontoFinalLat));

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
                onChangeText={(v) => {
                  setLocalPartida(v);
                  setPartidaEditada(true);
                  partidaEditadaRef.current = true;
                }}
                left={<TextInput.Icon icon="map-marker-outline" />}
                style={styles.input}
              />
              {temCoordsIni && !partidaEditada ? (
                <View style={styles.coordsSavedBadge}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={15}
                    color={colors.success}
                  />
                  <Text variant="labelSmall" style={styles.coordsSavedText}>
                    Ponto inicial salvo no mapa (
                    {Number(pontoInicialLat).toFixed(4)},{" "}
                    {Number(pontoInicialLng).toFixed(4)})
                  </Text>
                </View>
              ) : null}

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
                      setPontoInicialLat(String(b.latitude));
                      setPontoInicialLng(String(b.longitude));
                      setPartidaEditada(false);
                      partidaEditadaRef.current = true;
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
                onChangeText={(v) => {
                  setLocalDestino(v);
                  setDestinoEditado(true);
                  destinoEditadoRef.current = true;
                }}
                left={<TextInput.Icon icon="flag-checkered" />}
                style={styles.input}
              />
              {temCoordsFim && !destinoEditado ? (
                <View style={styles.coordsSavedBadge}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={15}
                    color={colors.success}
                  />
                  <Text variant="labelSmall" style={styles.coordsSavedText}>
                    Ponto final salvo no mapa (
                    {Number(pontoFinalLat).toFixed(4)},{" "}
                    {Number(pontoFinalLng).toFixed(4)})
                  </Text>
                </View>
              ) : null}

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
                      setPontoFinalLat(String(b.latitude));
                      setPontoFinalLng(String(b.longitude));
                      setDestinoEditado(false);
                      destinoEditadoRef.current = true;
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
                        (temCoordsIni
                          ? `GPS (${Number(pontoInicialLat).toFixed(4)}, ${Number(pontoInicialLng).toFixed(4)})`
                          : "Automático pelos alunos")}
                    </Text>
                    <Text variant="bodyMedium" style={styles.reviewValue}>
                      Destino:{" "}
                      {localDestino.trim() ||
                        (temCoordsFim
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
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  coordsSavedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  coordsSavedText: {
    color: "#166534",
    fontWeight: "700",
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
