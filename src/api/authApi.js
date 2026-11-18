import apiClient from "./client";
import { useAuthStore } from "../store/useAuthStore";

/**
 * ============================================================================
 * MÓDULO DE API: AUTENTICAÇÃO E PERFIL (Responsável: SAMUEL — 2º a atuar)
 * ============================================================================
 * Endpoints do Back-end Express 5:
 * - POST   /session         -> Login (retorna { user, token, refreshToken }) — Rate Limit: 5 req / 15 min
 * - POST   /session/refresh -> Rotaciona o refresh token (retorna { user, token, refreshToken })
 * - DELETE /session         -> Logout (revoga access token e a família do refresh token - HTTP 204)
 * - GET    /session         -> Retorna dados da sessão atual (req.user)
 * - POST   /users           -> Sign Up (cria Usuario + Motorista ou Responsavel em transação)
 * - GET    /users/:userId   -> Obtém perfil completo do usuário logado
 * - PUT    /users/:userId   -> Atualiza nome, telefone, senha e dados de Motorista (CNH, placa, capacidadeVan, chavePix, titularPix)
 * - DELETE /users/:userId   -> Exclui a conta do usuário
 */

export const loginRequest = async ({ email, senha }) => {
  const response = await apiClient.post("/session", { email, senha });
  return response.data; // { user, token, refreshToken }
};

export const logoutRequest = async () => {
  const { refreshToken } = useAuthStore.getState();
  await apiClient.delete("/session", {
    data: refreshToken ? { refreshToken } : undefined,
  });
  return true;
};

export const getSessionRequest = async (tokenOverride) => {
  const response = await apiClient.get(
    "/session",
    tokenOverride
      ? { headers: { Authorization: `Bearer ${tokenOverride}` } }
      : undefined,
  );
  return response.data;
};

export const signUpRequest = async (userData) => {
  // Nota: caso o back-end valide `username` no schema Zod de POST /users,
  // enviamos `username` espelhando `nome` para total compatibilidade.
  const payload = {
    ...userData,
    username: userData.username || userData.nome,
  };
  const response = await apiClient.post("/users", payload);
  return response.data;
};

export const getUserProfile = async (userId) => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

export const updateUserProfile = async ({ userId, data }) => {
  const response = await apiClient.put(`/users/${userId}`, data);
  return response.data;
};

export const deleteUserAccount = async (userId) => {
  await apiClient.delete(`/users/${userId}`);
  return true;
};

export default {
  loginRequest,
  logoutRequest,
  getSessionRequest,
  signUpRequest,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
};
