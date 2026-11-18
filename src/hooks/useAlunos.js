import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAlunos,
  getAlunoById,
  createAluno,
  updateAluno,
  deleteAluno,
  getAlunosDaRota,
  vincularAlunoNaRota,
  desvincularAlunoDaRota,
  getAlunosDoResponsavel,
  getResponsaveis,
} from "../api/alunosApi";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";

/**
 * Chaves de cache semânticas do TanStack Query v5 para o módulo de Alunos & Lotação (Joao)
 */
export const ALUNOS_KEYS = {
  all: ["alunos"],
  detail: (id) => ["alunos", id],
  rotaAlunos: (rotaId) => ["rota-alunos", rotaId],
  responsaveis: ["responsaveis"],
};

/**
 * Listagem de alunos:
 * - Se `MOTORISTA`: consome `GET /alunos`
 * - Se `RESPONSAVEL`: consome `GET /responsaveis/:responsavelId/alunos`
 */
export const useAlunosQuery = (options = {}) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isResponsavel = user?.tipo === "RESPONSAVEL";
  const responsavelId = user?.responsavel?.id;

  return useQuery({
    queryKey: isResponsavel
      ? [...ALUNOS_KEYS.all, "responsavel", responsavelId]
      : ALUNOS_KEYS.all,
    queryFn: () =>
      isResponsavel && responsavelId
        ? getAlunosDoResponsavel(responsavelId)
        : getAlunos(),
    enabled:
      Boolean(token) &&
      (!isResponsavel || Boolean(responsavelId)) &&
      (options.enabled ?? true),
    staleTime: 1000 * 30,
    ...options,
  });
};

/**
 * Detalhe de um aluno (`GET /alunos/:id`)
 */
export const useAlunoDetailQuery = (id) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ALUNOS_KEYS.detail(id),
    queryFn: () => getAlunoById(id),
    enabled: Boolean(token && id),
  });
};

/**
 * Relacionamento 1 (URL Composta): Lista alunos vinculados a uma rota (`GET /rotas/:rotaId/alunos`)
 */
export const useAlunosDaRotaQuery = (rotaId, options = {}) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ALUNOS_KEYS.rotaAlunos(rotaId),
    queryFn: () => getAlunosDaRota(rotaId),
    enabled: Boolean(token && rotaId) && (options.enabled ?? true),
    staleTime: 1000 * 15,
    ...options,
  });
};

/**
 * Lista usuários com perfil RESPONSAVEL para vincular ao criar/editar um aluno (apenas MOTORISTA)
 */
export const useResponsaveisQuery = (options = {}) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isMotorista = user?.tipo === "MOTORISTA" || !user?.tipo;

  return useQuery({
    queryKey: ALUNOS_KEYS.responsaveis,
    queryFn: getResponsaveis,
    enabled: Boolean(token) && isMotorista && (options.enabled ?? true),
    staleTime: 1000 * 60,
    ...options,
  });
};

const invalidateAlunosERotas = (queryClient, rotaId, alunoId) => {
  queryClient.invalidateQueries({ queryKey: ALUNOS_KEYS.all });
  if (alunoId) {
    queryClient.invalidateQueries({ queryKey: ALUNOS_KEYS.detail(alunoId) });
  }
  if (rotaId) {
    queryClient.invalidateQueries({ queryKey: ALUNOS_KEYS.rotaAlunos(rotaId) });
  } else {
    queryClient.invalidateQueries({ queryKey: ["rota-alunos"] });
  }
  queryClient.invalidateQueries({ queryKey: ["rotas"] });
  queryClient.invalidateQueries({ queryKey: ["operacao-alunos"] });
};

/**
 * Criação de aluno (`POST /alunos`)
 */
export const useCreateAlunoMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: createAluno,
    onSuccess: (novoAluno) => {
      invalidateAlunosERotas(queryClient, null, novoAluno?.id);
      showSnackbar(
        `Aluno(a) "${novoAluno?.nome || "Novo(a)"}" cadastrado(a) com sucesso!`,
        "success",
      );
    },
    onError: (error) => {
      showSnackbar(
        error.friendlyMessage || "Não foi possível cadastrar o aluno.",
        "error",
      );
    },
  });
};

/**
 * Edição de aluno (`PUT /alunos/:id`)
 */
export const useUpdateAlunoMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: updateAluno,
    onSuccess: (alunoAtualizado, variables) => {
      invalidateAlunosERotas(queryClient, null, variables?.id);
      showSnackbar(
        `Dados de "${alunoAtualizado?.nome || "aluno"}" atualizados!`,
        "success",
      );
    },
    onError: (error) => {
      showSnackbar(
        error.friendlyMessage || "Não foi possível atualizar o aluno.",
        "error",
      );
    },
  });
};

/**
 * Exclusão de aluno (`DELETE /alunos/:id`)
 */
export const useDeleteAlunoMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((state) => state.showSnackbar);
  const alunoAtivo = useAppStore((state) => state.alunoAtivo);
  const setAlunoAtivo = useAppStore((state) => state.setAlunoAtivo);

  return useMutation({
    mutationFn: deleteAluno,
    onSuccess: (deletedId) => {
      if (alunoAtivo?.id === deletedId) {
        setAlunoAtivo(null);
      }
      invalidateAlunosERotas(queryClient, null, deletedId);
      showSnackbar("Aluno(a) removido(a) com sucesso.", "success");
    },
    onError: (error) => {
      showSnackbar(
        error.friendlyMessage || "Não foi possível excluir o aluno.",
        "error",
      );
    },
  });
};

/**
 * Relacionamento 1: Vincular aluno à rota (`POST /rotas/:rotaId/alunos`)
 * Se a van atingir `capacidadeVan`, a API retorna HTTP 409 Conflict.
 */
export const useVincularAlunoRotaMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: vincularAlunoNaRota,
    onSuccess: (_, variables) => {
      invalidateAlunosERotas(queryClient, variables?.rotaId, variables?.alunoId);
      showSnackbar("Aluno vinculado à rota com sucesso!", "success");
    },
    onError: (error) => {
      showSnackbar(
        error.friendlyMessage || "Não foi possível vincular o aluno à rota.",
        "error",
      );
    },
  });
};

/**
 * Relacionamento 1: Desvincular aluno da rota (`DELETE /rotas/:rotaId/alunos/:alunoId`)
 */
export const useDesvincularAlunoRotaMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: desvincularAlunoDaRota,
    onSuccess: (_, variables) => {
      invalidateAlunosERotas(queryClient, variables?.rotaId, variables?.alunoId);
      showSnackbar("Aluno desvinculado da rota.", "info");
    },
    onError: (error) => {
      showSnackbar(
        error.friendlyMessage || "Não foi possível desvincular o aluno da rota.",
        "error",
      );
    },
  });
};
