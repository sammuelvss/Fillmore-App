import { apenasDigitos, dataBRParaISO, parseValorMonetario } from "./format";

// Validadores padronizados para formulários do Fillmore

export const isEmailValido = (valor) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || "").trim());

// Telefone brasileiro com DDD: 10 dígitos (fixo) ou 11 dígitos (celular)
export const isTelefoneValido = (valor) => {
  const digitos = apenasDigitos(valor);
  return digitos.length === 10 || digitos.length === 11;
};

// Placa padrão antigo (ABC-1234 / ABC1234) ou Mercosul (ABC1D23)
export const isPlacaValida = (valor) => {
  const limpa = String(valor || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return /^[A-Z]{3}\d{4}$/.test(limpa) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(limpa);
};

export const isValorMonetarioValido = (valor) => {
  const num = parseValorMonetario(valor);
  return Number.isFinite(num) && num > 0;
};

export const isDataBRValida = (valor) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(String(valor || "").trim())) return false;
  return Boolean(dataBRParaISO(valor));
};

export const isDataISOValida = (valor) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || "").trim())) return false;
  return Boolean(dataBRParaISO(valor));
};

export const isHorarioValido = (valor) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(String(valor || "").trim());

export const isCapacidadeVanValida = (valor) => {
  const num = Number(valor);
  return Number.isInteger(num) && num > 0;
};

export const isDiaVencimentoValido = (valor) => {
  const num = Number(valor);
  return Number.isInteger(num) && num >= 1 && num <= 31;
};
