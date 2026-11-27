import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  loginRequest,
  logoutRequest,
  signUpRequest,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
} from "../api/authApi";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";

// Hooks de autenticação e perfil (Samuel)

const profileKey = (userId) => ["user-profile", userId];

export const useLoginMutation = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: ({ user, token, refreshToken }) => {
      if (user?.tipo === "RESPONSAVEL") {
        showSnackbar("Este app é para motoristas", "error");
        return;
      }
      setAuth(user, token, refreshToken);
      showSnackbar(`Bem-vindo(a), ${user?.nome || "motorista"}!`, "success");
    },
    onError: (e) =>
      showSnackbar(e.friendlyMessage || "Falha ao autenticar.", "error"),
  });
};

export const useSignUpMutation = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const router = useRouter();

  return useMutation({
    mutationFn: async (userData) => {
      const created = await signUpRequest(userData);
      // Tenta autenticar automaticamente após criar a conta do motorista
      try {
        const session = await loginRequest({
          email: userData.email,
          senha: userData.senha,
        });
        return { created, session };
      } catch {
        return { created, session: null };
      }
    },
    onSuccess: ({ session }) => {
      if (session?.token && session?.user) {
        setAuth(session.user, session.token, session.refreshToken);
        showSnackbar(
          `Conta criada! Bem-vindo(a), ${session.user.nome || "motorista"}!`,
          "success",
        );
      } else {
        showSnackbar("Conta criada! Entre com seu e-mail e senha.", "success");
        router.back();
      }
    },
    onError: (e) =>
      showSnackbar(e.friendlyMessage || "Não foi possível cadastrar.", "error"),
  });
};

// Logout: revoga o token na API; se falhar, sai localmente mesmo assim
export const useLogoutMutation = () => {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const resetOperacional = useAppStore((s) => s.resetOperacional);
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const queryClient = useQueryClient();

  const sair = (msg) => {
    clearAuth();
    resetOperacional();
    queryClient.clear();
    if (msg) showSnackbar(msg, "info");
  };

  return useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => sair("Sessão encerrada."),
    onError: () => sair(),
  });
};

export const useUserProfileQuery = (userId) => {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: profileKey(userId),
    queryFn: () => getUserProfile(userId),
    enabled: Boolean(token && userId),
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data, { userId }) => {
      updateUser(data?.user || data);
      queryClient.invalidateQueries({ queryKey: profileKey(userId) });
      showSnackbar("Perfil atualizado!", "success");
    },
    onError: (e) =>
      showSnackbar(e.friendlyMessage || "Não foi possível atualizar.", "error"),
  });
};

export const useDeleteAccountMutation = () => {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const resetOperacional = useAppStore((s) => s.resetOperacional);
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUserAccount,
    onSuccess: () => {
      clearAuth();
      resetOperacional();
      queryClient.clear();
      showSnackbar("Conta excluída.", "info");
    },
    onError: (e) =>
      showSnackbar(e.friendlyMessage || "Não foi possível excluir.", "error"),
  });
};
