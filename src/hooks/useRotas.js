import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRotas,
  getRotaById,
  createRota,
  updateRota,
  deleteRota,
  getTrajetoOtimizado,
  otimizarRota,
} from "../api/rotasApi";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";

export const ROTAS_QUERY_KEY = ["rotas"];

/**
 * Custom Hook (TanStack Query v5): Listagem de Rotas Escolares (`GET /rotas`)
 * Só dispara quando o usuário está autenticado e com perfil MOTORISTA.
 */
export const useRotasQuery = (options = {}) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isMotorista = user?.tipo === "MOTORISTA" || !user?.tipo;

  return useQuery({
    queryKey: ROTAS_QUERY_KEY,
    queryFn: getRotas,
    enabled: Boolean(token) && isMotorista && (options.enabled ?? true),
    staleTime: 1000 * 30, // 30 segundos de cache fresco
    ...options,
  });
};

/**
 * Custom Hook (TanStack Query v5): Detalhe de uma Rota (`GET /rotas/:id`)
 */
export const useRotaDetailQuery = (id) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...ROTAS_QUERY_KEY, id],
    queryFn: () => getRotaById(id),
    enabled: Boolean(token && id),
  });
};

/**
 * Custom Hook (TanStack Query v5): Criação de Rota (`POST /rotas`)
 * Invalida automaticamente a listagem `['rotas']` e exibe feedback no Snackbar global.
 */
export const useCreateRotaMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: createRota,
    onSuccess: (novaRota) => {
      queryClient.invalidateQueries({ queryKey: ROTAS_QUERY_KEY });
      showSnackbar(
        `Rota "${novaRota?.nome || "Nova Rota"}" criada com sucesso!`,
        "success",
      );
    },
    onError: (error) => {
      showSnackbar(
        error.friendlyMessage || "Não foi possível criar a rota.",
        "error",
      );
    },
  });
};

/**
 * Custom Hook (TanStack Query v5): Atualização de Rota (`PUT /rotas/:id`)
 * Invalida a listagem `['rotas']` e o detalhe `['rotas', id]`.
 */
export const useUpdateRotaMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: updateRota,
    onSuccess: (rotaAtualizada, variables) => {
      queryClient.invalidateQueries({ queryKey: ROTAS_QUERY_KEY });
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: [...ROTAS_QUERY_KEY, variables.id],
        });
      }
      showSnackbar(
        `Rota "${rotaAtualizada?.nome || ""}" atualizada com sucesso!`,
        "success",
      );
    },
    onError: (error) => {
      showSnackbar(
        error.friendlyMessage || "Não foi possível atualizar a rota.",
        "error",
      );
    },
  });
};

/**
 * Custom Hook (TanStack Query v5): Exclusão de Rota (`DELETE /rotas/:id`)
 * Invalida o cache de rotas após confirmação de exclusão.
 */
export const useDeleteRotaMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: deleteRota,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROTAS_QUERY_KEY });
      showSnackbar("Rota excluída com sucesso.", "success");
    },
    onError: (error) => {
      showSnackbar(
        error.friendlyMessage || "Não foi possível excluir a rota.",
        "error",
      );
    },
  });
};

export const useTrajetoOtimizadoQuery = (id, data, options = {}) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: [...ROTAS_QUERY_KEY, "trajeto", id, data || "hoje"],
    queryFn: () => getTrajetoOtimizado({ id, data }),
    enabled:
      Boolean(token) &&
      Boolean(id) &&
      (options.enabled !== undefined ? options.enabled : true),
  });
};

export const useOtimizarRotaMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: otimizarRota,
    onSuccess: (trajeto, variables) => {
      const id = variables?.id;
      const dataKey = variables?.data || trajeto?.dataReferencia || "hoje";

      if (id && trajeto) {
        queryClient.setQueryData(
          [...ROTAS_QUERY_KEY, "trajeto", id, dataKey],
          trajeto,
        );
        queryClient.invalidateQueries({
          queryKey: [...ROTAS_QUERY_KEY, "trajeto", id],
        });
      }
      queryClient.invalidateQueries({ queryKey: ROTAS_QUERY_KEY });
      showSnackbar("Rota recalculada com sucesso!", "success");
    },
    onError: (error) => {
      showSnackbar(
        error.friendlyMessage || "Não foi possível recalcular a rota.",
        "error",
      );
    },
  });
};
