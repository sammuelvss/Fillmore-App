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

  // Aluno atualmente selecionado (Relacionamento 2 - Paulo / Presença - Edmundo)
  alunoAtivo: null,
  setAlunoAtivo: (alunoAtivo) => set({ alunoAtivo }),

  // Snackbar global para exibir feedbacks rápidos de sucesso ou erro da API
  snackbar: {
    visible: false,
    message: "",
    type: "info", // "info" | "success" | "error"
  },
  showSnackbar: (message, type = "info") =>
    set({
      snackbar: {
        visible: true,
        message,
        type,
      },
    }),
  hideSnackbar: () =>
    set((state) => ({
      snackbar: {
        ...state.snackbar,
        visible: false,
      },
    })),
}));

export default useAppStore;
