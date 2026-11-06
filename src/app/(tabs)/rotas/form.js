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
  Surface,
  SegmentedButtons,
  HelperText,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { colors } from "../../../theme";
import {
  useRotaDetailQuery,
  useCreateRotaMutation,
  useUpdateRotaMutation,
} from "../../../hooks/useRotas";

/**
 * ============================================================================
 * FORMULÁRIO DE CRIAR / EDITAR ROTA ESCOLAR (Implementado por: Sammuel)
 * ============================================================================
 * Requisitos atendidos:
 * - Criação (`POST /rotas`) e Edição (`PUT /rotas/:id`) com TanStack Query Mutation
 * - Inputs para:
 *   - `nome` (obrigatório)
 *   - `turno` (`SegmentedButtons`: `MANHA` / `TARDE`)
 *   - `pontoInicialLat`, `pontoInicialLng`, `pontoFinalLat`, `pontoFinalLng`
 *   - `distanciaTotalKm` (km) e `tempoEstimadoMin` (min)
 */
export default function RotaFormScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const rotaId = params.id ? String(params.id) : null;
  const isEditMode = Boolean(rotaId);

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
  const [distanciaTotalKm, setDistanciaTotalKm] = useState(
    params.distanciaTotalKm ? String(params.distanciaTotalKm) : "",
  );
  const [tempoEstimadoMin, setTempoEstimadoMin] = useState(
    params.tempoEstimadoMin ? String(params.tempoEstimadoMin) : "",
  );
  const [formError, setFormError] = useState("");

  // Caso o usuário abra a tela passando apenas o `id` (ex.: vindo da Home), busca os detalhes da API
  const { data: rotaDetalhe, isLoading: loadingDetalhe } = useRotaDetailQuery(
    isEditMode && !params.nome ? rotaId : null,
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
        rotaDetalhe.pontoInicialLat !== null &&
          rotaDetalhe.pontoInicialLat !== undefined
          ? String(rotaDetalhe.pontoInicialLat)
          : "",
      );
      setPontoInicialLng(
        rotaDetalhe.pontoInicialLng !== null &&
          rotaDetalhe.pontoInicialLng !== undefined
          ? String(rotaDetalhe.pontoInicialLng)
          : "",
      );
      setPontoFinalLat(
        rotaDetalhe.pontoFinalLat !== null &&
          rotaDetalhe.pontoFinalLat !== undefined
          ? String(rotaDetalhe.pontoFinalLat)
          : "",
      );
      setPontoFinalLng(
        rotaDetalhe.pontoFinalLng !== null &&
          rotaDetalhe.pontoFinalLng !== undefined
          ? String(rotaDetalhe.pontoFinalLng)
          : "",
      );
      setDistanciaTotalKm(
        rotaDetalhe.distanciaTotalKm !== null &&
          rotaDetalhe.distanciaTotalKm !== undefined
          ? String(rotaDetalhe.distanciaTotalKm)
          : "",
      );
      setTempoEstimadoMin(
        rotaDetalhe.tempoEstimadoMin !== null &&
          rotaDetalhe.tempoEstimadoMin !== undefined
          ? String(rotaDetalhe.tempoEstimadoMin)
          : "",
      );
    }
  }, [rotaDetalhe]);

  const createMutation = useCreateRotaMutation();
  const updateMutation = useUpdateRotaMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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

  const handleSubmit = async () => {
    setFormError("");

    if (!nome.trim()) {
      setFormError("O nome da rota é obrigatório.");
      return;
    }

    const latIni = parseOptionalFloat(pontoInicialLat);
    const lngIni = parseOptionalFloat(pontoInicialLng);
    const latFim = parseOptionalFloat(pontoFinalLat);
    const lngFim = parseOptionalFloat(pontoFinalLng);
    const distKm = parseOptionalFloat(distanciaTotalKm);
    const tempoMin = parseOptionalInt(tempoEstimadoMin);

    if (
      Number.isNaN(latIni) ||
      Number.isNaN(lngIni) ||
      Number.isNaN(latFim) ||
      Number.isNaN(lngFim)
    ) {
      setFormError(
        "As coordenadas de latitude/longitude informadas devem ser números válidos (ex.: -8.1189).",
      );
      return;
    }

    if (Number.isNaN(distKm) || (distKm !== null && distKm < 0)) {
      setFormError("Informe uma distância em km válida (ex.: 12.5).");
      return;
    }

    if (Number.isNaN(tempoMin) || (tempoMin !== null && tempoMin < 0)) {
      setFormError("Informe um tempo estimado em minutos válido (ex.: 45).");
      return;
    }

    const payload = {
      nome: nome.trim(),
      turno,
      pontoInicialLat: latIni,
      pontoInicialLng: lngIni,
      pontoFinalLat: latFim,
      pontoFinalLng: lngFim,
      distanciaTotalKm: distKm,
      tempoEstimadoMin: tempoMin,
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

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card Principal do Formulário */}
        <Surface style={styles.formCard} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            1. Identificação e Turno da Viagem
          </Text>

          <TextInput
            label="Nome da Rota Escolar *"
            placeholder="Ex.: Rota Boa Viagem → Colégios Derby"
            mode="outlined"
            value={nome}
            onChangeText={setNome}
            left={<TextInput.Icon icon="routes" />}
            style={styles.input}
          />

          <Text variant="labelLarge" style={styles.fieldLabel}>
            Turno da Rota *
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

          <Divider style={styles.divider} />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            2. Distância e Tempo Estimado
          </Text>

          <View style={styles.row}>
            <TextInput
              label="Distância Total (km)"
              placeholder="Ex.: 12.5"
              mode="outlined"
              keyboardType="decimal-pad"
              value={distanciaTotalKm}
              onChangeText={setDistanciaTotalKm}
              left={<TextInput.Icon icon="map-marker-distance" />}
              style={[styles.input, styles.halfInput]}
            />

            <TextInput
              label="Tempo Estimado (min)"
              placeholder="Ex.: 45"
              mode="outlined"
              keyboardType="numeric"
              value={tempoEstimadoMin}
              onChangeText={setTempoEstimadoMin}
              left={<TextInput.Icon icon="clock-outline" />}
              style={[styles.input, styles.halfInput]}
            />
          </View>

          <Divider style={styles.divider} />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            3. Coordenadas GPS (Ponto Inicial e Final)
          </Text>
          <Text variant="bodySmall" style={styles.coordHelper}>
            Opcional: coordenadas geográficas de partida e chegada em Recife.
          </Text>

          <Text variant="labelMedium" style={styles.subLabel}>
            Ponto Inicial (Origem)
          </Text>
          <View style={styles.row}>
            <TextInput
              label="Latitude Inicial"
              placeholder="-8.1189"
              mode="outlined"
              keyboardType="numbers-and-punctuation"
              value={pontoInicialLat}
              onChangeText={setPontoInicialLat}
              style={[styles.input, styles.halfInput]}
              dense
            />
            <TextInput
              label="Longitude Inicial"
              placeholder="-34.8988"
              mode="outlined"
              keyboardType="numbers-and-punctuation"
              value={pontoInicialLng}
              onChangeText={setPontoInicialLng}
              style={[styles.input, styles.halfInput]}
              dense
            />
          </View>

          <Text variant="labelMedium" style={styles.subLabel}>
            Ponto Final (Destino / Escola)
          </Text>
          <View style={styles.row}>
            <TextInput
              label="Latitude Final"
              placeholder="-8.0567"
              mode="outlined"
              keyboardType="numbers-and-punctuation"
              value={pontoFinalLat}
              onChangeText={setPontoFinalLat}
              style={[styles.input, styles.halfInput]}
              dense
            />
            <TextInput
              label="Longitude Final"
              placeholder="-34.8999"
              mode="outlined"
              keyboardType="numbers-and-punctuation"
              value={pontoFinalLng}
              onChangeText={setPontoFinalLng}
              style={[styles.input, styles.halfInput]}
              dense
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
              onPress={() => router.back()}
              disabled={isSubmitting}
              style={styles.cancelBtn}
              textColor={colors.secondary}
            >
              Cancelar
            </Button>

            <Button
              mode="contained"
              icon={isEditMode ? "content-save-edit" : "check-bold"}
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitBtn}
              buttonColor={colors.primary}
              textColor={colors.secondary}
            >
              {isEditMode ? "Salvar Alterações" : "Criar Rota"}
            </Button>
          </View>
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
    marginBottom: 12,
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
    marginBottom: 8,
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
  coordHelper: {
    color: colors.textSecondary,
    marginTop: -6,
    marginBottom: 12,
  },
  subLabel: {
    color: colors.secondary,
    fontWeight: "700",
    marginBottom: 6,
  },
  errorText: {
    fontWeight: "700",
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    borderRadius: 10,
    borderColor: colors.border,
  },
  submitBtn: {
    borderRadius: 10,
    flex: 1,
  },
});
