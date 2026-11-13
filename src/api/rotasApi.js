import apiClient from "./client";

/**
 * Módulo de API: Rotas Escolares (Responsável: Sammuel - Etapa 2)
 * Consome os endpoints REST protegidos por JWT no Back-end Express 5:
 * - GET    /rotas
 * - GET    /rotas/:id
 * - POST   /rotas
 * - PUT    /rotas/:id
 * - DELETE /rotas/:id
 */

/**
 * Lista todas as rotas pertencentes ao motorista autenticado.
 * Inclui dados do motorista (`capacidadeVan`) e listas `alunosIda` / `alunosVolta`.
 */
export const getRotas = async () => {
  const response = await apiClient.get("/rotas");
  return response.data;
};

/**
 * Busca os detalhes de uma rota específica pelo seu UUID v4.
 * @param {string} id - UUID da rota
 */
export const getRotaById = async (id) => {
  const response = await apiClient.get(`/rotas/${id}`);
  return response.data;
};

/**
 * Cria uma nova rota escolar vinculada ao motorista autenticado.
 * @param {Object} data
 * @param {string} data.nome - Ex.: "Rota Boa Viagem -> Colégios Derby"
 * @param {"MANHA"|"TARDE"} data.turno - Turno da rota
 * @param {number|null} [data.pontoInicialLat]
 * @param {number|null} [data.pontoInicialLng]
 * @param {number|null} [data.pontoFinalLat]
 * @param {number|null} [data.pontoFinalLng]
 * @param {number|null} [data.distanciaTotalKm]
 * @param {number|null} [data.tempoEstimadoMin]
 */
export const createRota = async (data) => {
  const response = await apiClient.post("/rotas", data);
  return response.data;
};

/**
 * Atualiza uma rota escolar existente.
 * @param {Object} params
 * @param {string} params.id - UUID da rota
 * @param {Object} params.data - Campos a atualizar
 */
export const updateRota = async ({ id, data }) => {
  const response = await apiClient.put(`/rotas/${id}`, data);
  return response.data;
};

/**
 * Exclui uma rota escolar pelo seu UUID.
 * @param {string} id - UUID da rota
 */
export const deleteRota = async (id) => {
  await apiClient.delete(`/rotas/${id}`);
  return id;
};

// Consulta o trajeto otimizado do dia (Rota Inteligente)
export const getTrajetoOtimizado = async ({ id, data }) => {
  const response = await apiClient.get(`/rotas/${id}/trajeto`, {
    params: data ? { data } : undefined,
  });
  return response.data;
};

// Força o recálculo e persistência da melhor sequência de paradas
export const otimizarRota = async ({ id, data }) => {
  const response = await apiClient.post(
    `/rotas/${id}/otimizar`,
    data ? { data } : {},
  );
  return response.data;
};

export default {
  getRotas,
  getRotaById,
  createRota,
  updateRota,
  deleteRota,
  getTrajetoOtimizado,
  otimizarRota,
};
