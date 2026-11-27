import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  Avatar,
  Chip,
  Dialog,
  Divider,
  Portal,
  HelperText,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { colors } from "../theme";
import { mascaraPlaca, mascaraTelefone } from "../utils/format";
import {
  validarCapacidadeVan,
  validarCNH,
  validarPlaca,
  validarSenha,
  validarTelefone,
} from "../utils/validators";
import { useAuthStore } from "../store/useAuthStore";
import {
  useUserProfileQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
  useDeleteAccountMutation,
} from "../hooks/useAuth";

/**
 * Tela de Perfil do Motorista — Fase 5
 * - Seções claras: Dados pessoais e Dados da van e Pix
 * - Máscaras e validadores de telefone, placa, CNH e capacidade da van
 * - Item "Sobre o Projeto" (`/sobre`)
 * - "Sair da conta" (revoga token e limpa caches)
 * - "Excluir minha conta" com confirmação citando o nome do motorista
 */
export default function PerfilScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const profile = useUserProfileQuery(user?.id);
  const update = useUpdateProfileMutation();
  const logout = useLogoutMutation();
  const remove = useDeleteAccountMutation();

  const perfil = profile.data?.user || profile.data || user;
  const van = perfil?.motorista;

  const [editando, setEditando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null); // "logout" | "delete" | null

  const set = (campo) => (valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (error) setError("");
  };

  const iniciarEdicao = () => {
    setForm({
      nome: perfil?.nome || "",
      telefone: perfil?.telefone ? mascaraTelefone(perfil.telefone) : "",
      senha: "",
      cnh: van?.cnh || "",
      placaVeiculo: van?.placaVeiculo ? mascaraPlaca(van.placaVeiculo) : "",
      capacidadeVan: String(van?.capacidadeVan || "15"),
      chavePix: van?.chavePix || "",
      titularPix: van?.titularPix || perfil?.nome || "",
    });
    setShowPassword(false);
    setError("");
    setEditando(true);
  };

  const salvar = () => {
    if (!form.nome?.trim() || form.nome.trim().length < 2) {
      return setError("Informe seu nome completo.");
    }
    if (form.telefone?.trim()) {
      const erroTel = validarTelefone(form.telefone);
      if (erroTel) return setError(erroTel);
    }
    if (form.senha) {
      const erroSenha = validarSenha(form.senha);
      if (erroSenha) return setError(erroSenha);
    }
    if (form.cnh?.trim()) {
      const erroCnh = validarCNH(form.cnh);
      if (erroCnh) return setError(erroCnh);
    }
    if (form.placaVeiculo?.trim()) {
      const erroPlaca = validarPlaca(form.placaVeiculo);
      if (erroPlaca) return setError(erroPlaca);
    }
    const erroCap = validarCapacidadeVan(form.capacidadeVan);
    if (erroCap) return setError(erroCap);

    const data = {
      nome: form.nome.trim(),
      telefone: form.telefone?.trim() || null,
      ...(form.senha && { senha: form.senha }),
      cnh: form.cnh?.replace(/\D/g, "") || null,
      placaVeiculo:
        form.placaVeiculo?.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || null,
      capacidadeVan: parseInt(form.capacidadeVan, 10),
      chavePix: form.chavePix?.trim() || null,
      titularPix: form.titularPix?.trim() || form.nome.trim(),
    };

    update.mutate(
      { userId: user.id, data },
      { onSuccess: () => setEditando(false) },
    );
  };

  const linha = (label, valor) => (
    <View style={styles.linha}>
      <Text variant="labelSmall" style={styles.label}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={styles.valor}>
        {valor || "—"}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Avatar.Text
            size={76}
            label={(perfil?.nome || "M").slice(0, 2).toUpperCase()}
            style={{ backgroundColor: colors.primary }}
            color={colors.text}
          />
          <Text variant="headlineSmall" style={styles.nome}>
            {perfil?.nome}
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            {perfil?.email}
          </Text>
          <Chip
            icon="bus-school"
            style={styles.chip}
            textStyle={styles.chipText}
          >
            Motorista Escolar
          </Chip>
        </View>

        {!editando ? (
          <>
            <Surface style={styles.card} elevation={1}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Dados Pessoais
              </Text>
              <Divider style={styles.divider} />
              {linha("Nome completo", perfil?.nome)}
              {linha("E-mail", perfil?.email)}
              {linha("WhatsApp / Telefone", perfil?.telefone)}
            </Surface>

            <Surface style={styles.card} elevation={1}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Dados da Van e Pix
              </Text>
              <Divider style={styles.divider} />
              {linha("Placa da van", van?.placaVeiculo)}
              {linha(
                "Capacidade da van",
                van?.capacidadeVan ? `${van.capacidadeVan} lugares` : null,
              )}
              {linha("CNH", van?.cnh)}
              {linha("Chave Pix para cobranças", van?.chavePix)}
              {linha("Titular do Pix", van?.titularPix)}

              <Button
                mode="contained"
                icon="pencil-outline"
                buttonColor={colors.primary}
                textColor={colors.text}
                style={styles.primaryBtn}
                contentStyle={styles.primaryBtnContent}
                labelStyle={styles.primaryBtnLabel}
                onPress={iniciarEdicao}
              >
                Editar perfil e dados da van
              </Button>
            </Surface>
          </>
        ) : (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Editar Perfil e Dados da Van
            </Text>
            <Divider style={styles.divider} />

            <TextInput
              label="Nome completo *"
              mode="outlined"
              value={form.nome}
              onChangeText={set("nome")}
              style={styles.input}
            />
            <TextInput
              label="WhatsApp / Telefone"
              mode="outlined"
              keyboardType="phone-pad"
              value={form.telefone}
              onChangeText={(v) => set("telefone")(mascaraTelefone(v))}
              style={styles.input}
            />
            <TextInput
              label="Nova senha (opcional)"
              mode="outlined"
              secureTextEntry={!showPassword}
              value={form.senha}
              onChangeText={set("senha")}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword((v) => !v)}
                />
              }
              style={styles.input}
            />

            <Divider style={styles.divider} />
            <Text variant="labelLarge" style={styles.subSectionTitle}>
              Van Escolar e Pix
            </Text>

            <TextInput
              label="Placa da van *"
              mode="outlined"
              autoCapitalize="characters"
              value={form.placaVeiculo}
              onChangeText={(v) => set("placaVeiculo")(mascaraPlaca(v))}
              style={styles.input}
            />
            <TextInput
              label="Capacidade (1 a 60 lugares) *"
              mode="outlined"
              keyboardType="number-pad"
              value={form.capacidadeVan}
              onChangeText={(v) =>
                set("capacidadeVan")(v.replace(/\D/g, "").slice(0, 2))
              }
              style={styles.input}
            />
            <TextInput
              label="CNH (11 dígitos)"
              mode="outlined"
              keyboardType="number-pad"
              value={form.cnh}
              onChangeText={(v) =>
                set("cnh")(v.replace(/\D/g, "").slice(0, 11))
              }
              style={styles.input}
            />
            <TextInput
              label="Chave Pix (para cobranças no WhatsApp)"
              mode="outlined"
              value={form.chavePix}
              onChangeText={set("chavePix")}
              style={styles.input}
            />
            <TextInput
              label="Titular do Pix"
              mode="outlined"
              value={form.titularPix}
              onChangeText={set("titularPix")}
              style={styles.input}
            />

            {error || update.isError ? (
              <HelperText type="error" visible>
                {error || update.error?.friendlyMessage}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              icon="content-save-outline"
              loading={update.isPending}
              disabled={update.isPending}
              onPress={salvar}
              buttonColor={colors.primary}
              textColor={colors.text}
              style={styles.primaryBtn}
              contentStyle={styles.primaryBtnContent}
              labelStyle={styles.primaryBtnLabel}
            >
              Salvar alterações
            </Button>
            <Button
              mode="outlined"
              onPress={() => setEditando(false)}
              disabled={update.isPending}
              style={styles.secondaryBtn}
              contentStyle={styles.secondaryBtnContent}
              textColor={colors.secondary}
            >
              Cancelar
            </Button>
          </Surface>
        )}

        <Surface style={styles.card} elevation={1}>
          <Button
            mode="outlined"
            icon="information-outline"
            onPress={() => router.push("/sobre")}
            style={styles.secondaryBtn}
            contentStyle={styles.secondaryBtnContent}
            textColor={colors.secondary}
          >
            Sobre o Projeto
          </Button>
          <Button
            mode="contained-tonal"
            icon="logout"
            onPress={() => setDialog("logout")}
            style={styles.secondaryBtn}
            contentStyle={styles.secondaryBtnContent}
          >
            Sair da conta
          </Button>
          <Button
            mode="outlined"
            icon="account-remove-outline"
            textColor={colors.error}
            onPress={() => setDialog("delete")}
            style={[styles.secondaryBtn, { borderColor: "#FCA5A5" }]}
            contentStyle={styles.secondaryBtnContent}
          >
            Excluir minha conta
          </Button>
        </Surface>
      </ScrollView>

      <Portal>
        <Dialog
          visible={dialog === "logout"}
          onDismiss={() => !logout.isPending && setDialog(null)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Sair da conta?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Sua sessão será encerrada com segurança neste aparelho.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button disabled={logout.isPending} onPress={() => setDialog(null)}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.primary}
              textColor={colors.text}
              loading={logout.isPending}
              disabled={logout.isPending}
              onPress={() =>
                logout.mutate(undefined, { onSettled: () => setDialog(null) })
              }
            >
              Sair
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={dialog === "delete"}
          onDismiss={() => !remove.isPending && setDialog(null)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="alert-circle-outline" color={colors.error} />
          <Dialog.Title style={styles.dialogTitle}>
            Excluir conta de {perfil?.nome || "motorista"}?
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Tem certeza que deseja excluir permanentemente a conta de{" "}
              <Text style={{ fontWeight: "800" }}>
                {perfil?.nome || "motorista"}
              </Text>
              ? Essa ação é irreversível e apagará seus dados do servidor.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button disabled={remove.isPending} onPress={() => setDialog(null)}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={colors.error}
              textColor="#FFFFFF"
              loading={remove.isPending}
              disabled={remove.isPending}
              onPress={() =>
                remove.mutate(user.id, { onSettled: () => setDialog(null) })
              }
            >
              Excluir permanentemente
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  header: {
    alignItems: "center",
    marginBottom: 4,
  },
  nome: {
    fontWeight: "800",
    color: colors.secondary,
    marginTop: 10,
  },
  email: {
    color: colors.textSecondary,
  },
  chip: {
    marginTop: 10,
    backgroundColor: colors.primaryLight,
  },
  chipText: {
    fontWeight: "800",
    color: "#92400E",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontWeight: "800",
    color: colors.secondary,
  },
  subSectionTitle: {
    fontWeight: "800",
    color: colors.secondary,
    marginBottom: 10,
  },
  divider: {
    marginVertical: 12,
  },
  linha: {
    marginBottom: 12,
  },
  label: {
    color: colors.textSecondary,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  valor: {
    color: colors.secondary,
    fontWeight: "600",
    marginTop: 2,
  },
  input: {
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  primaryBtn: {
    marginTop: 8,
    borderRadius: 12,
  },
  primaryBtnContent: {
    height: 52,
  },
  primaryBtnLabel: {
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryBtn: {
    marginVertical: 5,
    borderRadius: 12,
  },
  secondaryBtnContent: {
    minHeight: 48,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 18,
  },
  dialogTitle: {
    fontWeight: "800",
    color: colors.secondary,
  },
});
