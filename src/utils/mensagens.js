import { formatarDataBR, formatarMoeda } from "./format";

// Modelos de mensagem pré-preenchidos na linguagem do motorista

export const primeiroNome = (nomeCompleto) =>
  String(nomeCompleto || "aluno")
    .trim()
    .split(/\s+/)[0];

// Monta link HTTPS clicável no WhatsApp (GitHub Pages oficial do repositório) que abre a página web de cancelamento do responsável no navegador do celular (sem instalar o app)
export const montarLinkCancelamentoWeb = ({
  alunoId,
  alunoNome,
  turno = "MANHA",
} = {}) => {
  if (!alunoId) return "";
  const nomeCurto = encodeURIComponent(primeiroNome(alunoNome));
  const turnoLimpo = encodeURIComponent(String(turno || "MANHA").toUpperCase());
  return `https://sammuelvss.github.io/Fillmore-App/cancelar.html?a=${encodeURIComponent(String(alunoId))}&n=${nomeCurto}&t=${turnoLimpo}`;
};

export const mensagemVanChegando = ({
  alunoId,
  alunoNome,
  turno,
  motoristaNome,
} = {}) => {
  const aluno = primeiroNome(alunoNome);
  const motorista = motoristaNome ? ` (${motoristaNome})` : "";
  const link = montarLinkCancelamentoWeb({ alunoId, alunoNome, turno });
  const blocoLink = link
    ? `\n\nCaso ${aluno} não vá hoje, toque neste link para avisar e atualizar a rota do motorista automaticamente:\n${link}`
    : "";
  return `Olá! A van escolar${motorista} está chegando para o embarque de ${aluno}. Por favor, aguarde no ponto combinado.${blocoLink}`;
};

export const mensagemInicioRota = ({
  alunoId,
  alunoNome,
  rotaNome,
  turno,
  motoristaNome,
} = {}) => {
  const aluno = primeiroNome(alunoNome);
  const motorista = motoristaNome ? ` (${motoristaNome})` : "";
  const turnoTexto = turno === "TARDE" ? "da tarde" : "da manhã";
  const rotaTexto = rotaNome ? ` "${rotaNome}"` : "";
  const link = montarLinkCancelamentoWeb({ alunoId, alunoNome, turno });
  const blocoLink = link
    ? `\n\nCaso ${aluno} não vá hoje, toque neste link para avisar e atualizar a rota do motorista automaticamente:\n${link}`
    : "";
  return `Olá! A van escolar${motorista} acabou de iniciar a rota ${turnoTexto}${rotaTexto} para buscar/entregar ${aluno}.${blocoLink}`;
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

export const mensagemContatoResponsavel = ({
  alunoNome,
  motoristaNome,
} = {}) => {
  const aluno = primeiroNome(alunoNome);
  const motorista = motoristaNome ? `, motorista ${motoristaNome}` : "";
  return `Olá! Aqui é do transporte escolar Fillmore${motorista}, falando sobre ${aluno}.`;
};
