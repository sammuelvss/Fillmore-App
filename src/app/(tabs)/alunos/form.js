import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  Divider,
  HelperText,
  SegmentedButtons,
  Surface,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../theme";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  useAlunoDetailQuery,
  useCreateAlunoMutation,
  useResponsaveisQuery,
  useUpdateAlunoMutation,
} from "../../../hooks/useAlunos";

const RECIFE_PRESETS = [
  { label: "Boa Viagem", lat: "-8.1189", lng: "-34.8988" },
  { label: "Derby", lat: "-8.0567", lng: "-34.8999" },
  { label: "Casa Forte", lat: "-8.0342", lng: "-34.9226" },
  { label: "Espinheiro", lat: "-8.0439", lng: "-34.8939" },
];

/**
 * ============================================================================
 * FORMULÁRIO DE ALUNO — CRUD & GUARDA COMPARTILHADA (Implementado por: Joao)
 * ============================================================================
 * Contempla:
 * - Identificação (`nome`, `escola`, `modalidade`, `diaVencimentoMensalidade`)
 * - Vínculo de `responsavelId` (automático se RESPONSAVEL; lista de responsáveis ou UUID se MOTORISTA)
 * - Guarda Compartilhada: `enderecoEmbarque` e `enderecoDesembarque` independentes (+ GPS opcional)
 * - Contato de entrega (`nomeContatoEntrega`, `telefoneContatoEntrega`)
 */
export default function AlunoFormScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const alunoId = params.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : String(params.id)
    : null;
  const isEditMode = Boolean(alunoId);

  const user = useAuthStore((state) => state.user);
  const isResponsavel = user?.tipo === "RESPONSAVEL";
  const loggedResponsavelId = user?.responsavel?.id || "";

  const { data: alunoDetalhe, isLoading: loadingDetalhe } =
    useAlunoDetailQuery(alunoId);
  const { data: responsaveis = [], isLoading: loadingResponsaveis } =
    useResponsaveisQuery({ enabled: !isResponsavel });

  const createMutation = useCreateAlunoMutation();
  const updateMutation = useUpdateAlunoMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [nome, setNome] = useState("");
  const [escola, setEscola] = useState("");
  const [responsavelId, setResponsavelId] = useState(
    isResponsavel ? loggedResponsavelId : "",
  );
  const [modalidade, setModalidade] = useState("IDA_E_VOLTA");
  const [mesmoEndereco, setMesmoEndereco] = useState(false);

  const [enderecoEmbarque, setEnderecoEmbarque] = useState("");
  const [latitudeEmbarque, setLatitudeEmbarque] = useState("");
  const [longitudeEmbarque, setLongitudeEmbarque] = useState("");

  const [enderecoDesembarque, setEnderecoDesembarque] = useState("");
  const [latitudeDesembarque, setLatitudeDesembarque] = useState("");
  const [longitudeDesembarque, setLongitudeDesembarque] = useState("");

  const [nomeContatoEntrega, setNomeContatoEntrega] = useState("");
  const [telefoneContatoEntrega, setTelefoneContatoEntrega] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("");

  const [mostrarManualUuid, setMostrarManualUuid] = useState(false);
  const [mostrarGps, setMostrarGps] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Editar Aluno" : "Cadastrar Aluno",
    });
  }, [isEditMode, navigation]);

  useEffect(() => {
    if (!isEditMode && isResponsavel && loggedResponsavelId) {
      setResponsavelId(loggedResponsavelId);
    }
  }, [isEditMode, isResponsavel, loggedResponsavelId]);

  useEffect(() => {
    if (!alunoDetalhe) return;

    setNome(alunoDetalhe.nome || "");
    setEscola(alunoDetalhe.escola || "");
    setResponsavelId(alunoDetalhe.responsavelId || "");
    setModalidade(alunoDetalhe.modalidade || "IDA_E_VOLTA");

    const emb = alunoDetalhe.enderecoEmbarque || "";
    const des = alunoDetalhe.enderecoDesembarque || "";
    setEnderecoEmbarque(emb);
    setEnderecoDesembarque(des);
    setMesmoEndereco(Boolean(emb) && emb === des);

    setLatitudeEmbarque(
      alunoDetalhe.latitudeEmbarque != null
        ? String(alunoDetalhe.latitudeEmbarque)
        : "",
    );
    setLongitudeEmbarque(
      alunoDetalhe.longitudeEmbarque != null
        ? String(alunoDetalhe.longitudeEmbarque)
        : "",
    );
    setLatitudeDesembarque(
      alunoDetalhe.latitudeDesembarque != null
        ? String(alunoDetalhe.latitudeDesembarque)
        : "",
    );
    setLongitudeDesembarque(
      alunoDetalhe.longitudeDesembarque != null
        ? String(alunoDetalhe.longitudeDesembarque)
        : "",
    );

    if (
      alunoDetalhe.latitudeEmbarque != null ||
      alunoDetalhe.latitudeDesembarque != null
    ) {
      setMostrarGps(true);
    }

    setNomeContatoEntrega(alunoDetalhe.nomeContatoEntrega || "");
    setTelefoneContatoEntrega(alunoDetalhe.telefoneContatoEntrega || "");
    setDiaVencimento(
      alunoDetalhe.diaVencimentoMensalidade != null
        ? String(alunoDetalhe.diaVencimentoMensalidade)
        : "",
    );
  }, [alunoDetalhe]);

  const parseOptionalFloat = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const parsed = Number.parseFloat(String(val).replace(",", ".").trim());
    return Number.isNaN(parsed) ? NaN : parsed;
  };

  const applyPreset = (target, preset) => {
    if (target === "embarque") {
      setLatitudeEmbarque(preset.lat);
      setLongitudeEmbarque(preset.lng);
      if (mesmoEndereco) {
        setLatitudeDesembarque(preset.lat);
        setLongitudeDesembarque(preset.lng);
      }
    } else {
      setLatitudeDesembarque(preset.lat);
      setLongitudeDesembarque(preset.lng);
    }
  };

  const handleToggleMesmoEndereco = (value) => {
    setMesmoEndereco(value);
    if (value) {
      setEnderecoDesembarque(enderecoEmbarque);
      setLatitudeDesembarque(latitudeEmbarque);
      setLongitudeDesembarque(longitudeEmbarque);
    }
  };

  const handleSubmit = async () => {
    setFormError("");

    if (!nome.trim()) {
      return setFormError("O nome do aluno é obrigatório.");
    }
    if (!escola.trim()) {
      return setFormError("O nome da escola é obrigatório.");
    }
    if (!responsavelId.trim()) {
      return setFormError(
        "Selecione um responsável legal ou informe o UUID do responsável.",
      );
    }

    let diaVencParsed = null;
    if (diaVencimento.trim()) {
      diaVencParsed = Number.parseInt(diaVencimento.trim(), 10);
      if (Number.isNaN(diaVencParsed) || diaVencParsed < 1 || diaVencParsed > 31) {
        return setFormError(
          "O dia de vencimento da mensalidade deve estar entre 1 e 31.",
        );
      }
    }

    const latEmb = parseOptionalFloat(latitudeEmbarque);
    const lngEmb = parseOptionalFloat(longitudeEmbarque);
    const latDes = parseOptionalFloat(
      mesmoEndereco ? latitudeEmbarque : latitudeDesembarque,
    );
    const lngDes = parseOptionalFloat(
      mesmoEndereco ? longitudeEmbarque : longitudeDesembarque,
    );

    if (
      Number.isNaN(latEmb) ||
      Number.isNaN(lngEmb) ||
      Number.isNaN(latDes) ||
      Number.isNaN(lngDes)
    ) {
      return setFormError(
        "As coordenadas de latitude/longitude informadas devem ser números válidos.",
      );
    }

    const endEmbFinal = enderecoEmbarque.trim() || null;
    const endDesFinal = mesmoEndereco
      ? endEmbFinal
      : enderecoDesembarque.trim() || null;

    const payload = {
      nome: nome.trim(),
      escola: escola.trim(),
      responsavelId: responsavelId.trim(),
      modalidade,
      enderecoEmbarque: endEmbFinal,
      latitudeEmbarque: latEmb,
      longitudeEmbarque: lngEmb,
      enderecoDesembarque: endDesFinal,
      latitudeDesembarque: latDes,
      longitudeDesembarque: lngDes,
      nomeContatoEntrega: nomeContatoEntrega.trim() || null,
      telefoneContatoEntrega: telefoneContatoEntrega.trim() || null,
      diaVencimentoMensalidade: diaVencParsed,
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: alunoId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      router.back();
    } catch (error) {
      setFormError(
        error.friendlyMessage || "Ocorreu um erro ao salvar os dados do aluno.",
      );
    }
  };

  if (loadingDetalhe) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Carregando dados do aluno...
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
        <Surface style={styles.formCard} elevation={1}>
          {/* 1. Identificação e Modalidade */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            1. Dados Escolares do Aluno
          </Text>

          <TextInput
            label="Nome Completo do Aluno *"
            placeholder="Ex.: Lucas Ferreira"
            mode="outlined"
            value={nome}
            onChangeText={setNome}
            left={<TextInput.Icon icon="account-school" />}
            style={styles.input}
          />

          <TextInput
            label="Escola *"
            placeholder="Ex.: Colégio Damas / Marista São Luís"
            mode="outlined"
            value={escola}
            onChangeText={setEscola}
            left={<TextInput.Icon icon="school-outline" />}
            style={styles.input}
          />

          <Text variant="labelLarge" style={styles.fieldLabel}>
            Modalidade Contratada *
          </Text>
          <SegmentedButtons
            value={modalidade}
            onValueChange={setModalidade}
            density="small"
            buttons={[
              { value: "IDA_E_VOLTA", label: "Ida e Volta" },
              { value: "APENAS_IDA", label: "Só Ida" },
              { value: "APENAS_VOLTA", label: "Só Volta" },
            ]}
            style={styles.segmented}
          />

          <TextInput
            label="Dia de Vencimento da Mensalidade (1 a 31)"
            placeholder="Ex.: 10"
            mode="outlined"
            keyboardType="numeric"
            value={diaVencimento}
            onChangeText={setDiaVencimento}
            left={<TextInput.Icon icon="calendar-today" />}
            style={styles.input}
          />

          <Divider style={styles.divider} />

          {/* 2. Responsável Legal */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            2. Responsável Legal
          </Text>

          {isResponsavel ? (
            <Surface style={styles.lockedRespBox} elevation={0}>
              <MaterialCommunityIcons
                name="shield-account"
                size={20}
                color={colors.secondary}
              />
              <View style={{ flex: 1 }}>
                <Text variant="labelLarge" style={styles.lockedRespName}>
                  {user?.nome || "Responsável Autenticado"}
                </Text>
                <Text variant="labelSmall" style={styles.lockedRespSub}>
                  Vínculo automático ao seu perfil de responsável
                </Text>
              </View>
            </Surface>
          ) : (
            <>
              {loadingResponsaveis ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={styles.smallLoader}
                />
              ) : responsaveis.length > 0 ? (
                <>
                  <Text variant="bodySmall" style={styles.helperCopy}>
                    Selecione um responsável cadastrado:
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.respChipsRow}
                  >
                    {responsaveis.map((respUser) => {
                      const rId = respUser.responsavel?.id;
                      const selected = responsavelId === rId;
                      return (
                        <Chip
                          key={rId}
                          selected={selected}
                          icon="account-tie"
                          onPress={() => setResponsavelId(rId)}
                          style={[
                            styles.respChip,
                            selected && styles.respChipSelected,
                          ]}
                          textStyle={
                            selected ? styles.respChipTextSelected : undefined
                          }
                        >
                          {respUser.nome}
                        </Chip>
                      );
                    })}
                  </ScrollView>
                </>
              ) : (
                <Text variant="bodySmall" style={styles.helperCopy}>
                  Nenhum usuário com perfil RESPONSAVEL encontrado. Informe o
                  UUID manualmente abaixo.
                </Text>
              )}

              <Button
                mode="text"
                compact
                icon={mostrarManualUuid ? "chevron-up" : "identifier"}
                onPress={() => setMostrarManualUuid(!mostrarManualUuid)}
                style={styles.toggleLink}
              >
                {mostrarManualUuid
                  ? "Ocultar campo manual de UUID"
                  : "Informar UUID do Responsável manualmente"}
              </Button>

              {(mostrarManualUuid || responsaveis.length === 0) && (
                <TextInput
                  label="ID do Responsável (UUID) *"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  mode="outlined"
                  autoCapitalize="none"
                  value={responsavelId}
                  onChangeText={setResponsavelId}
                  left={<TextInput.Icon icon="key-outline" />}
                  style={styles.input}
                  dense
                />
              )}
            </>
          )}

          <Divider style={styles.divider} />

          {/* 3. Guarda Compartilhada (Endereços Independentes) */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            3. Guarda Compartilhada (Embarque & Desembarque)
          </Text>
          <Text variant="bodySmall" style={styles.helperCopy}>
            Permite definir endereços distintos para buscar pela manhã e entregar
            à tarde (ex.: casa da mãe e casa do pai/avós).
          </Text>

          <View style={styles.switchRow}>
            <Text variant="bodyMedium" style={styles.switchLabel}>
              Mesmo endereço para ida e volta
            </Text>
            <Switch
              value={mesmoEndereco}
              onValueChange={handleToggleMesmoEndereco}
              color={colors.primary}
            />
          </View>

          <TextInput
            label="Endereço de Embarque (Casa 1)"
            placeholder="Ex.: Av. Boa Viagem, 1500 - Apto 402"
            mode="outlined"
            value={enderecoEmbarque}
            onChangeText={(txt) => {
              setEnderecoEmbarque(txt);
              if (mesmoEndereco) setEnderecoDesembarque(txt);
            }}
            left={<TextInput.Icon icon="home-export-outline" />}
            style={styles.input}
          />

          {!mesmoEndereco && (
            <TextInput
              label="Endereço de Desembarque (Casa 2 / Guarda)"
              placeholder="Ex.: Rua do Espinheiro, 410"
              mode="outlined"
              value={enderecoDesembarque}
              onChangeText={setEnderecoDesembarque}
              left={<TextInput.Icon icon="home-import-outline" />}
              style={styles.input}
            />
          )}

          <Button
            mode="text"
            compact
            icon={mostrarGps ? "chevron-up" : "crosshairs-gps"}
            onPress={() => setMostrarGps(!mostrarGps)}
            style={styles.toggleLink}
          >
            {mostrarGps
              ? "Ocultar coordenadas GPS"
              : "Adicionar coordenadas GPS (opcional para Rota Inteligente)"}
          </Button>

          {mostrarGps && (
            <View style={styles.gpsSection}>
              <Text variant="labelMedium" style={styles.subLabel}>
                Coordenadas de Embarque (Presets Recife):
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetRow}
              >
                {RECIFE_PRESETS.map((p) => (
                  <Chip
                    key={`emb-${p.label}`}
                    compact
                    onPress={() => applyPreset("embarque", p)}
                    style={styles.presetChip}
                  >
                    {p.label}
                  </Chip>
                ))}
              </ScrollView>
              <View style={styles.row}>
                <TextInput
                  label="Lat. Embarque"
                  placeholder="-8.1189"
                  mode="outlined"
                  keyboardType="numbers-and-punctuation"
                  value={latitudeEmbarque}
                  onChangeText={(v) => {
                    setLatitudeEmbarque(v);
                    if (mesmoEndereco) setLatitudeDesembarque(v);
                  }}
                  style={[styles.input, styles.halfInput]}
                  dense
                />
                <TextInput
                  label="Lng. Embarque"
                  placeholder="-34.8988"
                  mode="outlined"
                  keyboardType="numbers-and-punctuation"
                  value={longitudeEmbarque}
                  onChangeText={(v) => {
                    setLongitudeEmbarque(v);
                    if (mesmoEndereco) setLongitudeDesembarque(v);
                  }}
                  style={[styles.input, styles.halfInput]}
                  dense
                />
              </View>

              {!mesmoEndereco && (
                <>
                  <Text variant="labelMedium" style={styles.subLabel}>
                    Coordenadas de Desembarque (Presets Recife):
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetRow}
                  >
                    {RECIFE_PRESETS.map((p) => (
                      <Chip
                        key={`des-${p.label}`}
                        compact
                        onPress={() => applyPreset("desembarque", p)}
                        style={styles.presetChip}
                      >
                        {p.label}
                      </Chip>
                    ))}
                  </ScrollView>
                  <View style={styles.row}>
                    <TextInput
                      label="Lat. Desembarque"
                      placeholder="-8.0439"
                      mode="outlined"
                      keyboardType="numbers-and-punctuation"
                      value={latitudeDesembarque}
                      onChangeText={setLatitudeDesembarque}
                      style={[styles.input, styles.halfInput]}
                      dense
                    />
                    <TextInput
                      label="Lng. Desembarque"
                      placeholder="-34.8939"
                      mode="outlined"
                      keyboardType="numbers-and-punctuation"
                      value={longitudeDesembarque}
                      onChangeText={setLongitudeDesembarque}
                      style={[styles.input, styles.halfInput]}
                      dense
                    />
                  </View>
                </>
              )}
            </View>
          )}

          <Divider style={styles.divider} />

          {/* 4. Contato de Entrega */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            4. Contato Autorizado na Entrega
          </Text>

          <TextInput
            label="Nome do Contato de Entrega"
            placeholder="Ex.: Avó Maria / Porteiro Carlos"
            mode="outlined"
            value={nomeContatoEntrega}
            onChangeText={setNomeContatoEntrega}
            left={<TextInput.Icon icon="account-check-outline" />}
            style={styles.input}
          />

          <TextInput
            label="Telefone do Contato de Entrega"
            placeholder="Ex.: (81) 99999-1234"
            mode="outlined"
            keyboardType="phone-pad"
            value={telefoneContatoEntrega}
            onChangeText={setTelefoneContatoEntrega}
            left={<TextInput.Icon icon="phone-outline" />}
            style={styles.input}
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
              {isEditMode ? "Salvar Alterações" : "Cadastrar Aluno"}
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
    marginBottom: 10,
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
  helperCopy: {
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  smallLoader: {
    marginVertical: 8,
  },
  respChipsRow: {
    gap: 8,
    paddingBottom: 6,
  },
  respChip: {
    backgroundColor: colors.surfaceVariant,
  },
  respChipSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  respChipTextSelected: {
    fontWeight: "700",
    color: colors.secondary,
  },
  lockedRespBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceVariant,
    padding: 12,
    borderRadius: 12,
  },
  lockedRespName: {
    fontWeight: "700",
    color: colors.secondary,
  },
  lockedRespSub: {
    color: colors.textSecondary,
  },
  toggleLink: {
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  switchLabel: {
    color: colors.secondary,
    fontWeight: "600",
    flex: 1,
  },
  gpsSection: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subLabel: {
    color: colors.secondary,
    fontWeight: "700",
    marginBottom: 6,
  },
  presetRow: {
    gap: 6,
    marginBottom: 8,
  },
  presetChip: {
    backgroundColor: colors.primaryLight,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
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
