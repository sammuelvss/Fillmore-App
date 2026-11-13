import React, { useMemo, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  SegmentedButtons,
  Chip,
  IconButton,
  HelperText,
  ActivityIndicator,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../theme";
import EmptyState from "../EmptyState";
import {
  useNotificacoesQuery,
  useNotificacoesResponsavelQuery,
  useCriarNotificacaoMutation,
  useMarcarNotificacaoLidaMutation,
  useRemoverNotificacaoMutation,
} from "../../hooks/useOperacao";
import { formatarDataHoraBR, TIPO_AVISO_META } from "./helpers";

const TIPOS_AVISO = [
  "VAN_CHEGANDO",
  "GERAL",
  "VIAGEM_CANCELADA",
  "COBRANCA_MENSALIDADE",
];

// Aba 3: Central de avisos e notificações
export default function AvisosTab({ alunoId, isResponsavel, onConfirmDelete }) {
  const [tipo, setTipo] = useState("VAN_CHEGANDO");
  const [mensagem, setMensagem] = useState("");
  const [formError, setFormError] = useState("");
  const [escopo, setEscopo] = useState("ALUNO"); // "ALUNO" | "TODOS" (responsável)
  const [filtroLida, setFiltroLida] = useState("TODAS"); // "TODAS" | "NAO_LIDAS"

  const notifAlunoQuery = useNotificacoesQuery(alunoId);
  const notifRespQuery = useNotificacoesResponsavelQuery();
  const criar = useCriarNotificacaoMutation();
  const marcarLida = useMarcarNotificacaoLidaMutation();
  const remover = useRemoverNotificacaoMutation();

  const usandoTodosFilhos = isResponsavel && escopo === "TODOS";
  const queryAtiva = usandoTodosFilhos ? notifRespQuery : notifAlunoQuery;
  const todas = useMemo(
    () => (Array.isArray(queryAtiva.data) ? queryAtiva.data : []),
    [queryAtiva.data],
  );

  const naoLidasCount = useMemo(
    () => todas.filter((n) => !n.lida).length,
    [todas],
  );

  const filtradas = useMemo(
    () => (filtroLida === "NAO_LIDAS" ? todas.filter((n) => !n.lida) : todas),
    [todas, filtroLida],
  );

  const handleSelectTipo = (novoTipo) => {
    setTipo(novoTipo);
    setFormError("");
    const sugestao = TIPO_AVISO_META[novoTipo]?.sugestao;
    if (sugestao && !mensagem.trim()) {
      setMensagem(sugestao);
    }
  };

  const handleEnviar = () => {
    if (!mensagem.trim()) {
      return setFormError("Escreva a mensagem do aviso.");
    }
    setFormError("");
    criar.mutate(
      {
        alunoId,
        data: { tipo, mensagem: mensagem.trim() },
      },
      {
        onSuccess: () => setMensagem(""),
      },
    );
  };

  return (
    <View>
      <Surface style={styles.card} elevation={1}>
        <Text variant="titleMedium" style={styles.cardTitle}>
          Enviar Novo Aviso
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsRow}
        >
          {TIPOS_AVISO.map((key) => {
            const meta = TIPO_AVISO_META[key];
            const selected = tipo === key;
            return (
              <Chip
                key={key}
                selected={selected}
                onPress={() => handleSelectTipo(key)}
                icon={meta.icon}
                style={[styles.tipoChip, selected && { backgroundColor: meta.bg }]}
                textStyle={selected ? { color: meta.color, fontWeight: "700" } : undefined}
              >
                {meta.label}
              </Chip>
            );
          })}
        </ScrollView>

        <TextInput
          label="Mensagem do aviso *"
          mode="outlined"
          multiline
          numberOfLines={3}
          placeholder="Ex.: A van está chegando em 5 minutos."
          value={mensagem}
          onChangeText={(v) => {
            setMensagem(v);
            setFormError("");
          }}
          style={styles.input}
        />

        {formError ? (
          <HelperText type="error" visible>
            {formError}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          icon="send"
          loading={criar.isPending}
          disabled={criar.isPending}
          onPress={handleEnviar}
          buttonColor={colors.primary}
          textColor={colors.secondary}
          style={styles.submitBtn}
        >
          Enviar Aviso
        </Button>
      </Surface>

      {isResponsavel && (
        <SegmentedButtons
          value={escopo}
          onValueChange={setEscopo}
          density="small"
          buttons={[
            { value: "ALUNO", label: "Aluno selecionado" },
            { value: "TODOS", label: "Todos os filhos" },
          ]}
          style={styles.escopoSegment}
        />
      )}

      <View style={styles.filterHeader}>
        <Text variant="titleSmall" style={styles.listHeader}>
          Avisos ({filtradas.length})
        </Text>
        <View style={styles.filterChips}>
          <Chip
            compact
            selected={filtroLida === "TODAS"}
            onPress={() => setFiltroLida("TODAS")}
          >
            Todas
          </Chip>
          <Chip
            compact
            selected={filtroLida === "NAO_LIDAS"}
            onPress={() => setFiltroLida("NAO_LIDAS")}
          >
            Não lidas ({naoLidasCount})
          </Chip>
        </View>
      </View>

      {queryAtiva.isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon="bell-sleep-outline"
          title="Nenhum aviso encontrado"
          description={
            filtroLida === "NAO_LIDAS"
              ? "Todas as notificações já foram lidas."
              : "Ainda não existem comunicados para este aluno."
          }
        />
      ) : (
        filtradas.map((item) => {
          const meta = TIPO_AVISO_META[item.tipo] || TIPO_AVISO_META.GERAL;
          return (
            <Surface
              key={item.id}
              style={[
                styles.itemCard,
                !item.lida && styles.unreadCard,
              ]}
              elevation={1}
            >
              <View style={styles.itemTop}>
                <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                  <MaterialCommunityIcons
                    name={meta.icon}
                    size={15}
                    color={meta.color}
                  />
                  <Text style={[styles.badgeText, { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </View>

                <Text variant="labelSmall" style={styles.timeText}>
                  {formatarDataHoraBR(item.timestamp)}
                </Text>
              </View>

              {usandoTodosFilhos && item.aluno?.nome ? (
                <Text variant="labelSmall" style={styles.alunoTag}>
                  Aluno: {item.aluno.nome}
                </Text>
              ) : null}

              <Text variant="bodyMedium" style={styles.msgText}>
                {item.mensagem}
              </Text>

              <View style={styles.itemActions}>
                {!item.lida ? (
                  <Button
                    mode="text"
                    compact
                    icon="check-all"
                    disabled={marcarLida.isPending}
                    onPress={() =>
                      marcarLida.mutate({
                        notificacaoId: item.id,
                        alunoId: item.alunoId || alunoId,
                      })
                    }
                  >
                    Marcar como lida
                  </Button>
                ) : (
                  <Text variant="labelSmall" style={styles.lidaText}>
                    Lida
                  </Text>
                )}

                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor={colors.error}
                  disabled={remover.isPending}
                  onPress={() =>
                    onConfirmDelete({
                      title: "Excluir aviso?",
                      description: "Deseja remover esta notificação?",
                      onConfirm: () =>
                        remover.mutate({
                          alunoId: item.alunoId || alunoId,
                          notificacaoId: item.id,
                        }),
                    })
                  }
                />
              </View>
            </Surface>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontWeight: "800",
    color: colors.secondary,
    marginBottom: 10,
  },
  chipsScroll: {
    marginBottom: 10,
  },
  chipsRow: {
    gap: 8,
  },
  tipoChip: {
    backgroundColor: colors.surfaceVariant,
  },
  input: {
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  submitBtn: {
    marginTop: 4,
    borderRadius: 10,
  },
  escopoSegment: {
    marginBottom: 12,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  listHeader: {
    fontWeight: "700",
    color: colors.secondary,
  },
  filterChips: {
    flexDirection: "row",
    gap: 6,
  },
  loader: {
    marginVertical: 24,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  timeText: {
    color: colors.textSecondary,
  },
  alunoTag: {
    color: colors.primaryDark,
    fontWeight: "700",
    marginBottom: 4,
  },
  msgText: {
    color: colors.text,
    lineHeight: 20,
  },
  itemActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 2,
  },
  lidaText: {
    color: colors.textSecondary,
    paddingLeft: 8,
  },
});

