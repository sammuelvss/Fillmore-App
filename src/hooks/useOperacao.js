import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAlunos, getAlunosDoResponsavel } from "../api/alunosApi";
import {
  getPresencasDoAluno,
  registrarPresenca,
  atualizarPresenca,
  removerPresenca,
  getViagensDoAluno,
  cancelarViagemDiaria,
  removerViagemDiaria,
  getNotificacoesDoAluno,
  getNotificacoesDoResponsavel,
  criarNotificacaoAluno,
  removerNotificacao,
  marcarNotificacaoComoLida,
} from "../api/operacaoApi";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";

// Hooks TanStack Query da Operação Diária

export const OPERACAO_KEYS = {
  alunos: (userId) => ["operacao-alunos", userId],
  presencas: (alunoId) => ["presencas", alunoId],
  viagens: (alunoId) => ["viagens", alunoId],
  notificacoes: (alunoId) => ["notificacoes", alunoId],
  notificacoesResponsavel: (responsavelId) => ["notificacoes-responsavel", responsavelId],
};

// Lista alunos acessíveis ao usuário logado (filhos do responsável ou alunos vinculados às rotas do motorista)
export const useOperacaoAlunosQuery = () => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isResponsavel = user?.tipo === "RESPONSAVEL";
  const responsavelId = user?.responsavel?.id;
  const motoristaId = user?.motorista?.id;

  return useQuery({
    queryKey: OPERACAO_KEYS.alunos(user?.id),
    queryFn: async () => {
      if (isResponsavel && responsavelId) {
        return await getAlunosDoResponsavel(responsavelId);
      }
      const todos = await getAlunos();
      if (!Array.isArray(todos)) return [];
      if (!motoristaId) return todos;
      // O back-end permite operação do motorista apenas para alunos ligados às rotas dele
      return todos.filter(
        (a) => a.rotaIda?.motoristaId === motoristaId || a.rotaVolta?.motoristaId === motoristaId,
      );
    },
    enabled: Boolean(token) && (!isResponsavel || Boolean(responsavelId)),
    staleTime: 1000 * 30,
  });
};

// --- PRESENÇAS ---

export const usePresencasQuery = (alunoId) => {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: OPERACAO_KEYS.presencas(alunoId),
    queryFn: () => getPresencasDoAluno(alunoId),
    enabled: Boolean(token && alunoId),
    staleTime: 1000 * 15,
  });
};

export const useRegistrarPresencaMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  return useMutation({
    mutationFn: registrarPresenca,
    onSuccess: (criada, { alunoId }) => {
      queryClient.invalidateQueries({ queryKey: OPERACAO_KEYS.presencas(alunoId) });
      showSnackbar(
        criada?.embarcou ? "Embarque registrado!" : "Falta registrada!",
        "success",
      );
    },
    onError: (e) => showSnackbar(e.friendlyMessage || "Erro ao registrar presença.", "error"),
  });
};

export const useAtualizarPresencaMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  return useMutation({
    mutationFn: atualizarPresenca,
    onSuccess: (_, { alunoId }) => {
      queryClient.invalidateQueries({ queryKey: OPERACAO_KEYS.presencas(alunoId) });
      showSnackbar("Presença atualizada!", "success");
    },
    onError: (e) => showSnackbar(e.friendlyMessage || "Erro ao atualizar presença.", "error"),
  });
};

export const useRemoverPresencaMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  return useMutation({
    mutationFn: removerPresenca,
    onSuccess: (_, { alunoId }) => {
      queryClient.invalidateQueries({ queryKey: OPERACAO_KEYS.presencas(alunoId) });
      showSnackbar("Registro de presença excluído.", "info");
    },
    onError: (e) => showSnackbar(e.friendlyMessage || "Erro ao excluir presença.", "error"),
  });
};

// --- VIAGENS DIÁRIAS ---

export const useViagensQuery = (alunoId) => {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: OPERACAO_KEYS.viagens(alunoId),
    queryFn: () => getViagensDoAluno(alunoId),
    enabled: Boolean(token && alunoId),
    staleTime: 1000 * 15,
  });
};

export const useCancelarViagemMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  return useMutation({
    mutationFn: cancelarViagemDiaria,
    onSuccess: (_, { alunoId }) => {
      queryClient.invalidateQueries({ queryKey: OPERACAO_KEYS.viagens(alunoId) });
      // Back-end gera uma notificação automática ao cancelar viagem
      queryClient.invalidateQueries({ queryKey: OPERACAO_KEYS.notificacoes(alunoId) });
      queryClient.invalidateQueries({ queryKey: ["notificacoes-responsavel"] });
      showSnackbar("Viagem cancelada e aviso enviado!", "success");
    },
    onError: (e) => showSnackbar(e.friendlyMessage || "Erro ao cancelar viagem.", "error"),
  });
};

export const useRemoverViagemMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  return useMutation({
    mutationFn: removerViagemDiaria,
    onSuccess: (_, { alunoId }) => {
      queryClient.invalidateQueries({ queryKey: OPERACAO_KEYS.viagens(alunoId) });
      showSnackbar("Cancelamento desfeito. Viagem reativada!", "info");
    },
    onError: (e) => showSnackbar(e.friendlyMessage || "Erro ao reativar viagem.", "error"),
  });
};

// --- NOTIFICAÇÕES / AVISOS ---

export const useNotificacoesQuery = (alunoId) => {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: OPERACAO_KEYS.notificacoes(alunoId),
    queryFn: () => getNotificacoesDoAluno(alunoId),
    enabled: Boolean(token && alunoId),
    staleTime: 1000 * 15,
  });
};

export const useNotificacoesResponsavelQuery = () => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const responsavelId = user?.responsavel?.id;

  return useQuery({
    queryKey: OPERACAO_KEYS.notificacoesResponsavel(responsavelId),
    queryFn: () => getNotificacoesDoResponsavel(responsavelId),
    enabled: Boolean(token && user?.tipo === "RESPONSAVEL" && responsavelId),
    staleTime: 1000 * 15,
  });
};

export const useCriarNotificacaoMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  return useMutation({
    mutationFn: criarNotificacaoAluno,
    onSuccess: (_, { alunoId }) => {
      queryClient.invalidateQueries({ queryKey: OPERACAO_KEYS.notificacoes(alunoId) });
      queryClient.invalidateQueries({ queryKey: ["notificacoes-responsavel"] });
      showSnackbar("Aviso enviado!", "success");
    },
    onError: (e) => showSnackbar(e.friendlyMessage || "Erro ao enviar aviso.", "error"),
  });
};

export const useMarcarNotificacaoLidaMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  return useMutation({
    mutationFn: ({ notificacaoId }) => marcarNotificacaoComoLida(notificacaoId),
    onSuccess: (_, { alunoId }) => {
      if (alunoId) {
        queryClient.invalidateQueries({ queryKey: OPERACAO_KEYS.notificacoes(alunoId) });
      }
      queryClient.invalidateQueries({ queryKey: ["notificacoes-responsavel"] });
      showSnackbar("Aviso marcado como lido.", "info");
    },
    onError: (e) => showSnackbar(e.friendlyMessage || "Erro ao marcar como lida.", "error"),
  });
};

export const useRemoverNotificacaoMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  return useMutation({
    mutationFn: removerNotificacao,
    onSuccess: (_, { alunoId }) => {
      queryClient.invalidateQueries({ queryKey: OPERACAO_KEYS.notificacoes(alunoId) });
      queryClient.invalidateQueries({ queryKey: ["notificacoes-responsavel"] });
      showSnackbar("Aviso excluído.", "info");
    },
    onError: (e) => showSnackbar(e.friendlyMessage || "Erro ao excluir aviso.", "error"),
  });
};

