import React, { useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  Dialog,
  Divider,
  FAB,
  HelperText,
  IconButton,
  Portal,
  ProgressBar,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";

import { colors } from "../../../theme";
import {
  STATUS_MENSALIDADE,
  resolverStatusMensalidade,
} from "../../../constants";
import {
  dataBRParaISO,
  formatarDataBR,
  formatarMoeda,
  hojeLocal,
  mascaraDataBR,
  mascaraMoeda,
  moedaParaNumero,
} from "../../../utils/format";
import {
  validarDataBR,
  validarValorMonetario,
} from "../../../utils/validators";
import { abrirWhatsApp } from "../../../utils/whatsapp";
import { mensagemCobrancaPix } from "../../../utils/mensagens";
import { getMensalidadesDoAluno } from "../../../api/mensalidadesApi";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import { useAlunosQuery } from "../../../hooks/useAlunos";
import { useRotasQuery } from "../../../hooks/useRotas";
import {
  MENSALIDADES_KEYS,
  useCreateMensalidadeMutation,
  useDeleteMensalidadeMutation,
  useDispararCobrancaMutation,
  useRegistrarPagamentoMutation,
  useUpdateMensalidadeMutation,
} from "../../../hooks/useMensalidades";
import EmptyState from "../../../components/EmptyState";
import ErrorState from "../../../components/ErrorState";

const FILTROS_STATUS = [
  { value: "TODAS", label: "Todas" },
  { value: "PENDENTE", label: "Pendentes" },
  { value: "ATRASADO", label: "Atrasadas" },
  { value: "PAGO", label: "Pagas" },
];

const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const montarVencimentoMesISO = (ano, mes, diaPreferido) => {
  const ultimoDiaMes = new Date(ano, mes, 0).getDate();
  const diaSeguro = Math.min(
    Math.max(1, Number(diaPreferido) || 10),
    ultimoDiaMes,
  );
  return `${ano}-${String(mes).padStart(2, "0")}-${String(diaSeguro).padStart(2, "0")}`;
};

/**
 * Tela de Financeiro (Exclusiva para Motorista) — Fase 5
 * - Navegador de mês/ano ("< Novembro/2026 >" + "Ver todos os meses") para consultar o valor cobrado de cada mês
 * - Card de resumo financeiro no topo: Recebido, Pendente e Atrasado em R$ do período selecionado
 * - Filtros por status (Todas | Pendentes | Atrasadas | Pagas) e por aluno
 * - "Registrar pagamento" com "Desfazer" no Snackbar (reverte para PENDENTE)
 * - "Cobrar" dispara notificação na API e abre envio por WhatsApp com chave Pix pré-preenchida
 * - "Gerar faturas do mês" em lote apenas para alunos vinculados às rotas do motorista logado
 * - FAB "+" para lançar fatura avulsa
 */
export default function FinanceiroScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const alunoAtivo = useAppStore((state) => state.alunoAtivo);
  const setAlunoAtivo = useAppStore((state) => state.setAlunoAtivo);
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  const hojeIso = hojeLocal();
  const [anoAtualStr, mesAtualStr] = hojeIso.split("-");

  // Período selecionado para pular entre o valor cobrado de cada mês
  const [mesFiltro, setMesFiltro] = useState(Number(mesAtualStr));
  const [anoFiltro, setAnoFiltro] = useState(Number(anoAtualStr));
  const [verTodosMeses, setVerTodosMeses] = useState(false);

  const [filtroStatus, setFiltroStatus] = useState("TODAS");
  const [alunoFiltroId, setAlunoFiltroId] = useState("TODOS");

  const alunosQuery = useAlunosQuery();
  const {
    data: rotasRaw,
    isLoading: loadingRotas,
    refetch: refetchRotas,
  } = useRotasQuery();

  const todosAlunos = useMemo(
    () => (Array.isArray(alunosQuery.data) ? alunosQuery.data : []),
    [alunosQuery.data],
  );

  // Filtra estritamente alunos vinculados às rotas do motorista logado
  // (o back-end exige que o aluno esteja em uma rota do motorista para gerenciar mensalidades)
  const motoristaId = user?.motorista?.id;
  const alunos = useMemo(() => {
    const listaRotas = Array.isArray(rotasRaw) ? rotasRaw : [];
    const minhasRotas = motoristaId
      ? listaRotas.filter(
          (r) => !r.motoristaId || String(r.motoristaId) === String(motoristaId),
        )
      : listaRotas;

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
  }, [todosAlunos, rotasRaw, motoristaId]);

  const alunosSemRotaCount = Math.max(0, todosAlunos.length - alunos.length);

  // Carrega mensalidades de todos os alunos vinculados às rotas do motorista
  const mensalidadesQueries = useQueries({
    queries: alunos.map((aluno) => ({
      queryKey: MENSALIDADES_KEYS.porAluno(aluno.id),
      queryFn: async () => {
        const res = await getMensalidadesDoAluno(aluno.id);
        const lista = Array.isArray(res)
          ? res
          : res?.mensalidades || res?.data || [];
        return lista.map((m) => ({
          ...m,
          aluno: m.aluno || aluno,
          alunoId: m.alunoId || aluno.id,
        }));
      },
      enabled: Boolean(token && aluno.id),
      staleTime: 1000 * 30,
    })),
  });

  const isLoadingFaturas =
    alunosQuery.isLoading ||
    loadingRotas ||
    mensalidadesQueries.some((q) => q.isLoading && !q.data);
  const isRefetchingFaturas =
    alunosQuery.isRefetching ||
    mensalidadesQueries.some((q) => q.isRefetching);

  const todasMensalidades = useMemo(() => {
    const acumuladas = [];
    mensalidadesQueries.forEach((q, idx) => {
      const alunoRef = alunos[idx];
      if (Array.isArray(q.data)) {
        q.data.forEach((m) => {
          const { status, diasAtraso } = resolverStatusMensalidade(
            m,
            hojeIso,
          );
          acumuladas.push({
            ...m,
            aluno: m.aluno || alunoRef,
            alunoId: m.alunoId || alunoRef?.id,
            statusResolvido: status,
            diasAtraso,
          });
        });
      }
    });
    return acumuladas.sort((a, b) =>
      String(b.dataVencimento || "").localeCompare(
        String(a.dataVencimento || ""),
      ),
    );
  }, [mensalidadesQueries, alunos, hojeIso]);

  // Navegação rápida entre meses ("< Mês Anterior" | "Próximo Mês >")
  const handleMudarMes = (delta) => {
    setVerTodosMeses(false);
    let novoMes = mesFiltro + delta;
    let novoAno = anoFiltro;
    if (novoMes < 1) {
      novoMes = 12;
      novoAno -= 1;
    } else if (novoMes > 12) {
      novoMes = 1;
      novoAno += 1;
    }
    setMesFiltro(novoMes);
    setAnoFiltro(novoAno);
  };

  // Lista de meses que possuem faturas cadastradas para pulo rápido em 1 toque
  const mesesDisponiveis = useMemo(() => {
    const mapa = new Map();
    const chaveAtual = `${anoAtualStr}-${mesAtualStr}`;
    mapa.set(chaveAtual, {
      ano: Number(anoAtualStr),
      mes: Number(mesAtualStr),
      total: 0,
    });

    todasMensalidades.forEach((m) => {
      const anoM = Number(m.anoReferencia);
      const mesM = Number(m.mesReferencia);
      if (!anoM || !mesM) return;
      const chave = `${anoM}-${String(mesM).padStart(2, "0")}`;
      const atual = mapa.get(chave) || { ano: anoM, mes: mesM, total: 0 };
      atual.total += Number(m.valor || 0);
      mapa.set(chave, atual);
    });

    return Array.from(mapa.values()).sort((a, b) =>
      b.ano !== a.ano ? b.ano - a.ano : b.mes - a.mes,
    );
  }, [todasMensalidades, anoAtualStr, mesAtualStr]);

  // Resumo financeiro (Recebido, Pendente, Atrasado e Total Cobrado) do mês selecionado (ou todos)
  const resumoFinanceiro = useMemo(() => {
    let recebido = 0;
    let pendente = 0;
    let atrasado = 0;
    let qtdAtrasadas = 0;

    todasMensalidades.forEach((m) => {
      if (
        alunoFiltroId !== "TODOS" &&
        String(m.alunoId) !== String(alunoFiltroId)
      ) {
        return;
      }
      if (!verTodosMeses) {
        if (
          Number(m.mesReferencia) !== mesFiltro ||
          Number(m.anoReferencia) !== anoFiltro
        ) {
          return;
        }
      }
      const val = Number(m.valor || 0);
      if (m.statusResolvido === "PAGO") {
        recebido += val;
      } else if (m.statusResolvido === "ATRASADO") {
        atrasado += val;
        qtdAtrasadas += 1;
      } else {
        pendente += val;
      }
    });

    const totalCobrado = recebido + pendente + atrasado;
    return { recebido, pendente, atrasado, totalCobrado, qtdAtrasadas };
  }, [
    todasMensalidades,
    alunoFiltroId,
    verTodosMeses,
    mesFiltro,
    anoFiltro,
  ]);

  const faturasFiltradas = useMemo(() => {
    return todasMensalidades.filter((m) => {
      if (
        alunoFiltroId !== "TODOS" &&
        String(m.alunoId) !== String(alunoFiltroId)
      ) {
        return false;
      }
      if (!verTodosMeses) {
        if (
          Number(m.mesReferencia) !== mesFiltro ||
          Number(m.anoReferencia) !== anoFiltro
        ) {
          return false;
        }
      }
      if (filtroStatus !== "TODAS" && m.statusResolvido !== filtroStatus) {
        return false;
      }
      return true;
    });
  }, [
    todasMensalidades,
    alunoFiltroId,
    verTodosMeses,
    mesFiltro,
    anoFiltro,
    filtroStatus,
  ]);

  const criarMutation = useCreateMensalidadeMutation();
  const atualizarMutation = useUpdateMensalidadeMutation();
  const registrarPagamentoMutation = useRegistrarPagamentoMutation();
  const excluirMutation = useDeleteMensalidadeMutation();
  const cobrarMutation = useDispararCobrancaMutation();

  const [pagandoId, setPagandoId] = useState(null);
  const [cobrandoId, setCobrandoId] = useState(null);
  const [faturaParaExcluir, setFaturaParaExcluir] = useState(null);

  // Modal de fatura avulsa / edição
  const [modalAvulsaVisivel, setModalAvulsaVisivel] = useState(false);
  const [faturaEditando, setFaturaEditando] = useState(null);
  const [alunoAvulsoId, setAlunoAvulsoId] = useState("");
  const [mesRefAvulso, setMesRefAvulso] = useState(mesAtualStr);
  const [anoRefAvulso, setAnoRefAvulso] = useState(anoAtualStr);
  const [valorAvulso, setValorAvulso] = useState("250,00");
  const [vencimentoAvulsoBR, setVencimentoAvulsoBR] = useState("");
  const [erroAvulsa, setErroAvulsa] = useState("");

  // Modal de Geração de Faturas do Mês em Lote
  const [loteVisivel, setLoteVisivel] = useState(false);
  const [loteMes, setLoteMes] = useState(String(mesFiltro).padStart(2, "0"));
  const [loteAno, setLoteAno] = useState(String(anoFiltro));
  const [loteValorPadrao, setLoteValorPadrao] = useState("250,00");
  const [valoresPorAluno, setValoresPorAluno] = useState({});
  const [loteExecutando, setLoteExecutando] = useState(false);
  const [loteProgresso, setLoteProgresso] = useState({ atual: 0, total: 0 });
  const [loteResultado, setLoteResultado] = useState(null);

  const chavePixMotorista = user?.motorista?.chavePix || "";

  const handleRefreshAll = () => {
    alunosQuery.refetch();
    refetchRotas();
    mensalidadesQueries.forEach((q) => q.refetch());
  };

  const handleCopiarChavePix = async () => {
    if (!chavePixMotorista) {
      showSnackbar(
        "Cadastre sua chave Pix na tela de Perfil para copiá-la.",
        "info",
      );
      return;
    }
    await Clipboard.setStringAsync(String(chavePixMotorista));
    showSnackbar("Chave Pix copiada!", "success");
  };

  // Registrar pagamento com botão "Desfazer" no Snackbar
  const handleRegistrarPagamento = async (fatura) => {
    setPagandoId(fatura.id);
    try {
      await registrarPagamentoMutation.mutateAsync({
        alunoId: fatura.alunoId,
        mensalidadeId: fatura.id,
        dataPagamento: new Date().toISOString(),
      });

      showSnackbar(
        `Pagamento de ${fatura.aluno?.nome || "aluno"} registrado!`,
        "success",
        {
          label: "Desfazer",
          onPress: () => {
            atualizarMutation.mutate({
              alunoId: fatura.alunoId,
              mensalidadeId: fatura.id,
              data: { status: "PENDENTE", dataPagamento: null },
            });
          },
        },
      );
    } catch (error) {
      showSnackbar(
        error?.friendlyMessage || "Não foi possível registrar o pagamento.",
        "error",
      );
    } finally {
      setPagandoId(null);
    }
  };

  // Cobrar: dispara notificação na API + abre WhatsApp com mensagem Pix pré-preenchida
  const handleCobrar = async (fatura) => {
    setCobrandoId(fatura.id);
    const alunoObj =
      fatura.aluno ||
      alunos.find((a) => String(a.id) === String(fatura.alunoId));
    const responsavelNome =
      alunoObj?.responsavel?.usuario?.nome ||
      alunoObj?.nomeContatoEntrega ||
      "Responsável";
    const telefone =
      alunoObj?.responsavel?.usuario?.telefone ||
      alunoObj?.telefoneContatoEntrega;

    try {
      await cobrarMutation.mutateAsync({
        alunoId: fatura.alunoId,
        mensalidadeId: fatura.id,
      });
    } catch {
      // prossegue para abrir o WhatsApp mesmo se a notificação falhar
    } finally {
      setCobrandoId(null);
    }

    const msg = mensagemCobrancaPix({
      responsavelNome,
      alunoNome: alunoObj?.nome || "seu(sua) filho(a)",
      mesReferencia: fatura.mesReferencia,
      anoReferencia: fatura.anoReferencia,
      valor: fatura.valor,
      dataVencimento: fatura.dataVencimento,
      chavePix: chavePixMotorista,
      titularPix: user?.motorista?.titularPix || user?.nome,
    });

    const abriu = await abrirWhatsApp(telefone, msg, (erroMsg) =>
      showSnackbar(`Notificação registrada. ${erroMsg}`, "info"),
    );

    if (abriu) {
      showSnackbar("Notificação registrada e aberta no WhatsApp!", "success");
    }
  };

  const abrirModalAvulsa = (fatura = null) => {
    setErroAvulsa("");
    if (fatura) {
      setFaturaEditando(fatura);
      setAlunoAvulsoId(String(fatura.alunoId));
      setMesRefAvulso(String(fatura.mesReferencia).padStart(2, "0"));
      setAnoRefAvulso(String(fatura.anoReferencia));
      setValorAvulso(
        Number(fatura.valor || 0)
          .toFixed(2)
          .replace(".", ","),
      );
      setVencimentoAvulsoBR(formatarDataBR(fatura.dataVencimento));
    } else {
      const alunoPadrao =
        (alunoFiltroId !== "TODOS"
          ? alunos.find((a) => String(a.id) === String(alunoFiltroId))
          : null) ||
        alunoAtivo ||
        alunos[0];
      const diaPadrao = alunoPadrao?.diaVencimentoMensalidade || 10;
      const mesAlvo = verTodosMeses ? Number(mesAtualStr) : mesFiltro;
      const anoAlvo = verTodosMeses ? Number(anoAtualStr) : anoFiltro;
      const isoPadrao = montarVencimentoMesISO(anoAlvo, mesAlvo, diaPadrao);
      setFaturaEditando(null);
      setAlunoAvulsoId(alunoPadrao?.id ? String(alunoPadrao.id) : "");
      setMesRefAvulso(String(mesAlvo).padStart(2, "0"));
      setAnoRefAvulso(String(anoAlvo));
      setValorAvulso("250,00");
      setVencimentoAvulsoBR(formatarDataBR(isoPadrao));
    }
    setModalAvulsaVisivel(true);
  };

  const handleSalvarFaturaAvulsa = async () => {
    setErroAvulsa("");
    if (!alunoAvulsoId) {
      setErroAvulsa("Selecione um aluno.");
      return;
    }
    const mesNum = Number.parseInt(mesRefAvulso, 10);
    const anoNum = Number.parseInt(anoRefAvulso, 10);
    if (!mesNum || mesNum < 1 || mesNum > 12) {
      setErroAvulsa("Informe um mês válido (01 a 12).");
      return;
    }
    if (!anoNum || anoNum < 2020 || anoNum > 2100) {
      setErroAvulsa("Informe um ano válido.");
      return;
    }
    const erroVal = validarValorMonetario(valorAvulso);
    if (erroVal) {
      setErroAvulsa(erroVal);
      return;
    }
    const erroData = validarDataBR(vencimentoAvulsoBR);
    if (erroData) {
      setErroAvulsa(erroData);
      return;
    }

    const valorNum = moedaParaNumero(valorAvulso);
    const dataIso = dataBRParaISO(vencimentoAvulsoBR);

    try {
      if (faturaEditando) {
        await atualizarMutation.mutateAsync({
          alunoId: alunoAvulsoId,
          mensalidadeId: faturaEditando.id,
          data: {
            mesReferencia: mesNum,
            anoReferencia: anoNum,
            valor: valorNum,
            dataVencimento: dataIso,
          },
        });
        showSnackbar("Fatura atualizada com sucesso!", "success");
      } else {
        await criarMutation.mutateAsync({
          alunoId: alunoAvulsoId,
          data: {
            mesReferencia: mesNum,
            anoReferencia: anoNum,
            valor: valorNum,
            dataVencimento: dataIso,
          },
        });
        setMesFiltro(mesNum);
        setAnoFiltro(anoNum);
        setVerTodosMeses(false);
        showSnackbar("Fatura criada com sucesso!", "success");
      }
      setModalAvulsaVisivel(false);
    } catch (error) {
      setErroAvulsa(
        error?.friendlyMessage || "Não foi possível salvar a fatura.",
      );
    }
  };

  // Elegíveis para geração em lote (alunos vinculados às rotas do motorista que ainda NÃO têm fatura naquele mês/ano)
  const alunosElegiveisLote = useMemo(() => {
    const mesNum = Number.parseInt(loteMes, 10);
    const anoNum = Number.parseInt(loteAno, 10);
    if (!mesNum || !anoNum) return [];

    return alunos.filter((aluno) => {
      const jaTemFatura = todasMensalidades.some(
        (m) =>
          String(m.alunoId) === String(aluno.id) &&
          Number(m.mesReferencia) === mesNum &&
          Number(m.anoReferencia) === anoNum,
      );
      return !jaTemFatura;
    });
  }, [alunos, todasMensalidades, loteMes, loteAno]);

  const abrirModalLote = () => {
    const mesAlvo = verTodosMeses ? Number(mesAtualStr) : mesFiltro;
    const anoAlvo = verTodosMeses ? Number(anoAtualStr) : anoFiltro;
    setLoteMes(String(mesAlvo).padStart(2, "0"));
    setLoteAno(String(anoAlvo));
    setLoteValorPadrao("250,00");
    setValoresPorAluno({});
    setLoteResultado(null);
    setLoteProgresso({ atual: 0, total: 0 });
    setLoteVisivel(true);
  };

  const executarGeracaoLote = async (listaAlunosParaGerar) => {
    const mesNum = Number.parseInt(loteMes, 10);
    const anoNum = Number.parseInt(loteAno, 10);
    if (!mesNum || mesNum < 1 || mesNum > 12 || !anoNum || anoNum < 2020) {
      showSnackbar("Informe um mês (01-12) e ano válidos.", "error");
      return;
    }

    const erroValorPadrao = validarValorMonetario(loteValorPadrao);
    if (erroValorPadrao) {
      showSnackbar(erroValorPadrao, "error");
      return;
    }

    if (listaAlunosParaGerar.length === 0) {
      showSnackbar(
        "Todos os alunos vinculados às suas rotas já possuem fatura neste mês.",
        "info",
      );
      return;
    }

    setLoteExecutando(true);
    setLoteResultado(null);
    setLoteProgresso({ atual: 0, total: listaAlunosParaGerar.length });

    let criadas = 0;
    const falhas = [];

    for (let i = 0; i < listaAlunosParaGerar.length; i += 1) {
      const aluno = listaAlunosParaGerar[i];
      const valorTextoAluno = valoresPorAluno[aluno.id] || loteValorPadrao;
      const valorNum =
        moedaParaNumero(valorTextoAluno) || moedaParaNumero(loteValorPadrao);
      const dataVencIso = montarVencimentoMesISO(
        anoNum,
        mesNum,
        aluno.diaVencimentoMensalidade || 10,
      );

      try {
        await criarMutation.mutateAsync({
          alunoId: aluno.id,
          data: {
            mesReferencia: mesNum,
            anoReferencia: anoNum,
            valor: valorNum,
            dataVencimento: dataVencIso,
          },
        });
        criadas += 1;
      } catch (err) {
        const statusHttp = err?.response?.status;
        falhas.push({
          aluno,
          erro:
            statusHttp === 403
              ? "Aluno sem rota vinculada a este motorista (vincule-o em Alunos)"
              : err?.friendlyMessage || "Falha ao criar fatura",
        });
      }

      setLoteProgresso({
        atual: i + 1,
        total: listaAlunosParaGerar.length,
      });
    }

    await queryClient.invalidateQueries({ queryKey: MENSALIDADES_KEYS.all });
    setLoteExecutando(false);
    setLoteResultado({ criadas, falhas });
    setMesFiltro(mesNum);
    setAnoFiltro(anoNum);
    setVerTodosMeses(false);

    if (falhas.length === 0) {
      showSnackbar(
        `${criadas} fatura(s) gerada(s) com sucesso para ${loteMes}/${loteAno}!`,
        "success",
      );
      setLoteVisivel(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!faturaParaExcluir) return;
    try {
      await excluirMutation.mutateAsync({
        alunoId: faturaParaExcluir.alunoId,
        mensalidadeId: faturaParaExcluir.id,
      });
      setFaturaParaExcluir(null);
      showSnackbar("Fatura excluída.", "success");
    } catch (error) {
      showSnackbar(
        error?.friendlyMessage || "Não foi possível excluir a fatura.",
        "error",
      );
    }
  };

  if (alunosQuery.isError) {
    return (
      <ErrorState
        message={
          alunosQuery.error?.friendlyMessage ||
          "Não foi possível carregar os dados financeiros."
        }
        onRetry={handleRefreshAll}
      />
    );
  }

  const nomeMesSelecionado =
    NOMES_MESES[mesFiltro - 1] || `Mês ${String(mesFiltro).padStart(2, "0")}`;

  return (
    <View style={styles.container}>
      <FlatList
        data={faturasFiltradas}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingFaturas}
            onRefresh={handleRefreshAll}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {/* Card de Resumo Financeiro + Seletor de Mês */}
            <Surface style={styles.summaryCard} elevation={2}>
              <View style={styles.summaryTopRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="labelMedium" style={styles.summaryEyebrow}>
                    RESUMO FINANCEIRO
                  </Text>
                  <Text variant="titleMedium" style={styles.summaryTitle}>
                    {verTodosMeses
                      ? "Todos os meses"
                      : `${nomeMesSelecionado} de ${anoFiltro}`}
                  </Text>
                  <Text variant="bodySmall" style={styles.totalCobradoText}>
                    Total cobrado:{" "}
                    <Text style={{ fontWeight: "800", color: "#FFFFFF" }}>
                      {formatarMoeda(resumoFinanceiro.totalCobrado)}
                    </Text>
                  </Text>
                </View>

                <Button
                  mode="outlined"
                  compact
                  icon="content-copy"
                  textColor="#F8FAFC"
                  style={styles.copyPixBtn}
                  onPress={handleCopiarChavePix}
                >
                  {chavePixMotorista ? "Copiar Pix" : "Sem Pix"}
                </Button>
              </View>

              {/* Navegador para pular entre os meses ("< Mês | Próximo >") */}
              <View style={styles.monthNavBox}>
                <View style={styles.monthStepperRow}>
                  <TouchableOpacity
                    style={styles.monthArrowBtn}
                    onPress={() => handleMudarMes(-1)}
                    accessibilityLabel="Mês anterior"
                  >
                    <MaterialCommunityIcons
                      name="chevron-left"
                      size={22}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.monthCenterPill}
                    onPress={() => setVerTodosMeses((v) => !v)}
                  >
                    <MaterialCommunityIcons
                      name="calendar-month"
                      size={16}
                      color={colors.primary}
                    />
                    <Text variant="labelLarge" style={styles.monthCenterText}>
                      {verTodosMeses
                        ? "Exibindo todos os meses"
                        : `${String(mesFiltro).padStart(2, "0")}/${anoFiltro} • ${nomeMesSelecionado}`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.monthArrowBtn}
                    onPress={() => handleMudarMes(1)}
                    accessibilityLabel="Próximo mês"
                  >
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={22}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>

                {/* Atalhos dos meses com valor cobrado */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.monthShortcutsRow}
                >
                  <Chip
                    compact
                    selected={verTodosMeses}
                    onPress={() => setVerTodosMeses(true)}
                    style={[
                      styles.monthChip,
                      verTodosMeses && styles.monthChipSelected,
                    ]}
                    textStyle={[
                      styles.monthChipText,
                      verTodosMeses && styles.monthChipTextSelected,
                    ]}
                  >
                    Todos
                  </Chip>
                  {mesesDisponiveis.map((itemMes) => {
                    const ativo =
                      !verTodosMeses &&
                      itemMes.mes === mesFiltro &&
                      itemMes.ano === anoFiltro;
                    const labelCurto = `${NOMES_MESES[itemMes.mes - 1]?.slice(0, 3)}/${String(itemMes.ano).slice(-2)}`;
                    return (
                      <Chip
                        key={`${itemMes.ano}-${itemMes.mes}`}
                        compact
                        selected={ativo}
                        onPress={() => {
                          setVerTodosMeses(false);
                          setMesFiltro(itemMes.mes);
                          setAnoFiltro(itemMes.ano);
                        }}
                        style={[
                          styles.monthChip,
                          ativo && styles.monthChipSelected,
                        ]}
                        textStyle={[
                          styles.monthChipText,
                          ativo && styles.monthChipTextSelected,
                        ]}
                      >
                        {labelCurto} ({formatarMoeda(itemMes.total)})
                      </Chip>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.kpiRow}>
                <View style={styles.kpiBox}>
                  <Text variant="labelSmall" style={styles.kpiLabel}>
                    Recebido
                  </Text>
                  <Text
                    variant="titleMedium"
                    style={[styles.kpiValue, { color: "#4ADE80" }]}
                  >
                    {formatarMoeda(resumoFinanceiro.recebido)}
                  </Text>
                </View>

                <View style={styles.kpiBox}>
                  <Text variant="labelSmall" style={styles.kpiLabel}>
                    Pendente
                  </Text>
                  <Text
                    variant="titleMedium"
                    style={[styles.kpiValue, { color: "#FBBF24" }]}
                  >
                    {formatarMoeda(resumoFinanceiro.pendente)}
                  </Text>
                </View>

                <View style={styles.kpiBox}>
                  <Text variant="labelSmall" style={styles.kpiLabel}>
                    Atrasado
                  </Text>
                  <Text
                    variant="titleMedium"
                    style={[styles.kpiValue, { color: "#F87171" }]}
                  >
                    {formatarMoeda(resumoFinanceiro.atrasado)}
                  </Text>
                </View>
              </View>

              <Button
                mode="contained"
                icon="calendar-multiselect"
                buttonColor={colors.primary}
                textColor={colors.text}
                style={styles.batchBtn}
                contentStyle={styles.batchBtnContent}
                labelStyle={styles.batchBtnLabel}
                onPress={abrirModalLote}
              >
                Gerar faturas do mês
              </Button>
            </Surface>

            {/* Filtros por Status e por Aluno */}
            <Surface style={styles.filtersCard} elevation={1}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {FILTROS_STATUS.map((f) => {
                  const selected = filtroStatus === f.value;
                  return (
                    <Chip
                      key={f.value}
                      selected={selected}
                      compact
                      onPress={() => setFiltroStatus(f.value)}
                      style={[
                        styles.filterChip,
                        selected && styles.filterChipSelected,
                      ]}
                      textStyle={[
                        styles.filterChipText,
                        selected && styles.filterChipTextSelected,
                      ]}
                    >
                      {f.label}
                    </Chip>
                  );
                })}
              </ScrollView>

              {alunos.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  <Chip
                    selected={alunoFiltroId === "TODOS"}
                    compact
                    icon="account-group-outline"
                    onPress={() => setAlunoFiltroId("TODOS")}
                    style={[
                      styles.alunoChip,
                      alunoFiltroId === "TODOS" && styles.alunoChipSelected,
                    ]}
                  >
                    Todos da van ({alunos.length})
                  </Chip>
                  {alunos.map((aluno) => {
                    const selected =
                      String(alunoFiltroId) === String(aluno.id);
                    return (
                      <Chip
                        key={aluno.id}
                        selected={selected}
                        compact
                        onPress={() => {
                          setAlunoFiltroId(String(aluno.id));
                          setAlunoAtivo(aluno);
                        }}
                        style={[
                          styles.alunoChip,
                          selected && styles.alunoChipSelected,
                        ]}
                      >
                        {aluno.nome}
                      </Chip>
                    );
                  })}
                </ScrollView>
              ) : null}
            </Surface>
          </View>
        }
        renderItem={({ item }) => {
          const cfg =
            STATUS_MENSALIDADE[item.statusResolvido] ||
            STATUS_MENSALIDADE.PENDENTE;
          const isPago = item.statusResolvido === "PAGO";

          return (
            <Surface style={styles.faturaCard} elevation={1}>
              <View style={styles.faturaTopRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={styles.alunoNome}>
                    {item.aluno?.nome || "Aluno"}
                  </Text>
                  <Text variant="bodySmall" style={styles.faturaRef}>
                    Ref. {String(item.mesReferencia).padStart(2, "0")}/
                    {item.anoReferencia} • Venc.{" "}
                    {formatarDataBR(item.dataVencimento)}
                  </Text>
                </View>

                <Chip
                  compact
                  icon={cfg.icon}
                  style={{ backgroundColor: cfg.bg }}
                  textStyle={{
                    color: cfg.text,
                    fontWeight: "800",
                    fontSize: 11,
                  }}
                >
                  {cfg.label}
                </Chip>
              </View>

              <View style={styles.valorRow}>
                <Text variant="headlineSmall" style={styles.faturaValor}>
                  {formatarMoeda(item.valor)}
                </Text>

                {item.diasAtraso > 0 && !isPago ? (
                  <Text variant="labelSmall" style={styles.diasAtrasoBadge}>
                    {item.diasAtraso} dia(s) em atraso
                  </Text>
                ) : null}

                {isPago && item.dataPagamento ? (
                  <Text variant="bodySmall" style={styles.pagoEmText}>
                    Pago em {formatarDataBR(item.dataPagamento)}
                  </Text>
                ) : null}

                <View style={styles.smallIcons}>
                  <IconButton
                    icon="pencil-outline"
                    size={19}
                    iconColor={colors.secondary}
                    onPress={() => abrirModalAvulsa(item)}
                    accessibilityLabel="Editar fatura"
                  />
                  <IconButton
                    icon="trash-can-outline"
                    size={19}
                    iconColor={colors.error}
                    onPress={() => setFaturaParaExcluir(item)}
                    accessibilityLabel="Excluir fatura"
                  />
                </View>
              </View>

              {!isPago ? (
                <View style={styles.cardActionsCol}>
                  <Button
                    mode="outlined"
                    icon="check-circle-outline"
                    textColor="#166534"
                    style={styles.payBtn}
                    contentStyle={styles.actionBtnContent}
                    labelStyle={styles.payBtnLabel}
                    loading={pagandoId === item.id}
                    disabled={pagandoId === item.id || cobrandoId === item.id}
                    onPress={() => handleRegistrarPagamento(item)}
                  >
                    Registrar pagamento
                  </Button>

                  <Button
                    mode="contained"
                    icon="whatsapp"
                    buttonColor={colors.primary}
                    textColor={colors.text}
                    style={styles.chargeBtn}
                    contentStyle={styles.actionBtnContent}
                    labelStyle={styles.chargeBtnLabel}
                    loading={cobrandoId === item.id}
                    disabled={pagandoId === item.id || cobrandoId === item.id}
                    onPress={() => handleCobrar(item)}
                  >
                    Notificar
                  </Button>
                </View>
              ) : null}
            </Surface>
          );
        }}
        ListEmptyComponent={
          isLoadingFaturas ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Carregando faturas...
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="receipt-text-outline"
              title={
                verTodosMeses
                  ? "Nenhuma mensalidade encontrada"
                  : `Sem faturas em ${nomeMesSelecionado}/${anoFiltro}`
              }
              description="Use o botão 'Gerar faturas do mês' para lançar as mensalidades de todos os alunos da sua van ou navegue para outro mês no topo."
              actionLabel="Gerar faturas deste mês"
              onAction={abrirModalLote}
            />
          )
        }
      />

      {alunos.length > 0 ? (
        <FAB
          icon="plus"
          label="Fatura avulsa"
          style={styles.fab}
          color={colors.text}
          onPress={() => abrirModalAvulsa(null)}
        />
      ) : null}

      {/* Modal: Gerar Faturas do Mês em Lote */}
      <Portal>
        <Dialog
          visible={loteVisivel}
          onDismiss={() => !loteExecutando && setLoteVisivel(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            Gerar faturas do mês
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodySmall" style={styles.dialogSubtitle}>
              Cria faturas para os alunos vinculados às suas rotas que ainda não
              possuem lançamento no mês/ano escolhido.
            </Text>

            {alunosSemRotaCount > 0 ? (
              <Surface style={styles.semRotaInfoBox} elevation={0}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={16}
                  color="#9A3412"
                />
                <Text variant="labelSmall" style={styles.semRotaInfoText}>
                  {alunosSemRotaCount} aluno(s) sem rota vinculada não entram no
                  lote até serem vinculados na aba Alunos.
                </Text>
              </Surface>
            ) : null}

            <View style={styles.row}>
              <TextInput
                label="Mês (01-12)"
                mode="outlined"
                dense
                keyboardType="number-pad"
                value={loteMes}
                disabled={loteExecutando}
                onChangeText={(v) =>
                  setLoteMes(v.replace(/\D/g, "").slice(0, 2))
                }
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Ano"
                mode="outlined"
                dense
                keyboardType="number-pad"
                value={loteAno}
                disabled={loteExecutando}
                onChangeText={(v) =>
                  setLoteAno(v.replace(/\D/g, "").slice(0, 4))
                }
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <TextInput
              label="Valor padrão (R$)"
              mode="outlined"
              dense
              keyboardType="numeric"
              value={loteValorPadrao}
              disabled={loteExecutando}
              onChangeText={(v) => setLoteValorPadrao(mascaraMoeda(v))}
              left={<TextInput.Affix text="R$ " />}
              style={styles.input}
            />

            <Text variant="labelMedium" style={styles.subTitle}>
              Alunos elegíveis ({alunosElegiveisLote.length} de {alunos.length}):
            </Text>

            {alunosElegiveisLote.length === 0 ? (
              <Surface style={styles.allGeneratedBox} elevation={0}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={20}
                  color="#166534"
                />
                <Text variant="bodySmall" style={styles.allGeneratedText}>
                  Todos os alunos das suas rotas já possuem fatura para{" "}
                  {loteMes}/{loteAno}.
                </Text>
              </Surface>
            ) : (
              <ScrollView style={styles.loteScroll} nestedScrollEnabled>
                {alunosElegiveisLote.map((aluno, idx) => {
                  const valAluno =
                    valoresPorAluno[aluno.id] !== undefined
                      ? valoresPorAluno[aluno.id]
                      : loteValorPadrao;
                  return (
                    <View key={aluno.id}>
                      <View style={styles.loteAlunoRow}>
                        <View style={{ flex: 1 }}>
                          <Text variant="labelLarge" style={styles.alunoNome}>
                            {aluno.nome}
                          </Text>
                          <Text variant="labelSmall" style={styles.faturaRef}>
                            Venc. dia {aluno.diaVencimentoMensalidade || 10}
                          </Text>
                        </View>
                        <TextInput
                          mode="outlined"
                          dense
                          keyboardType="numeric"
                          disabled={loteExecutando}
                          value={valAluno}
                          onChangeText={(v) =>
                            setValoresPorAluno((prev) => ({
                              ...prev,
                              [aluno.id]: mascaraMoeda(v),
                            }))
                          }
                          style={styles.loteValorInput}
                        />
                      </View>
                      {idx < alunosElegiveisLote.length - 1 ? (
                        <Divider />
                      ) : null}
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {loteExecutando ? (
              <View style={styles.progressBox}>
                <Text variant="labelSmall" style={styles.progressLabel}>
                  Gerando fatura {loteProgresso.atual} de {loteProgresso.total}
                  ...
                </Text>
                <ProgressBar
                  progress={
                    loteProgresso.total > 0
                      ? loteProgresso.atual / loteProgresso.total
                      : 0
                  }
                  color={colors.primary}
                  style={styles.progressBar}
                />
              </View>
            ) : null}

            {loteResultado && loteResultado.falhas.length > 0 ? (
              <Surface style={styles.batchErrorBox} elevation={0}>
                <Text variant="labelMedium" style={styles.batchErrorTitle}>
                  {loteResultado.criadas} criada(s),{" "}
                  {loteResultado.falhas.length} com erro:
                </Text>
                {loteResultado.falhas.map((f) => (
                  <Text
                    key={f.aluno.id}
                    variant="labelSmall"
                    style={styles.batchErrorDetail}
                  >
                    • {f.aluno.nome}: {f.erro}
                  </Text>
                ))}
                <Button
                  mode="contained-tonal"
                  compact
                  icon="refresh"
                  buttonColor="#FEE2E2"
                  textColor="#991B1B"
                  onPress={() =>
                    executarGeracaoLote(
                      loteResultado.falhas.map((f) => f.aluno),
                    )
                  }
                >
                  Tentar novamente as que falharam
                </Button>
              </Surface>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setLoteVisivel(false)}
              disabled={loteExecutando}
              textColor={colors.textSecondary}
            >
              Fechar
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.primary}
              textColor={colors.text}
              loading={loteExecutando}
              disabled={loteExecutando || alunosElegiveisLote.length === 0}
              onPress={() => executarGeracaoLote(alunosElegiveisLote)}
            >
              Confirmar ({alunosElegiveisLote.length})
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Modal: Criar / Editar Fatura Avulsa */}
      <Portal>
        <Dialog
          visible={modalAvulsaVisivel}
          onDismiss={() => setModalAvulsaVisivel(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            {faturaEditando ? "Editar Fatura" : "Nova Fatura Avulsa"}
          </Dialog.Title>
          <Dialog.Content>
            {!faturaEditando ? (
              <>
                <Text variant="labelMedium" style={styles.subTitle}>
                  Selecione o Aluno:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  {alunos.map((a) => {
                    const sel = String(alunoAvulsoId) === String(a.id);
                    return (
                      <Chip
                        key={a.id}
                        selected={sel}
                        compact
                        onPress={() => {
                          setAlunoAvulsoId(String(a.id));
                          const iso = montarVencimentoMesISO(
                            Number(anoRefAvulso) || Number(anoAtualStr),
                            Number(mesRefAvulso) || Number(mesAtualStr),
                            a.diaVencimentoMensalidade || 10,
                          );
                          setVencimentoAvulsoBR(formatarDataBR(iso));
                        }}
                        style={[
                          styles.alunoChip,
                          sel && styles.alunoChipSelected,
                        ]}
                      >
                        {a.nome}
                      </Chip>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}

            <View style={[styles.row, { marginTop: 8 }]}>
              <TextInput
                label="Mês (01-12)"
                mode="outlined"
                dense
                keyboardType="number-pad"
                value={mesRefAvulso}
                onChangeText={(v) =>
                  setMesRefAvulso(v.replace(/\D/g, "").slice(0, 2))
                }
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Ano"
                mode="outlined"
                dense
                keyboardType="number-pad"
                value={anoRefAvulso}
                onChangeText={(v) =>
                  setAnoRefAvulso(v.replace(/\D/g, "").slice(0, 4))
                }
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <TextInput
              label="Valor (R$)"
              mode="outlined"
              dense
              keyboardType="numeric"
              value={valorAvulso}
              onChangeText={(v) => setValorAvulso(mascaraMoeda(v))}
              left={<TextInput.Affix text="R$ " />}
              style={styles.input}
            />

            <TextInput
              label="Data de Vencimento (DD/MM/AAAA)"
              mode="outlined"
              dense
              keyboardType="number-pad"
              value={vencimentoAvulsoBR}
              onChangeText={(v) => setVencimentoAvulsoBR(mascaraDataBR(v))}
              style={styles.input}
            />

            {erroAvulsa ? (
              <HelperText type="error" visible>
                {erroAvulsa}
              </HelperText>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setModalAvulsaVisivel(false)}
              textColor={colors.textSecondary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.primary}
              textColor={colors.text}
              loading={criarMutation.isPending || atualizarMutation.isPending}
              disabled={criarMutation.isPending || atualizarMutation.isPending}
              onPress={handleSalvarFaturaAvulsa}
            >
              Salvar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog: Confirmar Exclusão */}
      <Portal>
        <Dialog
          visible={Boolean(faturaParaExcluir)}
          onDismiss={() => setFaturaParaExcluir(null)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="alert-circle-outline" color={colors.error} />
          <Dialog.Title style={styles.dialogTitle}>
            Excluir Fatura?
          </Dialog.Title>
          <Dialog.Content>
            <Text
              variant="bodyMedium"
              style={{ textAlign: "center", color: colors.text }}
            >
              Deseja excluir a fatura de{" "}
              <Text style={{ fontWeight: "700" }}>
                {faturaParaExcluir?.aluno?.nome || "aluno"}
              </Text>{" "}
              ({formatarMoeda(faturaParaExcluir?.valor)})?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setFaturaParaExcluir(null)}
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
  listContent: {
    padding: 16,
    paddingBottom: 96,
  },
  headerBlock: {
    gap: 14,
    marginBottom: 14,
  },
  summaryCard: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  summaryEyebrow: {
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  summaryTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    marginTop: 2,
  },
  totalCobradoText: {
    color: "#CBD5E1",
    marginTop: 2,
  },
  copyPixBtn: {
    borderColor: "#475569",
    borderRadius: 10,
  },
  monthNavBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 10,
    gap: 10,
  },
  monthStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  monthArrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  monthCenterPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
  },
  monthCenterText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  monthShortcutsRow: {
    gap: 8,
  },
  monthChip: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  monthChipSelected: {
    backgroundColor: colors.primary,
  },
  monthChipText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
  },
  monthChipTextSelected: {
    color: colors.text,
    fontWeight: "800",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 10,
  },
  kpiLabel: {
    color: "#CBD5E1",
    fontWeight: "600",
  },
  kpiValue: {
    fontWeight: "800",
    marginTop: 4,
  },
  batchBtn: {
    borderRadius: 12,
  },
  batchBtnContent: {
    height: 52,
  },
  batchBtnLabel: {
    fontWeight: "800",
    fontSize: 15,
  },
  filtersCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  chipsRow: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.surfaceVariant,
  },
  filterChipSelected: {
    backgroundColor: colors.primaryLight,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  filterChipTextSelected: {
    color: colors.secondary,
    fontWeight: "800",
  },
  alunoChip: {
    backgroundColor: colors.surfaceVariant,
  },
  alunoChipSelected: {
    backgroundColor: "#DBEAFE",
  },
  faturaCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  faturaTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  alunoNome: {
    fontWeight: "800",
    color: colors.secondary,
  },
  faturaRef: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  valorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  faturaValor: {
    fontWeight: "800",
    color: colors.secondary,
  },
  diasAtrasoBadge: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  pagoEmText: {
    color: "#166534",
    fontWeight: "700",
  },
  smallIcons: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: -8,
  },
  cardActionsCol: {
    gap: 8,
    marginTop: 4,
  },
  payBtn: {
    width: "100%",
    borderRadius: 12,
    borderColor: "#86EFAC",
  },
  payBtnLabel: {
    fontWeight: "800",
    fontSize: 14,
  },
  chargeBtn: {
    width: "100%",
    borderRadius: 12,
  },
  chargeBtnLabel: {
    fontWeight: "800",
    fontSize: 14,
  },
  actionBtnContent: {
    minHeight: 48,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
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
    fontWeight: "800",
    color: colors.secondary,
  },
  dialogSubtitle: {
    color: colors.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  semRotaInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFEDD5",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  semRotaInfoText: {
    flex: 1,
    color: "#9A3412",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  input: {
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  subTitle: {
    fontWeight: "700",
    color: colors.secondary,
    marginBottom: 6,
  },
  loteScroll: {
    maxHeight: 200,
    marginBottom: 8,
  },
  loteAlunoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loteValorInput: {
    width: 110,
    backgroundColor: colors.surface,
  },
  allGeneratedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#DCFCE7",
    padding: 12,
    borderRadius: 10,
  },
  allGeneratedText: {
    flex: 1,
    color: "#166534",
    fontWeight: "600",
  },
  progressBox: {
    gap: 6,
    marginTop: 8,
  },
  progressLabel: {
    color: colors.secondary,
    fontWeight: "700",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  batchErrorBox: {
    backgroundColor: "#FFF1F2",
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  batchErrorTitle: {
    color: "#991B1B",
    fontWeight: "800",
  },
  batchErrorDetail: {
    color: "#991B1B",
  },
});
