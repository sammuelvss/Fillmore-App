import apiClient from "./client";

/**
 * ============================================================================
 * MÓDULO DE API: MENSALIDADES & PIX (Responsável: PAULO — 4º a atuar)
 * ============================================================================
 * Endpoints do Back-end Express 5:
 * 1. Relacionamento 2 (URL Composta Obrigatória — Aluno <-> Mensalidades):
 *    - GET    /alunos/:alunoId/mensalidades
 *    - POST   /alunos/:alunoId/mensalidades
 *    - GET    /alunos/:alunoId/mensalidades/:id
 *    - PUT    /alunos/:alunoId/mensalidades/:id
 *    - DELETE /alunos/:alunoId/mensalidades/:id
 *
 * 2. Extrato de Inadimplência e Ciência do Responsável (+ Chave Pix):
 *    - GET    /responsaveis/:responsavelId/mensalidades/pendentes
 *
 * 3. Disparo de Lembrete de Cobrança em 1 Clique (Motorista -> Responsável):
 *    - POST   /alunos/:alunoId/mensalidades/:mensalidadeId/cobrar
 */

export const getMensalidadesDoAluno = async (alunoId) => {
  const response = await apiClient.get(`/alunos/${alunoId}/mensalidades`);
  return response.data;
};

export const createMensalidade = async ({ alunoId, data }) => {
  const response = await apiClient.post(
    `/alunos/${alunoId}/mensalidades`,
    data,
  );
  return response.data;
};

export const updateMensalidade = async ({ alunoId, mensalidadeId, data }) => {
  const response = await apiClient.put(
    `/alunos/${alunoId}/mensalidades/${mensalidadeId}`,
    data,
  );
  return response.data;
};

export const deleteMensalidade = async ({ alunoId, mensalidadeId }) => {
  await apiClient.delete(`/alunos/${alunoId}/mensalidades/${mensalidadeId}`);
  return mensalidadeId;
};

export const getMensalidadesPendentesResponsavel = async (responsavelId) => {
  const response = await apiClient.get(
    `/responsaveis/${responsavelId}/mensalidades/pendentes`,
  );
  return response.data;
};

export const dispararCobrancaMensalidade = async ({
  alunoId,
  mensalidadeId,
}) => {
  const response = await apiClient.post(
    `/alunos/${alunoId}/mensalidades/${mensalidadeId}/cobrar`,
  );
  return response.data;
};

export default {
  getMensalidadesDoAluno,
  createMensalidade,
  updateMensalidade,
  deleteMensalidade,
  getMensalidadesPendentesResponsavel,
  dispararCobrancaMensalidade,
};
