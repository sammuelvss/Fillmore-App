import React, { useState } from "react";
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  Dialog,
  Divider,
  Portal,
  Surface,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../../../theme";
import {
  MODALIDADES,
  STATUS_MENSALIDADE,
  resolverStatusMensalidade,
} from "../../../constants";
import { formatarDataBR, formatarMoeda } from "../../../utils/format";
import { abrirWhatsApp } from "../../../utils/whatsapp";
import {
  mensagemCobrancaPix,
  mensagemContatoResponsavel,
} from "../../../utils/mensagens";
import { useAuthStore } from "../../../store/useAuthStore";
import { useAppStore } from "../../../store/useAppStore";
import {
  useAlunoDetailQuery,
  useDeleteAlunoMutation,
  useDesvincularAlunoRotaMutation,
} from "../../../hooks/useAlunos";
import { useRotasQuery } from "../../../hooks/useRotas";
import {
  useMensalidadesQuery,
  useRegistrarPagamentoMutation,
  useUpdateMensalidadeMutation,
} from "../../../hooks/useMensalidades";
import ErrorState from "../../../components/ErrorState";
import VincularRotaDialog from "../../../components/alunos/VincularRotaDialog";
import LotacaoConflitoDialog from "../../../components/alunos/LotacaoConflitoDialog";

/**
 * Detalhe do Aluno — Fase 4
 * Exibe:
 * - Dados do aluno, escola, modalidade e vencimento
 * - Endereços de embarque e desembarque (guarda compartilhada)
 * - Responsável com botões "WhatsApp" e "Ligar"
 * - Rotas vinculadas (Ida / Volta) com botão "Vincular a uma rota" (mostrando ocupação antes do vínculo)
 * - Mensalidades do aluno com status PAGO / PENDENTE / ATRASADO e "Registrar pagamento" com "Desfazer"
 */
export default function AlunoDetalheScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const alunoId = Array.isArray(params.id) ? params.id[0] : params.id;

  const user = useAuthStore((state) => state.user);
  const showSnackbar = useAppStore((state) => state.showSnackbar);
  const setAlunoAtivo = useAppStore((state) => state.setAlunoAtivo);

  const [vincularVisible, setVincularVisible] = useState(false);
  const [lotacaoConflito, setLotacaoConflito] = useState(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const alunoQuery = useAlunoDetailQuery(alunoId);
  const rotasQuery = useRotasQuery();
  const mensalidadesQuery = useMensalidadesQuery(alunoId);

  const deleteAlunoMutation = useDeleteAlunoMutation();
  const desvincularMutation = useDesvincularAlunoRotaMutation();
  const registrarPagamentoMutation = useRegistrarPagamentoMutation();
  const updateMensalidadeMutation = useUpdateMensalidadeMutation();

  const aluno = alunoQuery.data;
  const rotas = Array.isArray(rotasQuery.data) ? rotasQuery.data : [];
  const mensalidades = Array.isArray(mensalidadesQuery.data)
    ? mensalidadesQuery.data
    : [];

  if (alunoQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Carregando detalhes do aluno...
        </Text>
      </View>
    );
  }

  if (alunoQuery.isError || !aluno) {
    return (
      <ErrorState
        message={
          alunoQuery.error?.friendlyMessage ||
          "Não foi possível carregar os dados deste aluno."
        }
        onRetry={alunoQuery.refetch}
      />
    );
  }

  const mod = MODALIDADES[aluno.modalidade] || MODALIDADES.IDA_E_VOLTA;
  const responsavelNome =
    aluno.responsavel?.usuario?.nome ||
    aluno.nomeContatoEntrega ||
    "Responsável";
  const responsavelTel =
    aluno.responsavel?.usuario?.telefone ||
    aluno.telefoneContatoEntrega ||
    "";
  const responsavelEmail = aluno.responsavel?.usuario?.email || "";

  const handleWhatsApp = async () => {
    const msg = mensagemContatoResponsavel({
      responsavelNome,
      alunoNome: aluno.nome,
      motoristaNome: user?.nome,
    });
    await abrirWhatsApp(responsavelTel, msg, (erroMsg) =>
      showSnackbar(erroMsg, "error"),
    );
  };

  const handleLigar = async () => {
    const digitos = String(responsavelTel).replace(/\D/g, "");
    if (!digitos) {
      showSnackbar("Telefone do responsável não cadastrado.", "error");
      return;
    }
    try {
      await Linking.openURL(`tel:${digitos}`);
    } catch {
      showSnackbar("Não foi possível iniciar a ligação.", "error");
    }
  };

  const handleRegistrarPagamento = async (fatura) => {
    try {
      await registrarPagamentoMutation.mutateAsync({
        alunoId: aluno.id,
        mensalidadeId: fatura.id,
        dataPagamento: new Date().toISOString(),
      });
      showSnackbar("Pagamento registrado!", "success", {
        label: "Desfazer",
        onPress: () => {
          updateMensalidadeMutation.mutate({
            alunoId: aluno.id,
            mensalidadeId: fatura.id,
            data: { status: "PENDENTE", dataPagamento: null },
          });
        },
      });
    } catch (err) {
      showSnackbar(
        err?.friendlyMessage || "Não foi possível registrar o pagamento.",
        "error",
      );
    }
  };

  const handleCobrarWhatsApp = async (fatura) => {
    const msg = mensagemCobrancaPix({
      responsavelNome,
      alunoNome: aluno.nome,
      valor: formatarMoeda(fatura.valor),
      dataVencimentoBR: formatarDataBR(fatura.dataVencimento),
      chavePix: user?.motorista?.chavePix,
    });
    await abrirWhatsApp(responsavelTel, msg, (erroMsg) =>
      showSnackbar(erroMsg, "error"),
    );
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteAlunoMutation.mutateAsync(aluno.id);
      setConfirmDeleteVisible(false);
      router.replace("/(tabs)/alunos");
    } catch {
      setConfirmDeleteVisible(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={
            alunoQuery.isRefetching || mensalidadesQuery.isRefetching
          }
          onRefresh={() => {
            alunoQuery.refetch();
            mensalidadesQuery.refetch();
          }}
          colors={[colors.primary]}
        />
      }
    >
      {/* Card Principal do Aluno */}
      <Surface style={styles.heroCard} elevation={1}>
        <View style={styles.headerTopRow}>
          <Chip
            icon={mod.icon}
            compact
            style={[styles.modChip, { backgroundColor: mod.bg }]}
            textStyle={[styles.modChipText, { color: mod.text }]}
          >
            {mod.label}
          </Chip>

          {aluno.diaVencimentoMensalidade ? (
            <Chip
              icon="calendar-month-outline"
              compact
              style={styles.vencChip}
              textStyle={styles.vencChipText}
            >
              Venc. dia {aluno.diaVencimentoMensalidade}
            </Chip>
          ) : null}
        </View>

        <Text variant="headlineSmall" style={styles.alunoNome}>
          {aluno.nome}
        </Text>

        <View style={styles.escolaRow}>
          <MaterialCommunityIcons
            name="school-outline"
            size={18}
            color={colors.secondary}
          />
          <Text variant="bodyLarge" style={styles.escolaText}>
            {aluno.escola}
          </Text>
        </View>

        <View style={styles.actionsGrid}>
          <Button
            mode="contained"
            icon="bus-stop"
            onPress={() => setVincularVisible(true)}
            buttonColor={colors.primary}
            textColor={colors.text}
            style={styles.primaryBtn}
            contentStyle={styles.primaryBtnContent}
            labelStyle={styles.primaryBtnLabel}
          >
            Vincular a uma rota
          </Button>

          <Button
            mode="outlined"
            icon="pencil-outline"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/alunos/form",
                params: { id: aluno.id },
              })
            }
            textColor={colors.secondary}
            style={styles.editBtn}
            contentStyle={styles.secondaryBtnContent}
          >
            Editar dados do aluno
          </Button>
        </View>
      </Surface>

      {/* Responsável Legal & Contato */}
      <Surface style={styles.sectionCard} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Responsável e Contato
        </Text>
        <Divider style={styles.divider} />

        <View style={styles.respInfoBox}>
          <MaterialCommunityIcons
            name="account-tie"
            size={26}
            color={colors.secondary}
          />
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={styles.respName}>
              {responsavelNome}
            </Text>
            <Text variant="bodySmall" style={styles.respMeta}>
              {responsavelTel || "Telefone não informado"}
              {responsavelEmail ? ` • ${responsavelEmail}` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.contactButtonsRow}>
          <Button
            mode="contained-tonal"
            icon="whatsapp"
            buttonColor="#DCFCE7"
            textColor="#166534"
            style={styles.contactBtn}
            contentStyle={styles.secondaryBtnContent}
            onPress={handleWhatsApp}
          >
            WhatsApp
          </Button>

          <Button
            mode="outlined"
            icon="phone-outline"
            textColor={colors.secondary}
            style={styles.contactBtn}
            contentStyle={styles.secondaryBtnContent}
            onPress={handleLigar}
          >
            Ligar
          </Button>
        </View>
      </Surface>

      {/* Endereços (Guarda Compartilhada) e Rotas */}
      <Surface style={styles.sectionCard} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Endereços e Rotas Vinculadas
        </Text>
        <Divider style={styles.divider} />

        <View style={styles.addressBlock}>
          <View style={styles.addressItem}>
            <MaterialCommunityIcons
              name="home-export-outline"
              size={20}
              color={colors.success}
            />
            <View style={{ flex: 1 }}>
              <Text variant="labelSmall" style={styles.addressLabel}>
                ENDEREÇO DE EMBARQUE (MANHÃ)
              </Text>
              <Text variant="bodyMedium" style={styles.addressValue}>
                {aluno.enderecoEmbarque || "Não informado"}
              </Text>
            </View>
          </View>

          <View style={styles.addressItem}>
            <MaterialCommunityIcons
              name="home-import-outline"
              size={20}
              color={colors.info}
            />
            <View style={{ flex: 1 }}>
              <Text variant="labelSmall" style={styles.addressLabel}>
                ENDEREÇO DE DESEMBARQUE (TARDE)
              </Text>
              <Text variant="bodyMedium" style={styles.addressValue}>
                {aluno.enderecoDesembarque || "Não informado"}
              </Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.rotasStatusList}>
          <View style={styles.rotaStatusItem}>
            <View style={{ flex: 1 }}>
              <Text variant="labelSmall" style={styles.addressLabel}>
                ROTA DE IDA (MANHÃ)
              </Text>
              <Text variant="titleSmall" style={styles.rotaStatusName}>
                {aluno.rotaIda?.nome || "Não vinculada"}
              </Text>
            </View>
            {aluno.rotaIdaId ? (
              <Button
                mode="text"
                compact
                textColor={colors.error}
                onPress={() =>
                  desvincularMutation.mutate({
                    rotaId: aluno.rotaIdaId,
                    alunoId: aluno.id,
                  })
                }
              >
                Desvincular
              </Button>
            ) : null}
          </View>

          <View style={styles.rotaStatusItem}>
            <View style={{ flex: 1 }}>
              <Text variant="labelSmall" style={styles.addressLabel}>
                ROTA DE VOLTA (TARDE)
              </Text>
              <Text variant="titleSmall" style={styles.rotaStatusName}>
                {aluno.rotaVolta?.nome || "Não vinculada"}
              </Text>
            </View>
            {aluno.rotaVoltaId ? (
              <Button
                mode="text"
                compact
                textColor={colors.error}
                onPress={() =>
                  desvincularMutation.mutate({
                    rotaId: aluno.rotaVoltaId,
                    alunoId: aluno.id,
                  })
                }
              >
                Desvincular
              </Button>
            ) : null}
          </View>
        </View>
      </Surface>

      {/* Mensalidades do Aluno */}
      <Surface style={styles.sectionCard} elevation={1}>
        <View style={styles.sectionHeaderRow}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Mensalidades ({mensalidades.length})
          </Text>
          <Button
            mode="text"
            compact
            icon="cash-multiple"
            textColor={colors.primaryDark}
            onPress={() => {
              setAlunoAtivo(aluno);
              router.push("/(tabs)/financeiro");
            }}
          >
            Ver no Financeiro
          </Button>
        </View>
        <Divider style={styles.divider} />

        {mensalidadesQuery.isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginVertical: 14 }}
          />
        ) : mensalidades.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyMensalidadesText}>
            Nenhuma mensalidade lançada para este aluno ainda.
          </Text>
        ) : (
          mensalidades.slice(0, 5).map((fatura, idx) => {
            const { status, diasAtraso } = resolverStatusMensalidade(fatura);
            const cfg =
              STATUS_MENSALIDADE[status] || STATUS_MENSALIDADE.PENDENTE;
            const isPago = status === "PAGO";

            return (
              <View
                key={fatura.id}
                style={[
                  styles.faturaItem,
                  idx < Math.min(mensalidades.length, 5) - 1 &&
                    styles.faturaBorder,
                ]}
              >
                <View style={styles.faturaTopRow}>
                  <View>
                    <Text variant="titleMedium" style={styles.faturaValor}>
                      {formatarMoeda(fatura.valor)}
                    </Text>
                    <Text variant="bodySmall" style={styles.faturaVenc}>
                      Vencimento: {formatarDataBR(fatura.dataVencimento)}
                      {diasAtraso > 0 ? ` (${diasAtraso}d em atraso)` : ""}
                    </Text>
                  </View>

                  <Chip
                    compact
                    icon={cfg.icon}
                    style={{ backgroundColor: cfg.bg }}
                    textStyle={{
                      color: cfg.text,
                      fontWeight: "800",
                      fontSize: 11,
                    }}
                  >
                    {cfg.label}
                  </Chip>
                </View>

                {!isPago ? (
                  <View style={styles.faturaActions}>
                    <Button
                      mode="contained-tonal"
                      compact
                      icon="check-circle-outline"
                      buttonColor="#DCFCE7"
                      textColor="#166534"
                      onPress={() => handleRegistrarPagamento(fatura)}
                    >
                      Registrar pagamento
                    </Button>
                    <Button
                      mode="outlined"
                      compact
                      icon="whatsapp"
                      textColor={colors.secondary}
                      onPress={() => handleCobrarWhatsApp(fatura)}
                    >
                      Cobrar
                    </Button>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </Surface>

      {/* Excluir Aluno */}
      <Button
        mode="outlined"
        icon="trash-can-outline"
        textColor={colors.error}
        style={styles.deleteBtn}
        contentStyle={styles.secondaryBtnContent}
        onPress={() => setConfirmDeleteVisible(true)}
      >
        Excluir aluno
      </Button>

      <VincularRotaDialog
        visible={vincularVisible}
        aluno={aluno}
        rotas={rotas}
        capacidadePadrao={user?.motorista?.capacidadeVan || 15}
        onDismiss={() => setVincularVisible(false)}
        onLotacaoConflito={(info) => setLotacaoConflito(info)}
      />

      <LotacaoConflitoDialog
        conflito={lotacaoConflito}
        onDismiss={() => setLotacaoConflito(null)}
        onGerenciarLotacao={() => router.push("/(tabs)/alunos/lotacao")}
      />

      <Portal>
        <Dialog
          visible={confirmDeleteVisible}
          onDismiss={() => setConfirmDeleteVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="alert-circle-outline" color={colors.error} />
          <Dialog.Title style={styles.dialogTitle}>
            Excluir Aluno?
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              Deseja realmente remover{" "}
              <Text style={styles.boldText}>{aluno.nome}</Text>? Esta ação
              excluirá o cadastro e seus vínculos no servidor.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setConfirmDeleteVisible(false)}
              textColor={colors.textSecondary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.error}
              textColor="#FFFFFF"
              loading={deleteAlunoMutation.isPending}
              disabled={deleteAlunoMutation.isPending}
              onPress={handleConfirmDelete}
            >
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  modChip: {
    borderRadius: 8,
  },
  modChipText: {
    fontWeight: "800",
    fontSize: 12,
  },
  vencChip: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  vencChipText: {
    fontWeight: "700",
    color: colors.secondary,
  },
  alunoNome: {
    fontWeight: "800",
    color: colors.secondary,
  },
  escolaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  escolaText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  actionsGrid: {
    gap: 10,
    marginTop: 6,
  },
  primaryBtn: {
    borderRadius: 12,
  },
  primaryBtnContent: {
    height: 52,
  },
  primaryBtnLabel: {
    fontWeight: "800",
    fontSize: 16,
  },
  editBtn: {
    borderRadius: 12,
    borderColor: colors.border,
  },
  secondaryBtnContent: {
    minHeight: 48,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: "800",
    color: colors.secondary,
  },
  divider: {
    marginVertical: 12,
  },
  respInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  respName: {
    fontWeight: "800",
    color: colors.secondary,
  },
  respMeta: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    borderRadius: 12,
  },
  addressBlock: {
    gap: 12,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  addressLabel: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
  addressValue: {
    color: colors.text,
    fontWeight: "600",
    marginTop: 2,
  },
  rotasStatusList: {
    gap: 10,
  },
  rotaStatusItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rotaStatusName: {
    color: colors.secondary,
    fontWeight: "700",
    marginTop: 2,
  },
  emptyMensalidadesText: {
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 12,
  },
  faturaItem: {
    paddingVertical: 10,
    gap: 8,
  },
  faturaBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  faturaTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faturaValor: {
    fontWeight: "800",
    color: colors.secondary,
  },
  faturaVenc: {
    color: colors.textSecondary,
  },
  faturaActions: {
    flexDirection: "row",
    gap: 8,
  },
  deleteBtn: {
    borderRadius: 12,
    borderColor: "#FCA5A5",
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 18,
  },
  dialogTitle: {
    textAlign: "center",
    fontWeight: "800",
    color: colors.secondary,
  },
  dialogText: {
    color: colors.text,
    textAlign: "center",
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "700",
    color: colors.secondary,
  },
});
