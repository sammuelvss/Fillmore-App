import { Linking } from "react-native";
import { apenasDigitos } from "./format";
import { useAppStore } from "../store/useAppStore";

// Monta a URL wa.me padronizada com DDI 55 e texto codificado
export const montarUrlWhatsApp = (telefone, mensagem = "") => {
  const digitos = apenasDigitos(telefone);
  if (digitos.length < 10) return null;

  const comDdi =
    digitos.length <= 11 && !digitos.startsWith("55")
      ? `55${digitos}`
      : digitos;

  const query = mensagem
    ? `?text=${encodeURIComponent(String(mensagem).trim())}`
    : "";
  return `https://wa.me/${comDdi}${query}`;
};

// Abre o WhatsApp do responsável com mensagem pré-preenchida
export const abrirWhatsApp = async (telefone, mensagem = "") => {
  const showSnackbar = useAppStore.getState().showSnackbar;
  const url = montarUrlWhatsApp(telefone, mensagem);

  if (!url) {
    showSnackbar(
      "Telefone do responsável não cadastrado ou inválido.",
      "error",
    );
    return false;
  }

  try {
    await Linking.openURL(url);
    return true;
  } catch {
    showSnackbar(
      "Não foi possível abrir o WhatsApp neste aparelho.",
      "error",
    );
    return false;
  }
};

export default abrirWhatsApp;
