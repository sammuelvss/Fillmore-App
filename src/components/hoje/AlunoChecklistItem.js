import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Chip,
  Dialog,
  Portal,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../theme";
import {
  useAtualizarPresencaMutation,
  useCancelarViagemMutation,
  useCriarNotificacaoMutation,
  usePresencasQuery,
  useRegistrarPresencaMutation,
  useRemoverPresencaMutation,
  useRemoverViagemMutation,
  useViagensQuery,
} from "../../hooks/useOperacao";
import { useMensalidadesQuery } from "../../hooks/useMensalidades";
import { TIPO_AVISO_META } from "../operacao/helpers";
import { resolverStatusMensalidade } from "../../constants";
import { horaAtualLocal } from "../../utils/format";
import { abrirWhatsApp } from "../../utils/whatsapp";
import { mensagemVanChegando } from "../../utils/mensagens";
import { useAppStore } from "../../store/useAppStore";

export default function AlunoChecklistItem({
  aluno,
  turno,
  dataHoje,
  motoristaNome,
  onStatusChange,
  onAtrasoChange,
}) {
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const presencasQuery = usePresencasQuery(aluno?.id);
  const viagensQuery = useViagensQuery(aluno?.id);
  const mensalidadesQuery = useMensalidadesQuery(aluno?.id);

  const registrarPresenca = useRegistrarPresencaMutation();
  const atualizarPresenca = useAtualizarPresencaMutation();
  const removerPresenca = useRemoverPresencaMutation();
  const cancelarViagem = useCancelarViagemMutation();
  const removerViagem = useRemoverViagemMutation();
  const criarNotificacao = useCriarNotificacaoMutation();

  const [otimistaEmbarcou, setOtimistaEmbarcou] = useState(null);
  const [dialogAusencia, setDialogAusencia] = useState(false);
  const [motivoAusencia, setMotivoAusencia] = useState("");

  // Presença registrada para hoje no turno selecionado
  const presencaHoje = useMemo(() => {
    const lista = Array.isArray(presencasQuery.data) ? presencasQuery.data : [];
    return (
      lista.find(
        (p) =>
          String(p.data).slice(0, 10) === dataHoje && p.turno === turno,
      ) || null
    );
  }, [presencasQuery.data, dataHoje, turno]);

  // Viagem cancelada para hoje no turno selecionado (ou AMBOS)
  const viagemCanceladaHoje = useMemo(() => {
    const lista = Array.isArray(viagensQuery.data) ? viagensQuery.data : [];
    return (
      lista.find(
        (v) =>
          String(v.data).slice(0, 10) === dataHoje &&
          (v.turnoCancelado === turno || v.turnoCancelado === "AMBOS"),
      ) || null
    );
  }, [viagensQuery.data, dataHoje, turno]);

  // Mensalidades em atraso deste aluno
  const atrasadasCount = useMemo(() => {
    const lista = Array.isArray(mensalidadesQuery.data)
      ? mensalidadesQuery.data
      : [];
    return lista.filter((m) => resolverStatusMensalidade(m).status === "ATRASADO")
      .length;
  }, [mensalidadesQuery.data]);

  useEffect(() => {
    setOtimistaEmbarcou(null);
  }, [presencaHoje?.id, presencaHoje?.embarcou, turno, dataHoje]);

  const embarcouEfetivo =
    otimistaEmbarcou !== null
      ? otimistaEmbarcou
      : Boolean(presencaHoje?.embarcou);
  const ausenteHoje = Boolean(viagemCanceladaHoje);

  useEffect(() => {
    if (aluno?.id && onStatusChange) {
      onStatusChange(aluno.id, {
        embarcou: !ausenteHoje && embarcouEfetivo,
        ausente: ausenteHoje,
      });
    }
  }, [aluno?.id, embarcouEfetivo, ausenteHoje, onStatusChange]);

  useEffect(() => {
    if (aluno?.id && onAtrasoChange) {
      onAtrasoChange(aluno.id, atrasadasCount);
    }
  }, [aluno?.id, atrasadasCount, onAtrasoChange]);

  const enderecoTurno =
    turno === "TARDE"
      ? aluno?.enderecoDesembarque || aluno?.enderecoEmbarque
      : aluno?.enderecoEmbarque || aluno?.enderecoDesembarque;

  const telefoneResponsavel =
    aluno?.telefoneContatoEntrega ||
    aluno?.responsavel?.usuario?.telefone ||
    "";

  const handleToggleEmbarque = async () => {
    const proximo = !embarcouEfetivo;
    const horario = horaAtualLocal();
    setOtimistaEmbarcou(proximo);

    try {
      if (!presencaHoje) {
        const criada = await registrarPresenca.mutateAsync({
          alunoId: aluno.id,
          data: {
            data: dataHoje,
            turno,
            embarcou: proximo,
            horarioEmbarque: proximo ? horario : null,
          },
        });
        showSnackbar(
          proximo
            ? `Embarque de ${aluno.nome} registrado`
            : `Falta de ${aluno.nome} registrada`,
          "success",
          {
            label: "Desfazer",
            onPress: () => {
              setOtimistaEmbarcou(!proximo);
              if (criada?.id) {
                removerPresenca.mutate({
                  alunoId: aluno.id,
                  presencaId: criada.id,
                });
              }
            },
          },
        );
      } else {
        const estadoAnterior = Boolean(presencaHoje.embarcou);
        const horarioAnterior = presencaHoje.horarioEmbarque || null;
        await atualizarPresenca.mutateAsync({
          alunoId: aluno.id,
          presencaId: presencaHoje.id,
          data: {
            embarcou: proximo,
            horarioEmbarque: proximo ? horario : null,
          },
        });
        showSnackbar(
          proximo
            ? `Embarque de ${aluno.nome} confirmado`
            : `Embarque de ${aluno.nome} desmarcado`,
          "success",
          {
            label: "Desfazer",
            onPress: () => {
              setOtimistaEmbarcou(estadoAnterior);
              atualizarPresenca.mutate({
                alunoId: aluno.id,
                presencaId: presencaHoje.id,
                data: {
                  embarcou: estadoAnterior,
                  horarioEmbarque: horarioAnterior,
                },
              });
            },
          },
        );
      }
    } catch {
      setOtimistaEmbarcou(null);
    }
  };

  const handleAvisarVanChegando = async () => {
    const textoNotif =
      TIPO_AVISO_META?.VAN_CHEGANDO?.sugestao ||
      "A van está chegando ao ponto de embarque.";

    criarNotificacao.mutate({
      alunoId: aluno.id,
      data: {
        tipo: "VAN_CHEGANDO",
        mensagem: textoNotif,
      },
    });

    await abrirWhatsApp(
      telefoneResponsavel,
      mensagemVanChegando({ alunoNome: aluno.nome, motoristaNome }),
    );
  };

  const handleConfirmarAusencia = async () => {
    const motivoLimpo = motivoAusencia.trim() || undefined;
    setDialogAusencia(false);
    setMotivoAusencia("");

    try {
      const criada = await cancelarViagem.mutateAsync({
        alunoId: aluno.id,
        data: {
          data: dataHoje,
          turnoCancelado: turno,
          motivoCancelamento: motivoLimpo,
        },
      });
      if (criada?.id) {
        showSnackbar(`${aluno.nome} marcado(a) como ausente hoje`, "info", {
          label: "Desfazer",
          onPress: () =>
            removerViagem.mutate({
              alunoId: aluno.id,
              viagemId: criada.id,
            }),
        });
      }
    } catch {
      // Snackbar de erro já tratado pelo hook
    }
  };

  const handleReativarViagem = () => {
    if (!viagemCanceladaHoje?.id) return;
    removerViagem.mutate({
      alunoId: aluno.id,
      viagemId: viagemCanceladaHoje.id,
    });
  };

  const mutandoPresenca =
    registrarPresenca.isPending ||
    atualizarPresenca.isPending ||
    removerPresenca.isPending;

  return (
    <Surface
      style={[
        styles.card,
        ausenteHoje && styles.cardAusente,
        !ausenteHoje && embarcouEfetivo && styles.cardEmbarcou,
      ]}
      elevation={1}
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text
            variant="titleMedium"
            style={[styles.nome, ausenteHoje && styles.nomeAusente]}
          >
            {aluno.nome}
          </Text>
          <Text variant="bodySmall" style={styles.escola}>
            {aluno.escola}
          </Text>
          {enderecoTurno ? (
            <Text variant="bodySmall" style={styles.endereco} numberOfLines={1}>
              {enderecoTurno}
            </Text>
          ) : null}
        </View>

        {ausenteHoje ? (
          <Chip
            compact
            icon="calendar-remove"
            style={styles.ausenteChip}
            textStyle={styles.ausenteChipText}
          >
            Não vai hoje
          </Chip>
        ) : embarcouEfetivo ? (
          <Chip
            compact
            icon="check-circle"
            style={styles.embarcouChip}
            textStyle={styles.embarcouChipText}
          >
            Embarcou{" "}
            {presencaHoje?.horarioEmbarque
              ? `• ${presencaHoje.horarioEmbarque}`
              : ""}
          </Chip>
        ) : null}
      </View>

      {ausenteHoje && viagemCanceladaHoje?.motivoCancelamento ? (
        <Text variant="bodySmall" style={styles.motivoText}>
          Motivo: {viagemCanceladaHoje.motivoCancelamento}
        </Text>
      ) : null}

      {/* Até 3 ações visíveis com alvos >= 48dp e sem esmagar o texto */}
      {ausenteHoje ? (
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            icon="backup-restore"
            loading={removerViagem.isPending}
            disabled={removerViagem.isPending}
            onPress={handleReativarViagem}
            textColor={colors.secondary}
            contentStyle={styles.btnContent48}
            style={styles.fullWidthBtn}
          >
            Reativar aluno hoje
          </Button>
        </View>
      ) : (
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            icon={
              embarcouEfetivo
                ? "check-circle"
                : "checkbox-blank-circle-outline"
            }
            loading={mutandoPresenca}
            disabled={mutandoPresenca}
            onPress={handleToggleEmbarque}
            buttonColor={embarcouEfetivo ? colors.success : colors.primary}
            textColor={embarcouEfetivo ? "#FFFFFF" : colors.text}
            contentStyle={styles.btnContent48}
            labelStyle={styles.embarcouBtnLabel}
            style={styles.embarcouBtn}
          >
            {embarcouEfetivo ? "Embarcado (desmarcar)" : "Embarcou"}
          </Button>

          <View style={styles.secondaryActionsRow}>
            <Button
              mode="outlined"
              icon="whatsapp"
              loading={criarNotificacao.isPending}
              disabled={criarNotificacao.isPending}
              onPress={handleAvisarVanChegando}
              textColor="#166534"
              contentStyle={styles.btnContent48}
              labelStyle={styles.secondaryBtnLabel}
              style={styles.whatsBtn}
              accessibilityLabel={`Avisar no WhatsApp que a van está chegando para ${aluno.nome}`}
            >
              Van chegando
            </Button>

            <Button
              mode="outlined"
              icon="calendar-remove-outline"
              disabled={cancelarViagem.isPending}
              onPress={() => setDialogAusencia(true)}
              textColor={colors.textSecondary}
              contentStyle={styles.btnContent48}
              labelStyle={styles.secondaryBtnLabel}
              style={styles.ausenteBtn}
            >
              Não vai hoje
            </Button>
          </View>
        </View>
      )}

      <Portal>
        <Dialog
          visible={dialogAusencia}
          onDismiss={() => setDialogAusencia(false)}
          style={styles.dialog}
        >
          <Dialog.Title>{aluno.nome} não vai hoje?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogDesc}>
              O aluno ficará marcado como ausente neste turno e sairá do trajeto
              otimizado de hoje.
            </Text>
            <TextInput
              label="Motivo (opcional)"
              placeholder="Ex.: Consulta médica"
              mode="outlined"
              maxLength={180}
              value={motivoAusencia}
              onChangeText={setMotivoAusencia}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDialogAusencia(false)}
              contentStyle={styles.btnContent48}
            >
              Voltar
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.error}
              textColor="#FFFFFF"
              loading={cancelarViagem.isPending}
              disabled={cancelarViagem.isPending}
              onPress={handleConfirmarAusencia}
              contentStyle={styles.btnContent48}
            >
              Confirmar ausência
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardEmbarcou: {
    borderColor: colors.success,
    backgroundColor: "#F0FDF4",
  },
  cardAusente: {
    opacity: 0.65,
    backgroundColor: colors.surfaceVariant,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  nome: {
    fontWeight: "800",
    color: colors.text,
  },
  nomeAusente: {
    textDecorationLine: "line-through",
    color: colors.textSecondary,
  },
  escola: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  endereco: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  embarcouChip: {
    backgroundColor: "#DCFCE7",
  },
  embarcouChipText: {
    color: "#166534",
    fontWeight: "800",
    fontSize: 12,
  },
  ausenteChip: {
    backgroundColor: colors.errorLight,
  },
  ausenteChipText: {
    color: "#991B1B",
    fontWeight: "800",
    fontSize: 12,
  },
  motivoText: {
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  actionsContainer: {
    gap: 8,
    marginTop: 2,
  },
  embarcouBtn: {
    width: "100%",
    borderRadius: 12,
  },
  embarcouBtnLabel: {
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  whatsBtn: {
    flex: 1,
    borderRadius: 12,
    borderColor: "#166534",
  },
  ausenteBtn: {
    flex: 1,
    borderRadius: 12,
    borderColor: colors.border,
  },
  secondaryBtnLabel: {
    fontWeight: "700",
    fontSize: 13,
  },
  fullWidthBtn: {
    width: "100%",
    borderRadius: 12,
  },
  btnContent48: {
    minHeight: 48,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  dialogDesc: {
    color: colors.textSecondary,
    marginBottom: 12,
  },
});
