import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMensalidadesDoAluno,
  createMensalidade,
  updateMensalidade,
  registrarPagamentoMensalidade,
  deleteMensalidade,
  getMensalidadesPendentesResponsavel,
  dispararCobrancaMensalidade,
} from "../api/mensalidadesApi";
import { useAuthStore } from "../store/useAuthStore";

export const MENSALIDADES_KEYS = {
  all: ["mensalidades"],
  porAluno: (alunoId) => ["mensalidades", alunoId],
  pendentesResponsavel: (responsavelId) => [
    "mensalidades-pendentes",
    responsavelId,
  ],
};

/**
 * Relacionamento 2: Lista mensalidades do aluno ativo (GET /alunos/:alunoId/mensalidades)
 */
export function useMensalidadesQuery(alunoId, options = {}) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: MENSALIDADES_KEYS.porAluno(alunoId),
    queryFn: async () => {
      const payload = await getMensalidadesDoAluno(alunoId);
      if (Array.isArray(payload)) return payload;
      return payload?.mensalidades || payload?.data || [];
    },
    enabled: Boolean(token && alunoId) && (options.enabled ?? true),
    staleTime: 1000 * 30,
    ...options,
  });
}

/**
 * Consulta extrato de pendências e Chave Pix para o Responsável
 * (GET /responsaveis/:responsavelId/mensalidades/pendentes)
 */
export function usePendenciasResponsavelQuery(responsavelId, options = {}) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: MENSALIDADES_KEYS.pendentesResponsavel(responsavelId),
    queryFn: () => getMensalidadesPendentesResponsavel(responsavelId),
    enabled: Boolean(token && responsavelId) && (options.enabled ?? true),
    staleTime: 1000 * 30,
    ...options,
  });
}

const invalidateMensalidades = (queryClient, alunoId) => {
  if (alunoId) {
    queryClient.invalidateQueries({
      queryKey: MENSALIDADES_KEYS.porAluno(alunoId),
    });
  } else {
    queryClient.invalidateQueries({ queryKey: MENSALIDADES_KEYS.all });
  }
  queryClient.invalidateQueries({ queryKey: ["mensalidades-pendentes"] });
};

/**
 * Cria nova fatura de mensalidade (POST /alunos/:alunoId/mensalidades)
 */
export function useCreateMensalidadeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alunoId, data }) => {
      const { status, dataPagamento, ...payloadCriacao } = data;
      const criada = await createMensalidade({
        alunoId,
        data: payloadCriacao,
      });

      if (status === "PAGO" && criada?.id) {
        return await registrarPagamentoMensalidade({
          alunoId,
          mensalidadeId: criada.id,
          dataPagamento: dataPagamento || new Date().toISOString(),
        });
      }

      if (status === "ATRASADO" && criada?.id) {
        return await updateMensalidade({
          alunoId,
          mensalidadeId: criada.id,
          data: { status: "ATRASADO" },
        });
      }

      return criada;
    },
    onSuccess: (_, variables) => {
      invalidateMensalidades(queryClient, variables.alunoId);
      if (variables?.alunoId) {
        queryClient.invalidateQueries({
          queryKey: ["notificacoes", variables.alunoId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["notificacoes-responsavel"] });
    },
  });
}

/**
 * Registra pagamento da mensalidade (PATCH /alunos/:alunoId/mensalidades/:mensalidadeId/pagamento)
 */
export function useRegistrarPagamentoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alunoId, mensalidadeId, dataPagamento }) =>
      registrarPagamentoMensalidade({
        alunoId,
        mensalidadeId,
        dataPagamento,
      }),
    onSuccess: (_, variables) => {
      invalidateMensalidades(queryClient, variables.alunoId);
      if (variables?.alunoId) {
        queryClient.invalidateQueries({
          queryKey: ["notificacoes", variables.alunoId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["notificacoes-responsavel"] });
    },
  });
}

/**
 * Atualiza mensalidade (PUT /alunos/:alunoId/mensalidades/:mensalidadeId)
 */
export function useUpdateMensalidadeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alunoId, mensalidadeId, data }) =>
      updateMensalidade({ alunoId, mensalidadeId, data }),
    onSuccess: (_, variables) => {
      invalidateMensalidades(queryClient, variables.alunoId);
      if (variables?.alunoId) {
        queryClient.invalidateQueries({
          queryKey: ["notificacoes", variables.alunoId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["notificacoes-responsavel"] });
    },
  });
}

/**
 * Remove mensalidade (DELETE /alunos/:alunoId/mensalidades/:mensalidadeId)
 */
export function useDeleteMensalidadeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alunoId, mensalidadeId }) =>
      deleteMensalidade({ alunoId, mensalidadeId }),
    onSuccess: (_, variables) => {
      invalidateMensalidades(queryClient, variables.alunoId);
      if (variables?.alunoId) {
        queryClient.invalidateQueries({
          queryKey: ["notificacoes", variables.alunoId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["notificacoes-responsavel"] });
    },
  });
}

/**
 * Dispara cobrança em 1 clique para o responsável
 * (POST /alunos/:alunoId/mensalidades/:mensalidadeId/cobrar)
 */
export function useDispararCobrancaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alunoId, mensalidadeId }) =>
      dispararCobrancaMensalidade({ alunoId, mensalidadeId }),
    onSuccess: (_, variables) => {
      invalidateMensalidades(queryClient, variables.alunoId);
      if (variables?.alunoId) {
        queryClient.invalidateQueries({
          queryKey: ["notificacoes", variables.alunoId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["notificacoes-responsavel"] });
    },
  });
}