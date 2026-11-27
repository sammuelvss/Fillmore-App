import { apenasDigitos, dataBRParaISO, parseValorMonetario } from "./format";

// Validadores booleanos e validadores com mensagem de erro em português

export const isEmailValido = (valor) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || "").trim());

export const validarEmail = (valor) => {
  if (!String(valor || "").trim()) return "Informe o e-mail.";
  return isEmailValido(valor) ? null : "Informe um e-mail válido.";
};

// Telefone brasileiro com DDD: 10 dígitos (fixo) ou 11 dígitos (celular)
export const isTelefoneValido = (valor) => {
  const digitos = apenasDigitos(valor);
  return digitos.length === 10 || digitos.length === 11;
};

export const validarTelefone = (valor, { obrigatorio = true } = {}) => {
  const digitos = apenasDigitos(valor);
  if (!digitos) {
    return obrigatorio ? "Informe o telefone com DDD." : null;
  }
  return isTelefoneValido(valor)
    ? null
    : "Informe um telefone válido com DDD (10 ou 11 dígitos).";
};

// Placa padrão antigo (ABC-1234 / ABC1234) ou Mercosul (ABC1D23)
export const isPlacaValida = (valor) => {
  const limpa = String(valor || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return /^[A-Z]{3}\d{4}$/.test(limpa) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(limpa);
};

export const validarPlaca = (valor, { obrigatorio = true } = {}) => {
  const limpa = String(valor || "").trim();
  if (!limpa) {
    return obrigatorio ? "Informe a placa da van." : null;
  }
  return isPlacaValida(limpa)
    ? null
    : "Placa inválida. Use o padrão ABC1234 ou Mercosul ABC1D23.";
};

export const isValorMonetarioValido = (valor) => {
  const num = parseValorMonetario(valor);
  return Number.isFinite(num) && num > 0;
};

export const validarValorMonetario = (valor) => {
  return isValorMonetarioValido(valor)
    ? null
    : "Informe um valor em R$ maior que zero.";
};

export const isDataBRValida = (valor) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(String(valor || "").trim())) return false;
  return Boolean(dataBRParaISO(valor));
};

export const validarDataBR = (valor) => {
  if (!String(valor || "").trim()) {
    return "Informe a data no formato DD/MM/AAAA.";
  }
  return isDataBRValida(valor)
    ? null
    : "Data inválida. Use o formato DD/MM/AAAA.";
};

export const isDataISOValida = (valor) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || "").trim())) return false;
  return Boolean(dataBRParaISO(valor));
};

export const isHorarioValido = (valor) =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(String(valor || "").trim());

export const isCapacidadeVanValida = (valor) => {
  const num = Number(valor);
  return Number.isInteger(num) && num > 0 && num <= 60;
};

export const validarCapacidadeVan = (valor) => {
  const num = Number.parseInt(String(valor || "").trim(), 10);
  if (!Number.isInteger(num) || num < 1 || num > 60) {
    return "A capacidade da van deve ser entre 1 e 60 lugares.";
  }
  return null;
};

export const isDiaVencimentoValido = (valor) => {
  const num = Number(valor);
  return Number.isInteger(num) && num >= 1 && num <= 31;
};

export const validarDiaVencimento = (valor, { obrigatorio = true } = {}) => {
  const texto = String(valor || "").trim();
  if (!texto) {
    return obrigatorio
      ? "Informe o dia de vencimento da mensalidade (1 a 31)."
      : null;
  }
  const num = Number.parseInt(texto, 10);
  if (!Number.isInteger(num) || num < 1 || num > 31) {
    return "O dia de vencimento deve estar entre 1 e 31.";
  }
  return null;
};

export const validarSenha = (valor, { min = 6 } = {}) => {
  const s = String(valor || "");
  if (s.length < min) {
    return `A senha deve ter pelo menos ${min} caracteres.`;
  }
  return null;
};

export const validarCNH = (valor, { obrigatorio = false } = {}) => {
  const digitos = apenasDigitos(valor);
  if (!digitos) {
    return obrigatorio ? "Informe o número da CNH." : null;
  }
  if (digitos.length !== 11) {
    return "A CNH deve conter 11 dígitos.";
  }
  return null;
};
