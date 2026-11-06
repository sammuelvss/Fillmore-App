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
      isHydrated: false,

      /**
       * Salva o usuário e o token JWT após login ou Quick Token Dev
       */
      setAuth: (user, token) =>
        set({
          user,
          token,
        }),

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
