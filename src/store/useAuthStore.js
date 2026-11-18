import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Store global de Autenticação e Sessão (Zustand + AsyncStorage)
 *
 * IMPORTANTE (Dica de Ouro):
 * O back-end possui `authLimiterMiddleware` (máx. 5 logins a cada 15 min por IP).
 * Ao persistir `token` e `user` no AsyncStorage, o Fast Refresh do Expo Go
 * e a reabertura do app na apresentação não exigem novo login na API!
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isHydrated: false,

      /**
       * Salva o usuário, o access token e o refresh token após login
       */
      setAuth: (user, token, refreshToken = null) =>
        set({
          user,
          token,
          refreshToken,
        }),

      // Atualiza os tokens após rotação em POST /session/refresh
      setTokens: ({ token, refreshToken, user }) =>
        set((state) => ({
          token,
          refreshToken: refreshToken ?? state.refreshToken,
          user: user ?? state.user,
        })),

      /**
       * Atualiza apenas os dados do usuário no estado (ex.: após PUT /users/:userId pelo Samuel)
       */
      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : partialUser,
        })),

      /**
       * Limpa a sessão localmente (chamado no Logout ou quando a API retorna 401)
       */
      clearAuth: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
        }),

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      /**
       * Helpers de perfil
       */
      isMotorista: () => get().user?.tipo === "MOTORISTA",
      isResponsavel: () => get().user?.tipo === "RESPONSAVEL",
      getMotoristaId: () => get().user?.motorista?.id || null,
      getResponsavelId: () => get().user?.responsavel?.id || null,
    }),
    {
      name: "@fillmore:auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    },
  ),
);

export default useAuthStore;
