import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";
import { queryClient } from "../lib/queryClient";

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

// Renova a sessão uma única vez mesmo com várias requisições 401 simultâneas
let refreshPromise = null;

const renovarSessao = async () => {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) throw new Error("Sem refresh token");

  if (!refreshPromise) {
    // Usa axios puro para não passar pelos interceptors
    refreshPromise = axios
      .post(`${API_BASE_URL}/session/refresh`, { refreshToken }, { timeout: 15000 })
      .then(({ data }) => {
        setTokens({
          token: data.token,
          refreshToken: data.refreshToken,
          user: data.user,
        });
        return data.token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Garante limpeza única da sessão expirada (sem loop em 401 simultâneos)
let limpandoSessaoExpirada = false;

const encerrarSessaoExpirada = () => {
  const { token, clearAuth } = useAuthStore.getState();
  if (!token || limpandoSessaoExpirada) return;

  limpandoSessaoExpirada = true;
  try {
    clearAuth();
    useAppStore.getState().resetOperacional();
    queryClient.clear();
    useAppStore.getState().showSnackbar("Sessão expirada", "error");
  } finally {
    setTimeout(() => {
      limpandoSessaoExpirada = false;
    }, 500);
  }
};

const isRotaDeAutenticacao = (config) => {
  const url = config?.url || "";
  const method = config?.method?.toLowerCase();
  return (url.endsWith("/session") && method === "post") || url.includes("/session/refresh");
};

const anexarMensagemAmigavel = (error) => {
  const status = error.response?.status;
  const apiMessage = error.response?.data?.message;
  const semRede =
    !error.response ||
    error.message === "Network Error" ||
    error.code === "ECONNABORTED";

  error.friendlyMessage =
    apiMessage ||
    (status === 429
      ? "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo."
      : status === 403
        ? "Você não tem permissão para realizar esta operação."
        : semRede
          ? "Sem conexão. Verifique a internet e tente de novo."
          : "Ocorreu um erro inesperado na comunicação com o servidor.");

  return error;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config;

    // Access token expirado/revogado: tenta renovar com o refresh token e repete a requisição
    if (status === 401 && original && !original._retry && !isRotaDeAutenticacao(original)) {
      original._retry = true;
      try {
        const novoToken = await renovarSessao();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${novoToken}`;
        return apiClient(original);
      } catch {
        encerrarSessaoExpirada();
      }
    }

    return Promise.reject(anexarMensagemAmigavel(error));
  },
);

export default apiClient;
