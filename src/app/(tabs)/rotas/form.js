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
} from "react-native-paper";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { colors } from "../../../theme";
import {
  useRotaDetailQuery,
  useCreateRotaMutation,
  useUpdateRotaMutation,
} from "../../../hooks/useRotas";
import { BAIRROS_RECIFE, geocodificarEndereco } from "../../../utils/geocoding";

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

  const handleSubmit = async () => {
    setFormError("");

    if (!nome.trim()) {
      setFormError("O nome da rota é obrigatório.");
      return;
    }

    let latIni = parseOptionalFloat(pontoInicialLat);
    let lngIni = parseOptionalFloat(pontoInicialLng);
    let latFim = parseOptionalFloat(pontoFinalLat);
    let lngFim = parseOptionalFloat(pontoFinalLng);
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
            latIni = geoIni.latitude;
            lngIni = geoIni.longitude;
          }
        }
        if (localDestino.trim()) {
          const geoFim = await geocodificarEndereco(localDestino);
          if (geoFim) {
            latFim = geoFim.latitude;
            lngFim = geoFim.longitude;
          }
        }
      } finally {
        setGeocodificando(false);
      }
    }

    const payload = {
      nome: nome.trim(),
      turno,
      pontoInicialLat: Number.isNaN(latIni) ? null : latIni,
      pontoInicialLng: Number.isNaN(lngIni) ? null : lngIni,
      pontoFinalLat: Number.isNaN(latFim) ? null : latFim,
      pontoFinalLng: Number.isNaN(lngFim) ? null : lngFim,
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
            3. Locais de Partida e Destino (Opcional)
          </Text>
          <Text variant="bodySmall" style={styles.coordHelper}>
            Informe o bairro ou endereço para posicionar a rota no mapa automaticamente.
          </Text>

          <TextInput
            label="Local ou Bairro de Partida"
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
                onPress={() => setLocalPartida(b.label)}
                style={styles.bairroChip}
              >
                {b.label}
              </Chip>
            ))}
          </ScrollView>

          <TextInput
            label="Local ou Escola de Destino"
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
                onPress={() => setLocalDestino(b.label)}
                style={styles.bairroChip}
              >
                {b.label}
              </Chip>
            ))}
          </ScrollView>

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
  bairrosRow: {
    gap: 6,
    marginBottom: 12,
  },
  bairroChip: {
    backgroundColor: colors.surfaceVariant,
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
