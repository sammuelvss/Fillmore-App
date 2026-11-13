// Utilitários de data, hora e formatação para a Operação Diária

export const getHojeISO = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getHoraAtual = () => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
};

export const isDataValida = (valor) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [y, m, d] = valor.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() + 1 === m &&
    dt.getUTCDate() === d
  );
};

export const isHoraValida = (valor) => /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);

export const formatarDataBR = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

export const formatarDataHoraBR = (timestamp) => {
  if (!timestamp) return "";
  const dt = new Date(timestamp);
  if (Number.isNaN(dt.getTime())) return "";
  const d = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const h = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  return `${d}/${m} às ${h}:${min}`;
};

export const TURNO_LABELS = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  AMBOS: "Ida e Volta",
};

export const TIPO_AVISO_META = {
  VAN_CHEGANDO: {
    label: "Van chegando",
    icon: "bus-clock",
    color: "#D97706",
    bg: "#FEF3C7",
    sugestao: "A van está chegando ao ponto de embarque.",
  },
  VIAGEM_CANCELADA: {
    label: "Cancelamento",
    icon: "calendar-remove",
    color: "#DC2626",
    bg: "#FEE2E2",
    sugestao: "",
  },
  COBRANCA_MENSALIDADE: {
    label: "Cobrança",
    icon: "cash-clock",
    color: "#059669",
    bg: "#D1FAE5",
    sugestao: "",
  },
  GERAL: {
    label: "Aviso Geral",
    icon: "bell-outline",
    color: "#2563EB",
    bg: "#DBEAFE",
    sugestao: "",
  },
};

