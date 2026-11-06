import React, { useState } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  Avatar,
  Chip,
  Dialog,
  Portal,
  HelperText,
} from "react-native-paper";
import { colors } from "../../../theme";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  useUserProfileQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
  useDeleteAccountMutation,
} from "../../../hooks/useAuth";

// Meu Perfil: GET/PUT/DELETE /users/:id e logout
export default function PerfilScreen() {
  const user = useAuthStore((s) => s.user);
  const isMotorista = user?.tipo === "MOTORISTA";

  const profile = useUserProfileQuery(user?.id);
  const update = useUpdateProfileMutation();
  const logout = useLogoutMutation();
  const remove = useDeleteAccountMutation();

  // Dados da API (se carregaram) ou do Zustand
  const perfil = profile.data?.user || profile.data || user;
  const van = perfil?.motorista;

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null); // "logout" | "delete" | null

  const set = (campo) => (valor) => setForm({ ...form, [campo]: valor });

  const iniciarEdicao = () => {
    setForm({
      nome: perfil?.nome || "",
      telefone: perfil?.telefone || "",
      senha: "",
      placaVeiculo: van?.placaVeiculo || "",
      capacidadeVan: String(van?.capacidadeVan || ""),
      chavePix: van?.chavePix || "",
      titularPix: van?.titularPix || "",
    });
    setError("");
    setEditando(true);
  };

  const salvar = () => {
    if (!form.nome.trim()) return setError("Informe o nome.");
    if (form.senha && form.senha.length < 6)
      return setError("A nova senha precisa de ao menos 6 caracteres.");
    if (isMotorista && !(parseInt(form.capacidadeVan, 10) > 0))
      return setError("Informe a capacidade da van.");

    const data = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || undefined,
      ...(form.senha && { senha: form.senha }),
      ...(isMotorista && {
        placaVeiculo: form.placaVeiculo.trim() || undefined,
        capacidadeVan: parseInt(form.capacidadeVan, 10),
        chavePix: form.chavePix.trim() || undefined,
        titularPix: form.titularPix.trim() || undefined,
      }),
    };
    update.mutate({ userId: user.id, data }, { onSuccess: () => setEditando(false) });
  };

  const campo = (label, name, props = {}) => (
    <TextInput
      label={label}
      mode="outlined"
      value={form[name]}
      onChangeText={set(name)}
      style={styles.input}
      {...props}
    />
  );

  const linha = (label, valor) => (
    <View style={styles.linha}>
      <Text variant="labelSmall" style={styles.label}>{label}</Text>
      <Text variant="bodyMedium">{valor || "—"}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Avatar.Text
            size={72}
            label={(perfil?.nome || "U").slice(0, 2).toUpperCase()}
            style={{ backgroundColor: colors.primary }}
            color={colors.secondary}
          />
          <Text variant="headlineSmall" style={styles.nome}>{perfil?.nome}</Text>
          <Text variant="bodySmall">{perfil?.email}</Text>
          <Chip icon={isMotorista ? "bus-school" : "account-child-circle"} style={styles.chip}>
            {isMotorista ? "Motorista" : "Responsável"}
          </Chip>
        </View>

        <Surface style={styles.card} elevation={1}>
          {!editando ? (
            <>
              {linha("Telefone", perfil?.telefone)}
              {isMotorista && (
                <>
                  {linha("Placa da van", van?.placaVeiculo)}
                  {linha("Capacidade", van?.capacidadeVan && `${van.capacidadeVan} alunos`)}
                  {linha("Chave Pix", van?.chavePix)}
                  {linha("Titular Pix", van?.titularPix)}
                </>
              )}
              <Button mode="contained-tonal" icon="pencil-outline" onPress={iniciarEdicao}>
                Editar perfil
              </Button>
            </>
          ) : (
            <>
              {campo("Nome *", "nome")}
              {campo("Telefone", "telefone", { keyboardType: "phone-pad" })}
              {campo("Nova senha (opcional)", "senha", { secureTextEntry: true })}
              {isMotorista && (
                <>
                  {campo("Placa da van", "placaVeiculo", { autoCapitalize: "characters" })}
                  {campo("Capacidade (alunos)", "capacidadeVan", { keyboardType: "numeric" })}
                  {campo("Chave Pix", "chavePix")}
                  {campo("Titular do Pix", "titularPix")}
                </>
              )}
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
                textColor={colors.secondary}
                style={styles.button}
              >
                Salvar
              </Button>
              <Button onPress={() => setEditando(false)} disabled={update.isPending}>
                Cancelar
              </Button>
            </>
          )}
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Button mode="contained-tonal" icon="logout" onPress={() => setDialog("logout")}>
            Sair da conta
          </Button>
          <Button
            mode="outlined"
            icon="account-remove-outline"
            textColor={colors.error}
            onPress={() => setDialog("delete")}
            style={styles.button}
          >
            Excluir minha conta
          </Button>
        </Surface>
      </ScrollView>

      <Portal>
        <Dialog visible={dialog === "logout"} onDismiss={() => setDialog(null)}>
          <Dialog.Title>Sair da conta?</Dialog.Title>
          <Dialog.Content>
            <Text>O token será revogado e você precisará entrar novamente.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialog(null)}>Cancelar</Button>
            <Button
              onPress={() => {
                setDialog(null);
                logout.mutate();
              }}
            >
              Sair
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={dialog === "delete"} onDismiss={() => setDialog(null)}>
          <Dialog.Title>Excluir conta?</Dialog.Title>
          <Dialog.Content>
            <Text>Essa ação é irreversível e apaga seus dados do servidor.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialog(null)}>Cancelar</Button>
            <Button
              textColor={colors.error}
              onPress={() => {
                setDialog(null);
                remove.mutate(user.id);
              }}
            >
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 16 },
  nome: { fontWeight: "800", color: colors.secondary, marginTop: 10 },
  chip: { marginTop: 10 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 18, marginBottom: 14 },
  linha: { marginBottom: 12 },
  label: { color: colors.textSecondary, textTransform: "uppercase" },
  input: { marginBottom: 8, backgroundColor: colors.surface },
  button: { marginVertical: 8, borderRadius: 10 },
});
