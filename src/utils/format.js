// Formatadores, máscaras simples e utilitários de data local (America/Recife, UTC-3)

export const apenasDigitos = (valor) => String(valor || "").replace(/\D/g, "");

// Retorna AAAA-MM-DD no fuso local do aparelho (evita virar o dia após 21h em UTC-3)
export const hojeLocal = (baseDate = new Date()) => {
  const ano = baseDate.getFullYear();
  const mes = String(baseDate.getMonth() + 1).padStart(2, "0");
  const dia = String(baseDate.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

// Retorna HH:MM no horário local do aparelho
export const horaAtualLocal = (baseDate = new Date()) => {
  const horas = String(baseDate.getHours()).padStart(2, "0");
  const minutos = String(baseDate.getMinutes()).padStart(2, "0");
  return `${horas}:${minutos}`;
};

// Formata número ou string monetária como "R$ 1.234,56"
export const formatarMoeda = (valor) => {
  const numero = Number(valor || 0);
  if (!Number.isFinite(numero)) return "R$ 0,00";
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

// Converte string ("1.234,56" ou "250.50") em número
export const parseValorMonetario = (valor) => {
  if (typeof valor === "number") return valor;
  const limpo = String(valor || "")
    .replace(/R\$\s?/gi, "")
    .trim();
  if (!limpo) return NaN;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  return Number(normalizado);
};

// Alias para compatibilidade com Financeiro e formulários
export const moedaParaNumero = parseValorMonetario;

// Formata data ISO (AAAA-MM-DD ou timestamp) em "dd/mm/aaaa"
export const formatarDataBR = (dataIso) => {
  if (!dataIso) return "—";
  const texto = String(dataIso).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) return texto;
  const apenasData = texto.split("T")[0];
  const partes = apenasData.split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return texto;
};

// Formata timestamp em "dd/mm às HH:MM"
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

// Converte "dd/mm/aaaa" ou "aaaa-mm-dd" em "aaaa-mm-dd" válido (ou null)
export const dataBRParaISO = (texto) => {
  const limpo = String(texto || "").trim();
  let iso = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) {
    iso = limpo;
  } else {
    const match = limpo.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) iso = `${match[3]}-${match[2]}-${match[1]}`;
  }
  if (!iso) return null;

  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const valida =
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() + 1 === m &&
    dt.getUTCDate() === d;
  return valida ? iso : null;
};

// --- Máscaras de digitação (sem dependências externas) ---

export const mascaraTelefone = (valor) => {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const mascaraDataBR = (valor) => {
  const d = apenasDigitos(valor).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

export const mascaraMoeda = (valor) => {
  const d = apenasDigitos(valor);
  if (!d) return "";
  const centavos = Number(d) / 100;
  return centavos.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const mascaraPlaca = (valor) =>
  String(valor || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
