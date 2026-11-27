import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { getRotas } from "../api/rotasApi";
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

const getOwnedAlunosKey = (userId) => `@fillmore:owned-alunos:${userId}`;
const getOwnedRespKey = (userId) => `@fillmore:owned-responsaveis:${userId}`;

export const registrarAlunoDoMotoristaLocal = async (userId, alunoId) => {
  if (!userId || !alunoId) return;
  try {
    const raw = await AsyncStorage.getItem(getOwnedAlunosKey(userId));
    const list = raw ? JSON.parse(raw) : [];
    const set = new Set([...(Array.isArray(list) ? list : []), String(alunoId)]);
    await AsyncStorage.setItem(
      getOwnedAlunosKey(userId),
      JSON.stringify(Array.from(set)),
    );
  } catch {
    // ignore storage errors
  }
};

export const registrarResponsavelDoMotoristaLocal = async (userId, respId) => {
  if (!userId || !respId) return;
  try {
    const raw = await AsyncStorage.getItem(getOwnedRespKey(userId));
    const list = raw ? JSON.parse(raw) : [];
    const set = new Set([...(Array.isArray(list) ? list : []), String(respId)]);
    await AsyncStorage.setItem(
      getOwnedRespKey(userId),
      JSON.stringify(Array.from(set)),
    );
  } catch {
    // ignore storage errors
  }
};

const lerSetLocal = async (storageKey) => {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.map(String) : []);
  } catch {
    return new Set();
  }
};

/**
 * Listagem de alunos isolada por motorista logado:
 * - O endpoint `GET /alunos` do back-end retorna todos os alunos do banco sem filtrar por `motoristaId`
 *   (pois no schema Prisma `Aluno` se liga ao `Motorista` através de `rotaIda` / `rotaVolta`).
 * - Aqui filtramos para exibir APENAS:
 *   1) Alunos vinculados a qualquer rota pertencente ao motorista logado (`GET /rotas` já é isolado por JWT);
 *   2) Alunos recém-criados por este motorista neste aparelho (ainda sem rota vinculada).
 * Assim, uma conta nova começa com 0 alunos (sem ver os alunos da Dona Olga) e vê os alunos que ela mesma criar!
 */
export const useAlunosQuery = (options = {}) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isResponsavel = user?.tipo === "RESPONSAVEL";
  const responsavelId = user?.responsavel?.id;
  const userId = user?.id;
  const motoristaId = user?.motorista?.id;

  return useQuery({
    queryKey: isResponsavel
      ? [...ALUNOS_KEYS.all, "responsavel", responsavelId]
      : [...ALUNOS_KEYS.all, "motorista", userId || "anon"],
    queryFn: async () => {
      if (isResponsavel && responsavelId) {
        return getAlunosDoResponsavel(responsavelId);
      }

      const [todosRaw, rotasRaw, ownedIds] = await Promise.all([
        getAlunos(),
        getRotas().catch(() => []),
        userId ? lerSetLocal(getOwnedAlunosKey(userId)) : Promise.resolve(new Set()),
      ]);

      const todosAlunos = Array.isArray(todosRaw)
        ? todosRaw
        : todosRaw?.alunos || todosRaw?.data || [];
      const minhasRotas = Array.isArray(rotasRaw)
        ? rotasRaw
        : rotasRaw?.rotas || rotasRaw?.data || [];

      const minhasRotasIds = new Set(minhasRotas.map((r) => String(r.id)));
      const alunosIdsNasMinhasRotas = new Set();

      minhasRotas.forEach((rota) => {
        const vinculados = [
          ...(Array.isArray(rota.alunosIda) ? rota.alunosIda : []),
          ...(Array.isArray(rota.alunosVolta) ? rota.alunosVolta : []),
          ...(Array.isArray(rota.alunos) ? rota.alunos : []),
        ];
        vinculados.forEach((a) => {
          if (a?.id) alunosIdsNasMinhasRotas.add(String(a.id));
        });
      });

      return todosAlunos.filter((aluno) => {
        const idStr = String(aluno.id);
        if (ownedIds.has(idStr)) return true;
        if (alunosIdsNasMinhasRotas.has(idStr)) return true;

        const rIda = aluno.rotaIdaId ?? aluno.rotaIda?.id;
        const rVolta = aluno.rotaIdtaId ?? aluno.rotaVoltaId ?? aluno.rotaVolta?.id;
        if (rIda && minhasRotasIds.has(String(rIda))) return true;
        if (rVolta && minhasRotasIds.has(String(rVolta))) return true;

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
    },
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
 * Lista usuários com perfil RESPONSAVEL vinculados aos alunos deste motorista
 * ou recém-cadastrados por este motorista neste aparelho.
 */
export const useResponsaveisQuery = (options = {}) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isMotorista = user?.tipo === "MOTORISTA" || !user?.tipo;
  const userId = user?.id;
  const motoristaId = user?.motorista?.id;

  return useQuery({
    queryKey: [...ALUNOS_KEYS.responsaveis, userId || "anon"],
    queryFn: async () => {
      const [todosResp, todosAlunosRaw, rotasRaw, ownedAlunos, ownedResp] =
        await Promise.all([
          getResponsaveis(),
          getAlunos().catch(() => []),
          getRotas().catch(() => []),
          userId
            ? lerSetLocal(getOwnedAlunosKey(userId))
            : Promise.resolve(new Set()),
          userId
            ? lerSetLocal(getOwnedRespKey(userId))
            : Promise.resolve(new Set()),
        ]);

      const minhasRotas = Array.isArray(rotasRaw) ? rotasRaw : [];
      const minhasRotasIds = new Set(minhasRotas.map((r) => String(r.id)));
      const todosAlunos = Array.isArray(todosAlunosRaw) ? todosAlunosRaw : [];

      const respIdsDoMotorista = new Set(ownedResp);
      todosAlunos.forEach((a) => {
        const pertence =
          ownedAlunos.has(String(a.id)) ||
          (a.rotaIdaId && minhasRotasIds.has(String(a.rotaIdaId))) ||
          (a.rotaVoltaId && minhasRotasIds.has(String(a.rotaVoltaId))) ||
          (motoristaId &&
            (String(a.rotaIda?.motoristaId) === String(motoristaId) ||
              String(a.rotaVolta?.motoristaId) === String(motoristaId)));
        if (pertence && a.responsavelId) {
          respIdsDoMotorista.add(String(a.responsavelId));
        }
      });

      return (Array.isArray(todosResp) ? todosResp : []).filter((u) =>
        respIdsDoMotorista.has(String(u.responsavel?.id)),
      );
    },
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
  queryClient.invalidateQueries({ queryKey: ALUNOS_KEYS.responsaveis });
};

/**
 * Criação de aluno (`POST /alunos`)
 * Salva o ID do aluno recém-criado no escopo local do motorista logado para que ele
 * apareça imediatamente na lista do motorista mesmo antes de ser vinculado a uma rota.
 */
export const useCreateAlunoMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useAppStore((state) => state.showSnackbar);
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: async (payload) => {
      const novoAluno = await createAluno(payload);
      if (userId && novoAluno?.id) {
        await registrarAlunoDoMotoristaLocal(userId, novoAluno.id);
      }
      return novoAluno;
    },
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
      invalidateAlunosERotas(
        queryClient,
        variables?.rotaId,
        variables?.alunoId,
      );
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
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: async (variables) => {
      if (userId && variables?.alunoId) {
        // Mantém o aluno visível na lista do motorista mesmo após ser desvinculado da rota
        await registrarAlunoDoMotoristaLocal(userId, variables.alunoId);
      }
      return desvincularAlunoDaRota(variables);
    },
    onSuccess: (_, variables) => {
      invalidateAlunosERotas(
        queryClient,
        variables?.rotaId,
        variables?.alunoId,
      );
      showSnackbar("Aluno desvinculado da rota.", "info");
    },
    onError: (error) => {
      showSnackbar(
        error.friendlyMessage ||
          "Não foi possível desvincular o aluno da rota.",
        "error",
      );
    },
  });
};
