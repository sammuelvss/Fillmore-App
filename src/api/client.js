import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

/**
 * URL base do Back-end Express 5 + PostgreSQL (NeonDB/Vercel).
 * Lida diretamente da variável de ambiente `EXPO_PUBLIC_API_URL` definida no arquivo `.env` na raiz do projeto.
 * (Nota: não coloque barra `/` no final da URL no `.env`).
 */
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4001"
)
  .trim()
  .replace(/\/+$/, "");

/**
 * Instância central do Axios para comunicação com o Back-end Express 5.
 * Configurada com:
 * 1. `baseURL`: lida exclusivamente de `process.env.EXPO_PUBLIC_API_URL` (definida no `.env`).
 * 2. Request Interceptor: injeta automaticamente `Authorization: Bearer <token>` lido do Zustand (`useAuthStore`).
 * 3. Response Interceptor: extrai mensagens amigáveis do `errorMiddleware` (`err.response.data.message`) e limpa a sessão em caso de 401.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const apiMessage = error.response?.data?.message;

    // Se o token expirou ou foi revogado na tabela TokenRevogado (401), limpa sessão local
    // (Exceto se o 401 veio da própria tentativa de login em POST /session)
    const isLoginAttempt =
      error.config?.url?.includes("/session") &&
      error.config?.method?.toLowerCase() === "post";

    if (status === 401 && !isLoginAttempt) {
      useAuthStore.getState().clearAuth();
    }

    // Anexa mensagem amigável padronizada pelo AppError do Express 5
    error.friendlyMessage =
      apiMessage ||
      (status === 429
        ? "Muitas tentativas seguidas (Rate Limit). Aguarde alguns minutos."
        : status === 403
          ? "Você não tem permissão para realizar esta operação."
          : error.message === "Network Error"
            ? "Sem conexão com o servidor. Verifique o arquivo .env (EXPO_PUBLIC_API_URL) e sua internet."
            : "Ocorreu um erro inesperado na comunicação com o servidor.");

    return Promise.reject(error);
  },
);

export default apiClient;
