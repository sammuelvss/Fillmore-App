import apiClient from "./client";

/**
 * ============================================================================
 * MÓDULO DE API: OPERAÇÃO DIÁRIA (Responsável: EDMUNDO — 5º a atuar)
 * ============================================================================
 * Endpoints do Back-end Express 5:
 * 1. Check-list Diário de Presença (Embarque):
 *    - GET    /alunos/:alunoId/presencas
 *    - POST   /alunos/:alunoId/presencas
 *    - PUT    /alunos/:alunoId/presencas/:id
 *    - DELETE /alunos/:alunoId/presencas/:id
 *
 * 2. Cancelamento Pontual de Viagem Diária:
 *    - GET    /alunos/:alunoId/viagens
 *    - POST   /alunos/:alunoId/viagens
 *
 * 3. Central de Avisos / Notificações Operacionais:
 *    - GET    /alunos/:alunoId/notificacoes
 *    - POST   /alunos/:alunoId/notificacoes
 *    - GET    /rotas/:rotaId/avisos
 *    - POST   /rotas/:rotaId/avisos
 *    - PATCH  /notificacoes/:id/lida
 */

// --- PRESENÇAS (CHECK-LIST DIÁRIO) ---

export const getPresencasDoAluno = async (alunoId) => {
  const response = await apiClient.get(`/alunos/${alunoId}/presencas`);
  return response.data;
};

export const registrarPresenca = async ({ alunoId, data }) => {
  const response = await apiClient.post(`/alunos/${alunoId}/presencas`, data);
  return response.data;
};

export const atualizarPresenca = async ({ alunoId, presencaId, data }) => {
  const response = await apiClient.put(
    `/alunos/${alunoId}/presencas/${presencaId}`,
    data,
  );
  return response.data;
};

export const removerPresenca = async ({ alunoId, presencaId }) => {
  await apiClient.delete(`/alunos/${alunoId}/presencas/${presencaId}`);
  return presencaId;
};

// --- CANCELAMENTO DE VIAGENS DIÁRIAS ---

export const getViagensDoAluno = async (alunoId) => {
  const response = await apiClient.get(`/alunos/${alunoId}/viagens`);
  return response.data;
};

export const cancelarViagemDiaria = async ({ alunoId, data }) => {
  const response = await apiClient.post(`/alunos/${alunoId}/viagens`, data);
  return response.data;
};

// --- AVISOS E NOTIFICAÇÕES ---

export const getNotificacoesDoAluno = async (alunoId) => {
  const response = await apiClient.get(`/alunos/${alunoId}/notificacoes`);
  return response.data;
};

export const criarNotificacaoAluno = async ({ alunoId, data }) => {
  const response = await apiClient.post(
    `/alunos/${alunoId}/notificacoes`,
    data,
  );
  return response.data;
};

export const marcarNotificacaoComoLida = async (notificacaoId) => {
  const response = await apiClient.patch(`/notificacoes/${notificacaoId}/lida`);
  return response.data;
};

export default {
  getPresencasDoAluno,
  registrarPresenca,
  atualizarPresenca,
  removerPresenca,
  getViagensDoAluno,
  cancelarViagemDiaria,
  getNotificacoesDoAluno,
  criarNotificacaoAluno,
  marcarNotificacaoComoLida,
};
