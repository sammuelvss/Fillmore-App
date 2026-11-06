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
  const router = useRouter();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      showSnackbar(`Bem-vindo(a), ${user?.nome || "usuário"}!`, "success");
      router.replace("/(tabs)");
    },
    onError: (e) =>
      showSnackbar(e.friendlyMessage || "Falha ao autenticar.", "error"),
  });
};

export const useSignUpMutation = () => {
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const router = useRouter();

  return useMutation({
    mutationFn: signUpRequest,
    onSuccess: () => {
      showSnackbar("Conta criada! Faça login para continuar.", "success");
      router.back();
    },
    onError: (e) =>
      showSnackbar(e.friendlyMessage || "Não foi possível cadastrar.", "error"),
  });
};

// Logout: revoga o token na API; se falhar, sai localmente mesmo assim
export const useLogoutMutation = () => {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const queryClient = useQueryClient();
  const router = useRouter();

  const sair = (msg) => {
    clearAuth();
    queryClient.clear();
    if (msg) showSnackbar(msg, "info");
    router.replace("/(auth)/login");
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
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: deleteUserAccount,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      showSnackbar("Conta excluída.", "info");
      router.replace("/(auth)/login");
    },
    onError: (e) =>
      showSnackbar(e.friendlyMessage || "Não foi possível excluir.", "error"),
  });
};
