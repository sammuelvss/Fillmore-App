import apiClient from "./client";

/**
 * ============================================================================
 * MÓDULO DE API: ALUNOS & RELACIONAMENTO 1 (Responsável: JOAO — 3º a atuar)
 * ============================================================================
 * Endpoints do Back-end Express 5:
 * 1. CRUD de Alunos:
 *    - GET    /alunos
 *    - GET    /alunos/:id
 *    - POST   /alunos
 *    - PUT    /alunos/:id
 *    - DELETE /alunos/:id
 *
 * 2. Relacionamento 1 (URL Composta Obrigatória — Rota <-> Alunos):
 *    - GET    /rotas/:rotaId/alunos            -> Lista alunos vinculados à rota
 *    - POST   /rotas/:rotaId/alunos            -> Vincula aluno { alunoId, tipoTrajeto: "IDA"|"VOLTA", ordemNaRota }
 *                                                 (Valida lotação máxima da van! Retorna 409 se lotada)
 *    - DELETE /rotas/:rotaId/alunos/:alunoId   -> Desvincula o aluno da rota
 *
 * 3. Visão do Responsável:
 *    - GET    /responsaveis/:responsavelId/alunos -> Lista filhos do responsável logado
 */

export const getAlunos = async () => {
  const response = await apiClient.get("/alunos");
  return response.data;
};

export const getAlunoById = async (id) => {
  const response = await apiClient.get(`/alunos/${id}`);
  return response.data;
};

export const createAluno = async (data) => {
  const response = await apiClient.post("/alunos", data);
  return response.data;
};

export const updateAluno = async ({ id, data }) => {
  const response = await apiClient.put(`/alunos/${id}`, data);
  return response.data;
};

export const deleteAluno = async (id) => {
  await apiClient.delete(`/alunos/${id}`);
  return id;
};

// --- RELACIONAMENTO 1 (URL Composta: /rotas/:rotaId/alunos) ---

export const getAlunosDaRota = async (rotaId) => {
  const response = await apiClient.get(`/rotas/${rotaId}/alunos`);
  return response.data;
};

export const vincularAlunoNaRota = async ({
  rotaId,
  alunoId,
  tipoTrajeto,
  ordemNaRota,
}) => {
  const response = await apiClient.post(`/rotas/${rotaId}/alunos`, {
    alunoId,
    tipoTrajeto,
    ordemNaRota,
  });
  return response.data;
};

export const desvincularAlunoDaRota = async ({ rotaId, alunoId }) => {
  await apiClient.delete(`/rotas/${rotaId}/alunos/${alunoId}`);
  return { rotaId, alunoId };
};

// --- SUB-ROTA DO RESPONSÁVEL ---

export const getAlunosDoResponsavel = async (responsavelId) => {
  const response = await apiClient.get(
    `/responsaveis/${responsavelId}/alunos`,
  );
  return response.data;
};

export default {
  getAlunos,
  getAlunoById,
  createAluno,
  updateAluno,
  deleteAluno,
  getAlunosDaRota,
  vincularAlunoNaRota,
  desvincularAlunoDaRota,
  getAlunosDoResponsavel,
};
