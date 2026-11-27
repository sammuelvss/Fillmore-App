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
  Dialog,
  Divider,
  HelperText,
  Portal,
  ProgressBar,
  SegmentedButtons,
  Surface,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { colors } from "../../../theme";
import { MODALIDADES } from "../../../constants";
import { mascaraTelefone } from "../../../utils/format";
import {
  validarDiaVencimento,
  validarEmail,
  validarTelefone,
} from "../../../utils/validators";
import { signUpRequest } from "../../../api/authApi";
import { useAppStore } from "../../../store/useAppStore";
import {
  ALUNOS_KEYS,
  useAlunoDetailQuery,
  useCreateAlunoMutation,
  useResponsaveisQuery,
  useUpdateAlunoMutation,
} from "../../../hooks/useAlunos";
import { geocodificarEndereco } from "../../../utils/geocoding";

/**
 * Formulário de Aluno em 4 Etapas — Fase 4
 * Etapa 1: Aluno e Escola (`nome`, `escola`)
 * Etapa 2: Responsável (selecionar existente ou "Cadastrar novo responsável" em modal curto) e Modalidade
 * Etapa 3: Endereços de Embarque e Desembarque (com switch "Mesmo endereço para ida e volta" e contato de entrega)
 * Etapa 4: Dia de vencimento (1..31), revisão e botão primário "Salvar aluno" (52dp, amarelo com texto escuro)
 */
export default function AlunoFormScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  const alunoId = params.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : String(params.id)
    : null;
  const isEditMode = Boolean(alunoId);

  const [etapa, setEtapa] = useState(1);

  const { data: alunoDetalhe, isLoading: loadingDetalhe } =
    useAlunoDetailQuery(alunoId);
  const { data: responsaveis = [], isLoading: loadingResponsaveis } =
    useResponsaveisQuery();

  const createMutation = useCreateAlunoMutation();
  const updateMutation = useUpdateAlunoMutation();
  const [geocodificando, setGeocodificando] = useState(false);
  const isSubmitting =
    geocodificando || createMutation.isPending || updateMutation.isPending;

  const [nome, setNome] = useState("");
  const [escola, setEscola] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
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
  const [diaVencimento, setDiaVencimento] = useState("10");

  const [formError, setFormError] = useState("");

  // Modal para cadastrar novo responsável diretamente pelo motorista
  const [novoRespModalVisible, setNovoRespModalVisible] = useState(false);
  const [novoRespNome, setNovoRespNome] = useState("");
  const [novoRespTelefone, setNovoRespTelefone] = useState("");
  const [novoRespEmail, setNovoRespEmail] = useState("");
  const [novoRespErro, setNovoRespErro] = useState("");
  const [criandoResp, setCriandoResp] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Editar Aluno" : "Novo Aluno",
    });
  }, [isEditMode, navigation]);

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

    setNomeContatoEntrega(alunoDetalhe.nomeContatoEntrega || "");
    setTelefoneContatoEntrega(
      alunoDetalhe.telefoneContatoEntrega
        ? mascaraTelefone(alunoDetalhe.telefoneContatoEntrega)
        : "",
    );
    setDiaVencimento(
      alunoDetalhe.diaVencimentoMensalidade != null
        ? String(alunoDetalhe.diaVencimentoMensalidade)
        : "10",
    );
  }, [alunoDetalhe]);

  const parseOptionalFloat = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const parsed = Number.parseFloat(String(val).replace(",", ".").trim());
    return Number.isNaN(parsed) ? NaN : parsed;
  };

  const handleToggleMesmoEndereco = (value) => {
    setMesmoEndereco(value);
    if (value) {
      setEnderecoDesembarque(enderecoEmbarque);
      setLatitudeDesembarque(latitudeEmbarque);
      setLongitudeDesembarque(longitudeEmbarque);
    }
  };

  const handleCriarNovoResponsavel = async () => {
    setNovoRespErro("");
    if (!novoRespNome.trim() || novoRespNome.trim().length < 2) {
      setNovoRespErro("Informe o nome do responsável.");
      return;
    }
    const erroTel = validarTelefone(novoRespTelefone);
    if (erroTel) {
      setNovoRespErro(erroTel);
      return;
    }
    const emailFinal =
      novoRespEmail.trim().toLowerCase() ||
      `resp.${Date.now()}@fillmore.app`;
    if (novoRespEmail.trim()) {
      const erroMail = validarEmail(emailFinal);
      if (erroMail) {
        setNovoRespErro(erroMail);
        return;
      }
    }

    setCriandoResp(true);
    try {
      const criado = await signUpRequest({
        nome: novoRespNome.trim(),
        username: novoRespNome.trim(),
        email: emailFinal,
        telefone: novoRespTelefone.trim(),
        senha: `Resp@${String(Date.now()).slice(-6)}`,
        tipo: "RESPONSAVEL",
      });

      await queryClient.invalidateQueries({
        queryKey: ALUNOS_KEYS.responsaveis,
      });

      const novoId = criado?.responsavel?.id || criado?.user?.responsavel?.id;
      if (novoId) {
        setResponsavelId(novoId);
      }
      if (!nomeContatoEntrega.trim()) {
        setNomeContatoEntrega(novoRespNome.trim());
      }
      if (!telefoneContatoEntrega.trim()) {
        setTelefoneContatoEntrega(mascaraTelefone(novoRespTelefone));
      }

      setNovoRespModalVisible(false);
      setNovoRespNome("");
      setNovoRespTelefone("");
      setNovoRespEmail("");
      showSnackbar("Responsável cadastrado e selecionado!", "success");
    } catch (err) {
      setNovoRespErro(
        err?.friendlyMessage ||
          "Não foi possível cadastrar o responsável. Verifique se o e-mail já existe.",
      );
    } finally {
      setCriandoResp(false);
    }
  };

  const handleNextStep1 = () => {
    setFormError("");
    if (!nome.trim() || nome.trim().length < 2) {
      setFormError("Informe o nome completo do aluno.");
      return;
    }
    if (!escola.trim() || escola.trim().length < 2) {
      setFormError("Informe o nome da escola do aluno.");
      return;
    }
    setEtapa(2);
  };

  const handleNextStep2 = () => {
    setFormError("");
    if (!responsavelId.trim()) {
      setFormError(
        "Selecione um responsável da lista ou toque em 'Cadastrar novo responsável'.",
      );
      return;
    }
    setEtapa(3);
  };

  const handleNextStep3 = () => {
    setFormError("");
    if (!enderecoEmbarque.trim() && !enderecoDesembarque.trim()) {
      setFormError("Informe ao menos o endereço de embarque do aluno.");
      return;
    }
    if (telefoneContatoEntrega.trim()) {
      const erroTel = validarTelefone(telefoneContatoEntrega);
      if (erroTel) {
        setFormError(erroTel);
        return;
      }
    }
    setEtapa(4);
  };

  const handleSubmit = async () => {
    setFormError("");

    const erroDia = validarDiaVencimento(diaVencimento, { obrigatorio: true });
    if (erroDia) {
      setFormError(erroDia);
      return;
    }

    const diaVencParsed = Number.parseInt(diaVencimento.trim(), 10);

    const endEmbFinal = enderecoEmbarque.trim() || null;
    const endDesFinal = mesmoEndereco
      ? endEmbFinal
      : enderecoDesembarque.trim() || null;

    let latEmb = endEmbFinal ? parseOptionalFloat(latitudeEmbarque) : null;
    let lngEmb = endEmbFinal ? parseOptionalFloat(longitudeEmbarque) : null;
    let latDes = endDesFinal
      ? parseOptionalFloat(
          mesmoEndereco ? latitudeEmbarque : latitudeDesembarque,
        )
      : null;
    let lngDes = endDesFinal
      ? parseOptionalFloat(
          mesmoEndereco ? longitudeEmbarque : longitudeDesembarque,
        )
      : null;

    const embMudou =
      !isEditMode || endEmbFinal !== (alunoDetalhe?.enderecoEmbarque || null);
    const desMudou =
      !isEditMode ||
      endDesFinal !== (alunoDetalhe?.enderecoDesembarque || null);

    setGeocodificando(true);
    try {
      if (endEmbFinal && (embMudou || latEmb === null || lngEmb === null)) {
        const geoEmb = await geocodificarEndereco(endEmbFinal);
        latEmb = geoEmb?.latitude ?? null;
        lngEmb = geoEmb?.longitude ?? null;
      }

      if (mesmoEndereco) {
        latDes = latEmb;
        lngDes = lngEmb;
      } else if (
        endDesFinal &&
        (desMudou || latDes === null || lngDes === null)
      ) {
        const geoDes = await geocodificarEndereco(endDesFinal);
        latDes = geoDes?.latitude ?? null;
        lngDes = geoDes?.longitude ?? null;
      }
    } finally {
      setGeocodificando(false);
    }

    const payload = {
      nome: nome.trim(),
      escola: escola.trim(),
      responsavelId: responsavelId.trim(),
      modalidade,
      enderecoEmbarque: endEmbFinal,
      latitudeEmbarque: Number.isNaN(latEmb) ? null : latEmb,
      longitudeEmbarque: Number.isNaN(lngEmb) ? null : lngEmb,
      enderecoDesembarque: endDesFinal,
      latitudeDesembarque: Number.isNaN(latDes) ? null : latDes,
      longitudeDesembarque: Number.isNaN(lngDes) ? null : lngDes,
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

  const responsavelSelecionado = responsaveis.find(
    (r) => r.responsavel?.id === responsavelId,
  );
  const modInfo = MODALIDADES[modalidade] || MODALIDADES.IDA_E_VOLTA;

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
              ETAPA {etapa} DE 4
            </Text>
            <Text variant="bodySmall" style={styles.stepSubtitle}>
              {etapa === 1
                ? "Aluno e Escola"
                : etapa === 2
                  ? "Responsável e Modalidade"
                  : etapa === 3
                    ? "Endereços de Embarque e Desembarque"
                    : "Vencimento e Revisão"}
            </Text>
          </View>
          <ProgressBar
            progress={etapa / 4}
            color={colors.primary}
            style={styles.progressBar}
          />
        </Surface>

        <Surface style={styles.formCard} elevation={1}>
          {etapa === 1 ? (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                1. Aluno e Escola
              </Text>
              <Text variant="bodySmall" style={styles.helperCopy}>
                Informe o nome completo da criança e o colégio onde estuda.
              </Text>

              <TextInput
                label="Nome Completo do Aluno *"
                placeholder="Ex.: Lucas Ferreira"
                mode="outlined"
                value={nome}
                onChangeText={(v) => {
                  setNome(v);
                  if (formError) setFormError("");
                }}
                left={<TextInput.Icon icon="account-school" />}
                style={styles.input}
              />

              <TextInput
                label="Escola *"
                placeholder="Ex.: Colégio Santa Maria / Damas"
                mode="outlined"
                value={escola}
                onChangeText={(v) => {
                  setEscola(v);
                  if (formError) setFormError("");
                }}
                left={<TextInput.Icon icon="school-outline" />}
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
                2. Responsável e Modalidade
              </Text>
              <Text variant="bodySmall" style={styles.helperCopy}>
                Selecione o responsável pelo aluno (para avisos e cobranças via
                WhatsApp) ou cadastre um novo agora mesmo.
              </Text>

              {loadingResponsaveis ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginVertical: 12 }}
                />
              ) : (
                <View style={styles.respSection}>
                  {responsaveis.length > 0 ? (
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
                            onPress={() => {
                              setResponsavelId(rId);
                              if (!nomeContatoEntrega) {
                                setNomeContatoEntrega(respUser.nome || "");
                              }
                              if (!telefoneContatoEntrega && respUser.telefone) {
                                setTelefoneContatoEntrega(
                                  mascaraTelefone(respUser.telefone),
                                );
                              }
                              if (formError) setFormError("");
                            }}
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
                  ) : (
                    <Text variant="bodySmall" style={styles.helperCopy}>
                      Nenhum responsável cadastrado ainda.
                    </Text>
                  )}

                  <Button
                    mode="contained-tonal"
                    icon="account-plus-outline"
                    buttonColor={colors.primaryLight}
                    textColor={colors.text}
                    style={styles.newRespBtn}
                    contentStyle={styles.secondaryBtnContent}
                    onPress={() => setNovoRespModalVisible(true)}
                  >
                    Cadastrar novo responsável
                  </Button>
                </View>
              )}

              <Divider style={styles.divider} />

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
                  style={styles.backBtn}
                  contentStyle={styles.secondaryBtnContent}
                  textColor={colors.secondary}
                >
                  Voltar
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
                  onPress={handleNextStep2}
                >
                  Continuar
                </Button>
              </View>
            </>
          ) : null}

          {etapa === 3 ? (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                3. Endereços de Embarque e Desembarque
              </Text>
              <Text variant="bodySmall" style={styles.helperCopy}>
                Permite configurar endereços independentes para buscar pela
                manhã e entregar à tarde (guarda compartilhada).
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
                label="Endereço de Embarque (Manhã) *"
                placeholder="Ex.: Av. Boa Viagem, 1500 - Boa Viagem"
                mode="outlined"
                value={enderecoEmbarque}
                onChangeText={(txt) => {
                  setEnderecoEmbarque(txt);
                  if (mesmoEndereco) setEnderecoDesembarque(txt);
                  if (formError) setFormError("");
                }}
                left={<TextInput.Icon icon="home-export-outline" />}
                style={styles.input}
              />

              {!mesmoEndereco ? (
                <TextInput
                  label="Endereço de Desembarque (Tarde)"
                  placeholder="Ex.: Rua da Hora, 310 - Espinheiro"
                  mode="outlined"
                  value={enderecoDesembarque}
                  onChangeText={setEnderecoDesembarque}
                  left={<TextInput.Icon icon="home-import-outline" />}
                  style={styles.input}
                />
              ) : null}

              <Divider style={styles.divider} />

              <Text variant="labelLarge" style={styles.fieldLabel}>
                Contato na Entrega (opcional)
              </Text>
              <TextInput
                label="Nome de quem recebe / contato"
                placeholder="Ex.: Mãe Mariana / Portaria"
                mode="outlined"
                value={nomeContatoEntrega}
                onChangeText={setNomeContatoEntrega}
                left={<TextInput.Icon icon="account-check-outline" />}
                style={styles.input}
              />

              <TextInput
                label="WhatsApp / Telefone de contato"
                placeholder="(81) 99999-1234"
                mode="outlined"
                keyboardType="phone-pad"
                value={telefoneContatoEntrega}
                onChangeText={(v) =>
                  setTelefoneContatoEntrega(mascaraTelefone(v))
                }
                left={<TextInput.Icon icon="whatsapp" />}
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
                  icon="arrow-left"
                  onPress={() => setEtapa(2)}
                  style={styles.backBtn}
                  contentStyle={styles.secondaryBtnContent}
                  textColor={colors.secondary}
                >
                  Voltar
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
                  onPress={handleNextStep3}
                >
                  Revisar
                </Button>
              </View>
            </>
          ) : null}

          {etapa === 4 ? (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                4. Vencimento e Revisão
              </Text>
              <Text variant="bodySmall" style={styles.helperCopy}>
                Defina o dia de vencimento da mensalidade (usado ao gerar
                faturas do mês em lote) e revise os dados.
              </Text>

              <TextInput
                label="Dia de Vencimento da Mensalidade (1 a 31) *"
                placeholder="Ex.: 10"
                mode="outlined"
                keyboardType="number-pad"
                value={diaVencimento}
                onChangeText={(v) => {
                  setDiaVencimento(v.replace(/\D/g, "").slice(0, 2));
                  if (formError) setFormError("");
                }}
                left={<TextInput.Icon icon="calendar-today" />}
                style={styles.input}
              />

              <View style={styles.reviewBox}>
                <View style={styles.reviewRow}>
                  <MaterialCommunityIcons
                    name="account-school"
                    size={20}
                    color={colors.primaryDark}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="labelSmall" style={styles.reviewLabel}>
                      ALUNO & ESCOLA
                    </Text>
                    <Text variant="titleMedium" style={styles.reviewValue}>
                      {nome.trim()} • {escola.trim()}
                    </Text>
                  </View>
                </View>

                <Divider style={styles.reviewDivider} />

                <View style={styles.reviewRow}>
                  <MaterialCommunityIcons
                    name="account-tie"
                    size={20}
                    color={colors.secondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="labelSmall" style={styles.reviewLabel}>
                      RESPONSÁVEL & MODALIDADE
                    </Text>
                    <Text variant="bodyMedium" style={styles.reviewValue}>
                      {responsavelSelecionado?.nome || "Selecionado"} •{" "}
                      {modInfo.label}
                    </Text>
                  </View>
                </View>

                <Divider style={styles.reviewDivider} />

                <View style={styles.reviewRow}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={20}
                    color={colors.success}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="labelSmall" style={styles.reviewLabel}>
                      ENDEREÇOS
                    </Text>
                    <Text variant="bodySmall" style={styles.reviewValue}>
                      Embarque: {enderecoEmbarque.trim() || "—"}
                    </Text>
                    <Text variant="bodySmall" style={styles.reviewValue}>
                      Desembarque:{" "}
                      {(mesmoEndereco
                        ? enderecoEmbarque.trim()
                        : enderecoDesembarque.trim()) || "—"}
                    </Text>
                  </View>
                </View>
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
                  onPress={() => setEtapa(3)}
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
                  Salvar aluno
                </Button>
              </View>
            </>
          ) : null}
        </Surface>
      </ScrollView>

      {/* Modal: Cadastrar Novo Responsável sem sair do wizard */}
      <Portal>
        <Dialog
          visible={novoRespModalVisible}
          onDismiss={() => !criandoResp && setNovoRespModalVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            Novo Responsável
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodySmall" style={styles.helperCopy}>
              Cadastre rapidamente os dados de contato do pai, mãe ou
              responsável para avisos no WhatsApp.
            </Text>

            <TextInput
              label="Nome do Responsável *"
              placeholder="Ex.: Carlos Silva"
              mode="outlined"
              dense
              value={novoRespNome}
              onChangeText={setNovoRespNome}
              style={styles.input}
            />

            <TextInput
              label="WhatsApp / Telefone *"
              placeholder="(81) 99999-1234"
              mode="outlined"
              dense
              keyboardType="phone-pad"
              value={novoRespTelefone}
              onChangeText={(v) => setNovoRespTelefone(mascaraTelefone(v))}
              style={styles.input}
            />

            <TextInput
              label="E-mail (opcional)"
              placeholder="carlos@email.com"
              mode="outlined"
              dense
              keyboardType="email-address"
              autoCapitalize="none"
              value={novoRespEmail}
              onChangeText={setNovoRespEmail}
              style={styles.input}
            />

            {novoRespErro ? (
              <HelperText type="error" visible>
                {novoRespErro}
              </HelperText>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setNovoRespModalVisible(false)}
              disabled={criandoResp}
              textColor={colors.textSecondary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.primary}
              textColor={colors.text}
              loading={criandoResp}
              disabled={criandoResp}
              onPress={handleCriarNovoResponsavel}
            >
              Salvar responsável
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  respSection: {
    gap: 10,
  },
  respChipsRow: {
    gap: 8,
    paddingBottom: 4,
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
  newRespBtn: {
    borderRadius: 12,
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
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 18,
  },
  dialogTitle: {
    fontWeight: "800",
    color: colors.secondary,
  },
});
