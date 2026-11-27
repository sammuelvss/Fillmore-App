import { create } from "zustand";

/**
 * Store global de UI e Filtros Operacionais do App (Zustand)
 * Compartilha o turno selecionado (TODOS | MANHA | TARDE), rota ativa em foco
 * e mensagens globais de feedback (Snackbar) entre todas as telas da equipe.
 */
export const useAppStore = create((set) => ({
  // Filtro global de turno usado na Home, listagem de Rotas e Operação Diária
  turnoFiltro: "TODOS", // "TODOS" | "MANHA" | "TARDE"
  setTurnoFiltro: (turnoFiltro) => set({ turnoFiltro }),

  // Rota atualmente selecionada para inspeção rápida (Relacionamento 1 - Joao / Avisos - Edmundo)
  rotaAtiva: null,
  setRotaAtiva: (rotaAtiva) => set({ rotaAtiva }),

  // Aluno atualmente selecionado
  alunoAtivo: null,
  setAlunoAtivo: (alunoAtivo) => set({ alunoAtivo }),

  // Limpa seleções operacionais no logout ou quando a sessão expira (401)
  resetOperacional: () => set({ rotaAtiva: null, alunoAtivo: null }),

  // Snackbar global para feedback (com suporte opcional a ação de "Desfazer")
  snackbar: {
    visible: false,
    message: "",
    type: "info", // "info" | "success" | "error"
    action: null,
  },
  showSnackbar: (message, type = "info", action = null) =>
    set({
      snackbar: {
        visible: true,
        message,
        type,
        action,
      },
    }),
  hideSnackbar: () =>
    set((state) => ({
      snackbar: {
        ...state.snackbar,
        visible: false,
        action: null,
      },
    })),
}));

export default useAppStore;
