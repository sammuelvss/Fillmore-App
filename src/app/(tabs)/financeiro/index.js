import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
} from "react-native";
import {
  ActivityIndicator,
  Banner,
  Button,
  Chip,
  Dialog,
  Divider,
  FAB,
  IconButton,
  Portal,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

import { colors } from "../../../theme";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import { useAlunosQuery } from "../../../hooks/useAlunos";
import { useRotasQuery } from "../../../hooks/useRotas";
import {
  useMensalidadesQuery,
  usePendenciasResponsavelQuery,
  useCreateMensalidadeMutation,
  useRegistrarPagamentoMutation,
  useDeleteMensalidadeMutation,
  useDispararCobrancaMutation,
} from "../../../hooks/useMensalidades";
import EmptyState from "../../../components/EmptyState";

const STATUS_CONFIG = {
  PAGO: {
    label: "PAGO",
    bg: "#DCFCE7",
    color: "#166534",
    icon: "check-circle",
  },
  PENDENTE: {
    label: "PENDENTE",
    bg: "#FEF3C7",
    color: "#92400E",
    icon: "clock-outline",
  },
  ATRASADO: {
    label: "ATRASADO",
    bg: "#FEE2E2",
    color: "#991B1B",
    icon: "alert-circle",
  },
};

function formatarMoeda(valor) {
  const numero = Number(valor || 0);
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataBR(dataIso) {
  if (!dataIso) return "--/--/----";
  const apenasData = String(dataIso).split("T")[0];
  const partes = apenasData.split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return apenasData;
}

function calcularDiasAtraso(dataVencimento, status) {
  if (status === "PAGO" || !dataVencimento) return 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const apenasData = String(dataVencimento).split("T")[0];
  const [ano, mes, dia] = apenasData.split("-").map(Number);
  if (!ano || !mes || !dia) return 0;

  const vencimento = new Date(ano, mes - 1, dia);
  vencimento.setHours(0, 0, 0, 0);

  const diffMs = hoje.getTime() - vencimento.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDias > 0 ? diffDias : 0;
}

function converterDataParaISO(dataTexto) {
  const limpo = dataTexto.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) return limpo;
  const matchBR = limpo.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (matchBR) {
    return `${matchBR[3]}-${matchBR[2]}-${matchBR[1]}`;
  }
  return null;
}

export default function FinanceiroScreen() {
  const user = useAuthStore((state) => state.user);
  const alunoAtivo = useAppStore((state) => state.alunoAtivo);
  const setAlunoAtivo = useAppStore((state) => state.setAlunoAtivo);
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  const isMotorista = user?.tipo === "MOTORISTA" || !user?.tipo;
  const isResponsavel = user?.tipo === "RESPONSAVEL";
  const motoristaId = user?.motorista?.id;
  const responsavelId =
    user?.responsavel?.id || (isResponsavel ? user?.id : null);

  const {
    data: alunosRaw,
    isLoading: loadingAlunosRaw,
    refetch: refetchAlunos,
  } = useAlunosQuery();

  const {
    data: rotasRaw,
    isLoading: loadingRotas,
    refetch: refetchRotas,
  } = useRotasQuery({ enabled: isMotorista });

  const todosAlunos = useMemo(() => {
    if (Array.isArray(alunosRaw)) return alunosRaw;
    return alunosRaw?.alunos || alunosRaw?.data || [];
  }, [alunosRaw]);

  const minhasRotas = useMemo(() => {
    const lista = Array.isArray(rotasRaw)
      ? rotasRaw
      : rotasRaw?.rotas || rotasRaw?.data || [];
    if (!motoristaId) return lista;
    return lista.filter(
      (r) => !r.motoristaId || String(r.motoristaId) === String(motoristaId)
    );
  }, [rotasRaw, motoristaId]);

  // Filtra apenas alunos vinculados às rotas do motorista logado (evita 403 Forbidden)
  const alunos = useMemo(() => {
    if (!isMotorista) return todosAlunos;

    const minhasRotasIds = new Set(minhasRotas.map((r) => String(r.id)));
    const alunosIdsDasMinhasRotas = new Set();

    minhasRotas.forEach((rota) => {
      const vinculados = [
        ...(Array.isArray(rota.alunosIda) ? rota.alunosIda : []),
        ...(Array.isArray(rota.alunosVolta) ? rota.alunosVolta : []),
        ...(Array.isArray(rota.alunos) ? rota.alunos : []),
      ];
      vinculados.forEach((a) => {
        if (a?.id) alunosIdsDasMinhasRotas.add(String(a.id));
      });
    });

    return todosAlunos.filter((aluno) => {
      if (alunosIdsDasMinhasRotas.has(String(aluno.id))) return true;

      const rotaIdaId = aluno.rotaIdaId ?? aluno.rotaIda?.id;
      const rotaVoltaId = aluno.rotaVoltaId ?? aluno.rotaVolta?.id;

      if (rotaIdaId && minhasRotasIds.has(String(rotaIdaId))) return true;
      if (rotaVoltaId && minhasRotasIds.has(String(rotaVoltaId))) return true;

      if (motoristaId) {
        const motIda =
          aluno.rotaIda?.motoristaId ?? aluno.rotaIda?.motorista?.id;
        const motVolta =
          aluno.rotaVolta?.motoristaId ?? aluno.rotaVolta?.motorista?.id;

        if (motIda && String(motIda) === String(motoristaId)) return true;
        if (motVolta && String(motVolta) === String(motoristaId)) return true;
      }

      return false;
    });
  }, [isMotorista, todosAlunos, minhasRotas, motoristaId]);

  const loadingAlunos = loadingAlunosRaw || (isMotorista && loadingRotas);

  useEffect(() => {
    if (loadingAlunos) return;

    if (alunos.length > 0) {
      const aindaExiste = alunos.some(
        (a) => String(a.id) === String(alunoAtivo?.id)
      );
      if (!alunoAtivo || !aindaExiste) {
        setAlunoAtivo(alunos[0]);
      }
    } else if (alunoAtivo) {
      setAlunoAtivo(null);
    }
  }, [alunos, alunoAtivo, loadingAlunos, setAlunoAtivo]);

  const {
    data: mensalidades = [],
    isLoading: loadingMensalidades,
    isRefetching: refetchingMensalidades,
    isError: isErrorMensalidades,
    error: errorMensalidades,
    refetch: refetchMensalidades,
  } = useMensalidadesQuery(alunoAtivo?.id);

  const {
    data: pendenciasData,
    isLoading: loadingPendencias,
    refetch: refetchPendencias,
  } = usePendenciasResponsavelQuery(isResponsavel ? responsavelId : null);

  const criarMutation = useCreateMensalidadeMutation();
  const registrarPagamentoMutation = useRegistrarPagamentoMutation();
  const excluirMutation = useDeleteMensalidadeMutation();
  const cobrarMutation = useDispararCobrancaMutation();

  const hoje = new Date();
  const [modalCriarVisivel, setModalCriarVisivel] = useState(false);
  const [mesReferencia, setMesReferencia] = useState(
    String(hoje.getMonth() + 1).padStart(2, "0")
  );
  const [anoReferencia, setAnoReferencia] = useState(
    String(hoje.getFullYear())
  );
  const [valor, setValor] = useState("250.00");
  const [dataVencimento, setDataVencimento] = useState(
    `${String(alunoAtivo?.diaVencimentoMensalidade || 10).padStart(
      2,
      "0"
    )}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`
  );
  const [statusNovo, setStatusNovo] = useState("PENDENTE");
  const [mensalidadeParaExcluir, setMensalidadeParaExcluir] = useState(null);

  useEffect(() => {
    if (alunoAtivo?.diaVencimentoMensalidade) {
      const dia = String(alunoAtivo.diaVencimentoMensalidade).padStart(2, "0");
      const mes = String(hoje.getMonth() + 1).padStart(2, "0");
      setDataVencimento(`${dia}/${mes}/${hoje.getFullYear()}`);
    }
  }, [alunoAtivo]);

  const handleRefresh = () => {
    refetchAlunos();
    if (isMotorista) refetchRotas();
    if (alunoAtivo?.id) refetchMensalidades();
    if (isResponsavel && responsavelId) refetchPendencias();
  };

  const handleCopiarChavePix = async (chavePix) => {
    if (!chavePix) {
      showSnackbar("Chave Pix não cadastrada pelo motorista.", "error");
      return;
    }
    await Clipboard.setStringAsync(String(chavePix));
    showSnackbar("Chave Pix copiada para a área de transferência!", "success");
  };

  const handleCriarMensalidade = async () => {
    if (!alunoAtivo?.id) return;

    const mesNum = Number(mesReferencia);
    const anoNum = Number(anoReferencia);
    const valorNum = Number(String(valor).replace(",", "."));
    const dataIso = converterDataParaISO(dataVencimento);

    if (!mesNum || mesNum < 1 || mesNum > 12) {
      showSnackbar("Informe um mês válido (1 a 12).", "error");
      return;
    }
    if (!anoNum || anoNum < 2020) {
      showSnackbar("Informe um ano válido.", "error");
      return;
    }
    if (!valorNum || valorNum <= 0) {
      showSnackbar("Informe um valor maior que zero.", "error");
      return;
    }
    if (!dataIso) {
      showSnackbar("Data inválida. Use o formato DD/MM/AAAA.", "error");
      return;
    }

    try {
      await criarMutation.mutateAsync({
        alunoId: alunoAtivo.id,
        data: {
          mesReferencia: mesNum,
          anoReferencia: anoNum,
          valor: valorNum,
          dataVencimento: dataIso,
          status: statusNovo,
          ...(statusNovo === "PAGO"
            ? { dataPagamento: new Date().toISOString() }
            : {}),
        },
      });
      setModalCriarVisivel(false);
      showSnackbar("Mensalidade lançada com sucesso!", "success");
    } catch (error) {
      showSnackbar(
        error.friendlyMessage || "Erro ao criar mensalidade.",
        "error"
      );
    }
  };

  const handleMarcarComoPago = async (mensalidade) => {
    try {
      await registrarPagamentoMutation.mutateAsync({
        alunoId: alunoAtivo.id,
        mensalidadeId: mensalidade.id,
        dataPagamento: new Date().toISOString(),
      });
      showSnackbar("Pagamento registrado com sucesso!", "success");
    } catch (error) {
      showSnackbar(
        error.friendlyMessage || "Erro ao registrar pagamento.",
        "error"
      );
    }
  };

  const handleCobrarEmUmClique = async (mensalidade) => {
    try {
      await cobrarMutation.mutateAsync({
        alunoId: alunoAtivo.id,
        mensalidadeId: mensalidade.id,
      });
      showSnackbar(
        "Cobrança enviada ao responsável via notificação!",
        "success"
      );
    } catch (error) {
      showSnackbar(
        error.friendlyMessage || "Erro ao enviar cobrança.",
        "error"
      );
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!mensalidadeParaExcluir || !alunoAtivo?.id) return;
    try {
      await excluirMutation.mutateAsync({
        alunoId: alunoAtivo.id,
        mensalidadeId: mensalidadeParaExcluir.id,
      });
      setMensalidadeParaExcluir(null);
      showSnackbar("Mensalidade excluída.", "success");
    } catch (error) {
      showSnackbar(
        error.friendlyMessage || "Erro ao excluir mensalidade.",
        "error"
      );
    }
  };

  const faturasPendentesResp = pendenciasData?.faturas || [];
  const totalPendenteResp =
    pendenciasData?.totalPendente ??
    faturasPendentesResp.reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const motoristaDoAluno =
    mensalidades[0]?.aluno?.rotaIda?.motorista ||
    mensalidades[0]?.aluno?.rotaVolta?.motorista ||
    alunoAtivo?.rotaIda?.motorista ||
    alunoAtivo?.rotaVolta?.motorista ||
    user?.motorista;

  const chavePixMotorista =
    faturasPendentesResp[0]?.pagamentoPix?.chavePix ||
    motoristaDoAluno?.chavePix ||
    "";

  const titularPixMotorista =
    faturasPendentesResp[0]?.pagamentoPix?.titularPix ||
    motoristaDoAluno?.titularPix ||
    user?.nome ||
    "Motorista Escolar";

  return (
    <View style={styles.container}>
      {isErrorMensalidades && alunoAtivo ? (
        <Banner
          visible
          icon="cloud-alert"
          actions={[
            { label: "Tentar Novamente", onPress: refetchMensalidades },
          ]}
          style={styles.errorBanner}
        >
          {errorMensalidades?.friendlyMessage ||
            "Erro ao carregar as mensalidades do aluno."}
        </Banner>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refetchingMensalidades}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Hero Card Financeiro & Pix */}
        <Surface style={styles.heroCard} elevation={2}>
          <View style={styles.heroHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text variant="labelLarge" style={styles.heroEyebrow}>
                {isResponsavel ? "EXTRATO DE PENDÊNCIAS" : "FINANCEIRO & PIX"}
              </Text>
              <Text variant="headlineMedium" style={styles.heroValorTotal}>
                {isResponsavel
                  ? loadingPendencias
                    ? "Carregando..."
                    : formatarMoeda(totalPendenteResp)
                  : "Mensalidades"}
              </Text>
              <Text variant="bodySmall" style={styles.heroSubInfo}>
                {isResponsavel
                  ? `${
                      pendenciasData?.quantidadeFaturas ??
                      faturasPendentesResp.length
                    } fatura(s) em aberto`
                  : "Controle por aluno, baixa manual e cobrança em 1 clique"}
              </Text>
            </View>

            <Chip
              icon="qrcode"
              style={styles.pixBadge}
              textStyle={styles.pixBadgeText}
            >
              PIX
            </Chip>
          </View>

          {isResponsavel && faturasPendentesResp.length > 0 && (
            <View style={styles.pendenciasLista}>
              <Divider style={styles.heroDivider} />
              {faturasPendentesResp.map((fat) => {
                const dias =
                  fat.diasEmAtraso ??
                  calcularDiasAtraso(fat.dataVencimento, fat.status);
                return (
                  <View key={fat.id} style={styles.pendenciaItemRow}>
                    <Text variant="bodySmall" style={styles.pendenciaTexto}>
                      • {fat.alunoNome || fat.aluno?.nome || "Aluno"} — Ref.{" "}
                      {String(fat.mesReferencia).padStart(2, "0")}/
                      {fat.anoReferencia} ({formatarMoeda(fat.valor)})
                    </Text>
                    {dias > 0 && (
                      <Text style={styles.diasAtrasoBadge}>
                        {dias} dia(s) em atraso
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <Divider style={styles.heroDivider} />

          <Text variant="bodySmall" style={styles.pixTitular}>
            Titular:{" "}
            <Text style={{ fontWeight: "700", color: "#FFFFFF" }}>
              {titularPixMotorista}
            </Text>
          </Text>
          <Text variant="bodySmall" style={styles.pixChaveTexto}>
            Chave Pix: {chavePixMotorista || "Não cadastrada"}
          </Text>

          <Button
            mode="contained"
            icon="content-copy"
            buttonColor={colors.primary}
            textColor={colors.secondary}
            style={styles.pixButton}
            labelStyle={{ fontWeight: "800" }}
            onPress={() => handleCopiarChavePix(chavePixMotorista)}
          >
            Copiar Chave Pix
          </Button>
        </Surface>

        {/* Seletor de Aluno (Somente alunos vinculados às rotas do motorista) */}
        <Surface style={styles.selectorBox} elevation={1}>
          <View style={styles.selectorHeader}>
            <MaterialCommunityIcons
              name="account-school-outline"
              size={20}
              color={colors.secondary}
            />
            <Text variant="titleSmall" style={styles.selectorTitle}>
              Aluno Selecionado ({alunos.length})
            </Text>
          </View>

          {loadingAlunos ? (
            <ActivityIndicator
              style={{ marginVertical: 12 }}
              color={colors.primary}
            />
          ) : alunos.length === 0 ? (
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {isMotorista
                ? "Nenhum aluno vinculado às suas rotas. Vincule um aluno na aba Alunos para gerenciar mensalidades."
                : "Nenhum aluno vinculado ao seu perfil de responsável."}
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.alunosChipsRow}
            >
              {alunos.map((aluno) => {
                const selecionado =
                  String(alunoAtivo?.id) === String(aluno.id);
                return (
                  <Chip
                    key={aluno.id}
                    selected={selecionado}
                    compact
                    onPress={() => setAlunoAtivo(aluno)}
                    style={[
                      styles.alunoChip,
                      selecionado && styles.alunoChipSelected,
                    ]}
                    textStyle={[
                      styles.alunoChipText,
                      selecionado && styles.alunoChipTextSelected,
                    ]}
                  >
                    {aluno.nome}
                  </Chip>
                );
              })}
            </ScrollView>
          )}
        </Surface>

        {/* Cabeçalho do Histórico do Aluno */}
        {alunoAtivo ? (
          <View style={styles.mensalidadesHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Faturas — {alunoAtivo.nome}
            </Text>
            <Text variant="bodySmall" style={styles.escolaSubtitle}>
              {alunoAtivo.escola}
            </Text>
          </View>
        ) : null}

        {/* Listagem de Mensalidades ou EmptyState */}
        {loadingAlunos || loadingMensalidades ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Carregando mensalidades...
            </Text>
          </View>
        ) : !alunoAtivo ? (
          <EmptyState
            icon="account-school-outline"
            title="Nenhum aluno vinculado às suas rotas"
            description={
              isMotorista
                ? "Vá até a aba Alunos, vincule um aluno a uma das suas rotas e volte aqui para lançar mensalidades."
                : "Nenhum aluno foi encontrado no seu cadastro de responsável."
            }
          />
        ) : mensalidades.length === 0 ? (
          <EmptyState
            icon="receipt-text-outline"
            title="Nenhuma mensalidade registrada"
            description={`Ainda não existem faturas lançadas para ${alunoAtivo.nome}.`}
            actionLabel={isMotorista ? "Lançar Primeira Fatura" : undefined}
            onAction={
              isMotorista ? () => setModalCriarVisivel(true) : undefined
            }
          />
        ) : (
          mensalidades.map((item) => {
            const diasAtraso = calcularDiasAtraso(
              item.dataVencimento,
              item.status
            );
            const statusNormalizado =
              item.status === "PAGO"
                ? "PAGO"
                : diasAtraso > 0 || item.status === "ATRASADO"
                ? "ATRASADO"
                : "PENDENTE";

            const cfg = STATUS_CONFIG[statusNormalizado];

            const pixFatura =
              item.aluno?.rotaIda?.motorista?.chavePix ||
              item.aluno?.rotaVolta?.motorista?.chavePix ||
              chavePixMotorista;

            return (
              <Surface key={item.id} style={styles.faturaCard} elevation={1}>
                <View style={styles.faturaTopRow}>
                  <View>
                    <Text variant="titleMedium" style={styles.faturaRef}>
                      Ref. {String(item.mesReferencia).padStart(2, "0")}/
                      {item.anoReferencia}
                    </Text>
                    <Text variant="headlineSmall" style={styles.faturaValor}>
                      {formatarMoeda(item.valor)}
                    </Text>
                  </View>

                  <View style={styles.statusActionsRow}>
                    <Chip
                      icon={cfg.icon}
                      style={{ backgroundColor: cfg.bg }}
                      textStyle={{
                        color: cfg.color,
                        fontWeight: "800",
                        fontSize: 11,
                      }}
                    >
                      {cfg.label}
                    </Chip>

                    {isMotorista && (
                      <IconButton
                        icon="delete-outline"
                        iconColor={colors.error}
                        size={20}
                        onPress={() => setMensalidadeParaExcluir(item)}
                      />
                    )}
                  </View>
                </View>

                <View style={styles.faturaDatasRow}>
                  <Text variant="bodySmall" style={styles.dataTexto}>
                    Vencimento: {formatarDataBR(item.dataVencimento)}
                  </Text>

                  {statusNormalizado === "PAGO" && item.dataPagamento && (
                    <Text
                      variant="bodySmall"
                      style={[styles.dataTexto, { color: "#166534" }]}
                    >
                      Pago em: {formatarDataBR(item.dataPagamento)}
                    </Text>
                  )}

                  {diasAtraso > 0 && statusNormalizado !== "PAGO" && (
                    <Text style={styles.diasAtrasoBadge}>
                      {diasAtraso} dia(s) em atraso
                    </Text>
                  )}
                </View>

                {isMotorista && statusNormalizado !== "PAGO" && (
                  <View style={styles.cardButtonsRow}>
                    <Button
                      mode="outlined"
                      icon="check"
                      textColor="#166534"
                      style={[styles.actionBtn, { borderColor: "#166534" }]}
                      loading={registrarPagamentoMutation.isPending}
                      onPress={() => handleMarcarComoPago(item)}
                    >
                      Dar Baixa
                    </Button>

                    <Button
                      mode="contained"
                      icon="bell-ring-outline"
                      buttonColor={colors.primary}
                      textColor={colors.secondary}
                      style={styles.actionBtn}
                      labelStyle={{ fontWeight: "800" }}
                      loading={cobrarMutation.isPending}
                      onPress={() => handleCobrarEmUmClique(item)}
                    >
                      Cobrar 1 Clique
                    </Button>
                  </View>
                )}

                {isResponsavel && statusNormalizado !== "PAGO" && (
                  <Button
                    mode="contained-tonal"
                    icon="content-copy"
                    buttonColor={colors.primaryLight}
                    textColor={colors.secondary}
                    style={{ marginTop: 12, borderRadius: 10 }}
                    onPress={() => handleCopiarChavePix(pixFatura)}
                  >
                    Copiar Chave Pix para Pagar
                  </Button>
                )}
              </Surface>
            );
          })
        )}
      </ScrollView>

      {/* Botão Flutuante (FAB) */}
      {isMotorista && alunoAtivo ? (
        <FAB
          icon="cash-plus"
          label="Nova Fatura"
          style={styles.fab}
          color={colors.secondary}
          onPress={() => setModalCriarVisivel(true)}
        />
      ) : null}

      {/* Dialog: Lançar Mensalidade */}
      <Portal>
        <Dialog
          visible={modalCriarVisivel}
          onDismiss={() => setModalCriarVisivel(false)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="cash-plus" color={colors.primaryDark} />
          <Dialog.Title style={styles.dialogTitle}>
            Lançar Mensalidade
          </Dialog.Title>
          <Dialog.Content>
            <Text
              variant="bodySmall"
              style={{
                marginBottom: 12,
                textAlign: "center",
                color: colors.text,
              }}
            >
              Aluno:{" "}
              <Text style={styles.boldText}>{alunoAtivo?.nome}</Text>
            </Text>

            <View style={styles.rowInputs}>
              <TextInput
                label="Mês (1-12)"
                value={mesReferencia}
                onChangeText={setMesReferencia}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, { flex: 1, marginRight: 8 }]}
              />
              <TextInput
                label="Ano"
                value={anoReferencia}
                onChangeText={setAnoReferencia}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, { flex: 1 }]}
              />
            </View>

            <TextInput
              label="Valor (R$)"
              value={valor}
              onChangeText={setValor}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Vencimento (DD/MM/AAAA)"
              value={dataVencimento}
              onChangeText={setDataVencimento}
              placeholder="10/11/2026"
              mode="outlined"
              style={styles.input}
            />

            <Text
              variant="labelMedium"
              style={{ marginTop: 6, marginBottom: 6, color: colors.secondary }}
            >
              Status Inicial
            </Text>
            <SegmentedButtons
              value={statusNovo}
              onValueChange={setStatusNovo}
              buttons={[
                { value: "PENDENTE", label: "Pendente" },
                { value: "PAGO", label: "Pago" },
                { value: "ATRASADO", label: "Atrasado" },
              ]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setModalCriarVisivel(false)}
              textColor={colors.textSecondary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.primary}
              textColor={colors.secondary}
              loading={criarMutation.isPending}
              onPress={handleCriarMensalidade}
            >
              Salvar
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Dialog: Confirmar Exclusão */}
        <Dialog
          visible={Boolean(mensalidadeParaExcluir)}
          onDismiss={() => setMensalidadeParaExcluir(null)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="alert-circle-outline" color={colors.error} />
          <Dialog.Title style={styles.dialogTitle}>
            Excluir Mensalidade?
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Deseja realmente remover a fatura de{" "}
              <Text style={styles.boldText}>
                {mensalidadeParaExcluir
                  ? `${String(mensalidadeParaExcluir.mesReferencia).padStart(
                      2,
                      "0"
                    )}/${mensalidadeParaExcluir.anoReferencia}`
                  : ""}
              </Text>
              ? Esta ação não poderá ser desfeita.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setMensalidadeParaExcluir(null)}
              disabled={excluirMutation.isPending}
              textColor={colors.textSecondary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.error}
              textColor="#FFFFFF"
              loading={excluirMutation.isPending}
              disabled={excluirMutation.isPending}
              onPress={handleConfirmarExclusao}
            >
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorBanner: {
    backgroundColor: colors.errorLight,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 96,
  },
  heroCard: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  heroEyebrow: {
    color: colors.primaryAccent,
    letterSpacing: 0.8,
    fontWeight: "800",
  },
  heroValorTotal: {
    color: "#FFFFFF",
    fontWeight: "800",
    marginTop: 2,
  },
  heroSubInfo: {
    color: "#94A3B8",
    marginTop: 2,
  },
  pixBadge: {
    backgroundColor: colors.primary,
    height: 28,
  },
  pixBadgeText: {
    color: colors.secondary,
    fontWeight: "800",
    fontSize: 11,
  },
  heroDivider: {
    backgroundColor: "#334155",
    marginVertical: 12,
  },
  pendenciasLista: {
    marginTop: 4,
  },
  pendenciaItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  pendenciaTexto: {
    color: "#F1F5F9",
  },
  pixTitular: {
    color: "#CBD5E1",
  },
  pixChaveTexto: {
    color: "#94A3B8",
    marginTop: 2,
    marginBottom: 12,
  },
  pixButton: {
    borderRadius: 10,
  },
  selectorBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  selectorTitle: {
    fontWeight: "700",
    color: colors.secondary,
  },
  alunosChipsRow: {
    gap: 8,
  },
  alunoChip: {
    backgroundColor: colors.surfaceVariant,
  },
  alunoChipSelected: {
    backgroundColor: colors.primaryLight,
  },
  alunoChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  alunoChipTextSelected: {
    color: colors.secondary,
    fontWeight: "700",
  },
  mensalidadesHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "800",
    color: colors.secondary,
  },
  escolaSubtitle: {
    color: colors.textSecondary,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  faturaCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faturaTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  faturaRef: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
  faturaValor: {
    color: colors.secondary,
    fontWeight: "800",
  },
  statusActionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  faturaDatasRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 6,
  },
  dataTexto: {
    color: colors.textSecondary,
  },
  diasAtrasoBadge: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
  },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 18,
  },
  dialogTitle: {
    textAlign: "center",
    fontWeight: "800",
    color: colors.secondary,
  },
  dialogText: {
    color: colors.text,
    textAlign: "center",
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "700",
    color: colors.secondary,
  },
  rowInputs: {
    flexDirection: "row",
  },
  input: {
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
});