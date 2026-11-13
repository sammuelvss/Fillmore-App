import apiClient from "./client";

// API de Operação Diária: presenças, viagens e notificações

// --- PRESENÇAS ---

export const getPresencasDoAluno = async (alunoId, params) => {
  const response = await apiClient.get(`/alunos/${alunoId}/presencas`, { params });
  return response.data;
};

export const registrarPresenca = async ({ alunoId, data }) => {
  const response = await apiClient.post(`/alunos/${alunoId}/presencas`, data);
  return response.data;
};

export const atualizarPresenca = async ({ alunoId, presencaId, data }) => {
  const response = await apiClient.put(`/alunos/${alunoId}/presencas/${presencaId}`, data);
  return response.data;
};

export const removerPresenca = async ({ alunoId, presencaId }) => {
  await apiClient.delete(`/alunos/${alunoId}/presencas/${presencaId}`);
  return presencaId;
};

// --- VIAGENS DIÁRIAS ---

export const getViagensDoAluno = async (alunoId, params) => {
  const response = await apiClient.get(`/alunos/${alunoId}/viagens`, { params });
  return response.data;
};

export const cancelarViagemDiaria = async ({ alunoId, data }) => {
  const response = await apiClient.post(`/alunos/${alunoId}/viagens`, data);
  return response.data;
};

export const atualizarViagemDiaria = async ({ alunoId, viagemId, data }) => {
  const response = await apiClient.put(`/alunos/${alunoId}/viagens/${viagemId}`, data);
  return response.data;
};

export const removerViagemDiaria = async ({ alunoId, viagemId }) => {
  await apiClient.delete(`/alunos/${alunoId}/viagens/${viagemId}`);
  return viagemId;
};

// --- AVISOS E NOTIFICAÇÕES ---

export const getNotificacoesDoAluno = async (alunoId, params) => {
  const response = await apiClient.get(`/alunos/${alunoId}/notificacoes`, { params });
  return response.data;
};

export const getNotificacoesDoResponsavel = async (responsavelId, params) => {
  const response = await apiClient.get(`/responsaveis/${responsavelId}/notificacoes`, { params });
  return response.data;
};

export const criarNotificacaoAluno = async ({ alunoId, data }) => {
  const response = await apiClient.post(`/alunos/${alunoId}/notificacoes`, data);
  return response.data;
};

export const atualizarNotificacao = async ({ alunoId, notificacaoId, data }) => {
  const response = await apiClient.put(`/alunos/${alunoId}/notificacoes/${notificacaoId}`, data);
  return response.data;
};

export const removerNotificacao = async ({ alunoId, notificacaoId }) => {
  await apiClient.delete(`/alunos/${alunoId}/notificacoes/${notificacaoId}`);
  return notificacaoId;
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
  atualizarViagemDiaria,
  removerViagemDiaria,
  getNotificacoesDoAluno,
  getNotificacoesDoResponsavel,
  criarNotificacaoAluno,
  atualizarNotificacao,
  removerNotificacao,
  marcarNotificacaoComoLida,
};
