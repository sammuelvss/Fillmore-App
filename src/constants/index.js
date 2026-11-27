import { hojeLocal } from "../utils/format";

// Constantes centralizadas de domínio (turnos, modalidades e status)

export const TURNOS = {
  MANHA: {
    value: "MANHA",
    label: "Manhã",
    icon: "weather-sunny",
  },
  TARDE: {
    value: "TARDE",
    label: "Tarde",
    icon: "weather-sunset",
  },
};

export const TURNO_LABELS = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  AMBOS: "Ida e Volta",
};

export const MODALIDADES = {
  IDA_E_VOLTA: {
    value: "IDA_E_VOLTA",
    label: "Ida e Volta",
    icon: "swap-horizontal-bold",
    bg: "#DBEAFE",
    color: "#1E40AF",
  },
  APENAS_IDA: {
    value: "APENAS_IDA",
    label: "Só Ida (Manhã)",
    icon: "arrow-right-bold",
    bg: "#FFEDD5",
    color: "#9A3412",
  },
  APENAS_VOLTA: {
    value: "APENAS_VOLTA",
    label: "Só Volta (Tarde)",
    icon: "arrow-left-bold",
    bg: "#EDE9FE",
    color: "#5B21B6",
  },
};

// Status com cor + ícone + rótulo distintos do botão primário (#F59E0B) e contraste >= 4.5:1
export const STATUS_MENSALIDADE = {
  PAGO: {
    value: "PAGO",
    label: "Pago",
    icon: "check-circle",
    bg: "#DCFCE7",
    color: "#166534",
  },
  PENDENTE: {
    value: "PENDENTE",
    label: "Pendente",
    icon: "clock-outline",
    bg: "#FFEDD5",
    color: "#9A3412",
  },
  ATRASADO: {
    value: "ATRASADO",
    label: "Atrasado",
    icon: "alert-circle",
    bg: "#FEE2E2",
    color: "#991B1B",
  },
};

// Calcula dias em atraso usando a data local de Recife (hojeLocal)
export const calcularDiasAtrasoLocal = (dataVencimento, status) => {
  if (status === "PAGO" || !dataVencimento) return 0;
  const hoje = hojeLocal();
  const venc = String(dataVencimento).split("T")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(venc) || venc >= hoje) return 0;

  const [hy, hm, hd] = hoje.split("-").map(Number);
  const [vy, vm, vd] = venc.split("-").map(Number);
  const diffMs = Date.UTC(hy, hm - 1, hd) - Date.UTC(vy, vm - 1, vd);
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

// Deriva status ATRASADO no cliente quando PENDENTE já passou do vencimento
export const resolverStatusMensalidade = (mensalidade) => {
  if (!mensalidade) return { status: "PENDENTE", diasAtraso: 0 };
  if (mensalidade.status === "PAGO") {
    return { status: "PAGO", diasAtraso: 0 };
  }
  const diasAtraso = calcularDiasAtrasoLocal(
    mensalidade.dataVencimento,
    mensalidade.status,
  );
  const status =
    diasAtraso > 0 || mensalidade.status === "ATRASADO"
      ? "ATRASADO"
      : "PENDENTE";
  return { status, diasAtraso };
};
