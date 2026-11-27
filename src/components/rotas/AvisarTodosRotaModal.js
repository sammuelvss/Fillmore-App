import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Chip,
  Dialog,
  Divider,
  Portal,
  Surface,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useCriarNotificacaoMutation } from "../../hooks/useOperacao";
import { abrirWhatsApp } from "../../utils/whatsapp";
import { mensagemInicioRota } from "../../utils/mensagens";
import { useAppStore } from "../../store/useAppStore";

/**
 * Modal de Disparo de Início de Rota para Todos os Alunos da Rota
 * - Ao abrir ou tocar em "Registrar início na API e enviar no WhatsApp",
 *   dispara a notificação de início de rota na API para todos os alunos ativos
 *   e permite enviar sequencialmente no WhatsApp de cada responsável (ou 1 a 1).
 */
export default function AvisarTodosRotaModal({
  visible,
  onDismiss,
  rotaNome,
  turno,
  alunos = [],
  motoristaNome,
}) {
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const criarNotificacao = useCriarNotificacaoMutation();

  const [enviadosMap, setEnviadosMap] = useState({});
  const [notificandoApi, setNotificandoApi] = useState(false);
  const [apiRegistrada, setApiRegistrada] = useState(false);

  useEffect(() => {
    if (visible) {
      setEnviadosMap({});
      setApiRegistrada(false);
    }
  }, [visible]);

  const obterTelefone = (aluno) =>
    aluno?.telefoneContatoEntrega ||
    aluno?.responsavel?.usuario?.telefone ||
    aluno?.contatoEntrega?.telefone ||
    "";

  const obterNomeAluno = (aluno) => aluno?.nome || aluno?.alunoNome || "Aluno";
  const obterIdAluno = (aluno) => aluno?.id || aluno?.alunoId;

  const registrarTodosNaApi = async () => {
    if (apiRegistrada || alunos.length === 0) return;
    setNotificandoApi(true);
    try {
      await Promise.allSettled(
        alunos.map((a) => {
          const id = obterIdAluno(a);
          if (!id) return Promise.resolve();
          return criarNotificacao.mutateAsync({
            alunoId: id,
            data: {
              tipo: "VAN_CHEGANDO",
              mensagem: `A van iniciou a rota "${rotaNome || "escolar"}" (${turno === "TARDE" ? "Tarde" : "Manhã"}).`,
            },
          });
        }),
      );
      setApiRegistrada(true);
    } finally {
      setNotificandoApi(false);
    }
  };

  const handleEnviarWhatsAppAluno = async (aluno) => {
    const id = obterIdAluno(aluno);
    const nome = obterNomeAluno(aluno);
    const tel = obterTelefone(aluno);

    if (!apiRegistrada) {
      await registrarTodosNaApi();
    }

    const msg = mensagemInicioRota({
      alunoId: id,
      alunoNome: nome,
      rotaNome,
      turno,
      motoristaNome,
    });

    const ok = await abrirWhatsApp(tel, msg, (erroMsg) =>
      showSnackbar(erroMsg, "error"),
    );
    if (ok && id) {
      setEnviadosMap((prev) => ({ ...prev, [id]: true }));
    }
  };

  const proximoPendente = alunos.find((a) => !enviadosMap[obterIdAluno(a)]);
  const totalEnviados = Object.keys(enviadosMap).length;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>
          Avisar início da rota ({alunos.length})
        </Dialog.Title>
        <Dialog.Content>
          <Text variant="bodySmall" style={styles.subtitle}>
            Avise todos os responsáveis da rota{" "}
            <Text style={{ fontWeight: "800", color: colors.secondary }}>
              {rotaNome || "atual"}
            </Text>{" "}
            que a van acabou de sair. Caso algum aluno não vá hoje, o
            responsável já é orientado na mensagem a responder no WhatsApp.
          </Text>

          {proximoPendente ? (
            <Button
              mode="contained"
              icon="whatsapp"
              buttonColor={colors.primary}
              textColor={colors.text}
              loading={notificandoApi}
              disabled={notificandoApi}
              style={styles.nextBtn}
              contentStyle={{ height: 52 }}
              labelStyle={{ fontWeight: "800", fontSize: 14 }}
              onPress={() => handleEnviarWhatsAppAluno(proximoPendente)}
            >
              {totalEnviados === 0
                ? `Iniciar envio (1º: ${obterNomeAluno(proximoPendente).split(" ")[0]})`
                : `Enviar próximo (${totalEnviados + 1}/${alunos.length}: ${obterNomeAluno(proximoPendente).split(" ")[0]})`}
            </Button>
          ) : alunos.length > 0 ? (
            <Surface style={styles.doneBanner} elevation={0}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={20}
                color="#166534"
              />
              <Text variant="labelMedium" style={styles.doneText}>
                Todos os {alunos.length} responsáveis foram avisados!
              </Text>
            </Surface>
          ) : null}

          <ScrollView style={styles.listScroll} nestedScrollEnabled>
            {alunos.map((aluno, idx) => {
              const id = obterIdAluno(aluno);
              const nome = obterNomeAluno(aluno);
              const tel = obterTelefone(aluno);
              const enviado = Boolean(enviadosMap[id]);

              return (
                <View key={String(id || idx)}>
                  <View style={styles.alunoRow}>
                    <View style={{ flex: 1 }}>
                      <Text variant="titleSmall" style={styles.alunoNome}>
                        {nome}
                      </Text>
                      <Text variant="labelSmall" style={styles.alunoTel}>
                        {tel || "Sem telefone cadastrado"}
                      </Text>
                    </View>

                    {enviado ? (
                      <Chip
                        compact
                        icon="check"
                        style={styles.sentChip}
                        textStyle={styles.sentChipText}
                        onPress={() => handleEnviarWhatsAppAluno(aluno)}
                      >
                        Enviado
                      </Chip>
                    ) : (
                      <Button
                        mode="outlined"
                        compact
                        icon="whatsapp"
                        textColor="#166534"
                        style={styles.sendSingleBtn}
                        onPress={() => handleEnviarWhatsAppAluno(aluno)}
                      >
                        Enviar
                      </Button>
                    )}
                  </View>
                  {idx < alunos.length - 1 ? <Divider /> : null}
                </View>
              );
            })}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor={colors.secondary}>
            Concluir
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 18,
  },
  title: {
    fontWeight: "800",
    color: colors.secondary,
  },
  subtitle: {
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  nextBtn: {
    borderRadius: 12,
    marginBottom: 12,
  },
  doneBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#DCFCE7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  doneText: {
    flex: 1,
    color: "#166534",
    fontWeight: "800",
  },
  listScroll: {
    maxHeight: 240,
  },
  alunoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 10,
  },
  alunoNome: {
    fontWeight: "700",
    color: colors.secondary,
  },
  alunoTel: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  sendSingleBtn: {
    borderRadius: 8,
    borderColor: "#86EFAC",
  },
  sentChip: {
    backgroundColor: "#DCFCE7",
  },
  sentChipText: {
    color: "#166534",
    fontWeight: "800",
    fontSize: 11,
  },
});
