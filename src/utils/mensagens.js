import { formatarDataBR, formatarMoeda } from "./format";

// Modelos de mensagem pré-preenchidos na linguagem do motorista

export const primeiroNome = (nomeCompleto) =>
  String(nomeCompleto || "aluno")
    .trim()
    .split(/\s+/)[0];

export const mensagemVanChegando = ({ alunoNome, motoristaNome } = {}) => {
  const aluno = primeiroNome(alunoNome);
  const motorista = motoristaNome ? ` (${motoristaNome})` : "";
  return `Olá! A van escolar${motorista} está chegando para o embarque de ${aluno}. Por favor, aguarde no ponto combinado.`;
};

export const mensagemCobrancaPix = ({
  alunoNome,
  mesReferencia,
  anoReferencia,
  valor,
  dataVencimento,
  dataVencimentoBR,
  chavePix,
  titularPix,
} = {}) => {
  const aluno = primeiroNome(alunoNome);
  const mes = mesReferencia ? String(mesReferencia).padStart(2, "0") : "";
  const ref = mes && anoReferencia ? ` referente a ${mes}/${anoReferencia}` : "";
  const valorFmt =
    typeof valor === "string" && valor.includes("R$")
      ? valor
      : formatarMoeda(valor);
  const vencFmt =
    dataVencimentoBR ||
    (dataVencimento ? formatarDataBR(dataVencimento) : "—");
  const pixTexto = chavePix
    ? `\n\nChave Pix: ${chavePix}${titularPix ? ` (${titularPix})` : ""}`
    : "";

  return `Olá! Passando para lembrar da mensalidade do transporte escolar de ${aluno}${ref}, no valor de ${valorFmt} (vencimento em ${vencFmt}).${pixTexto}\n\nQualquer dúvida, estou à disposição!`;
};

export const mensagemContatoResponsavel = ({ alunoNome, motoristaNome } = {}) => {
  const aluno = primeiroNome(alunoNome);
  const motorista = motoristaNome ? `, motorista ${motoristaNome}` : "";
  return `Olá! Aqui é do transporte escolar Fillmore${motorista}, falando sobre ${aluno}.`;
};
