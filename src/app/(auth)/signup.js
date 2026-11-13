import React, { useState } from "react";
import { ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  SegmentedButtons,
  HelperText,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useSignUpMutation } from "../../hooks/useAuth";

// Cadastro (POST /users) de Motorista ou Responsável
export default function SignUpScreen() {
  const router = useRouter();
  const signUp = useSignUpMutation();

  const [tipo, setTipo] = useState("MOTORISTA");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    cnh: "",
    placaVeiculo: "",
    capacidadeVan: "15",
    chavePix: "",
    titularPix: "",
  });
  const [errors, setErrors] = useState({});

  const set = (campo) => (valor) => {
    setForm({ ...form, [campo]: valor });
    setErrors({ ...errors, [campo]: undefined });
  };

  const validate = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = "Informe o nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "E-mail inválido.";
    if (form.senha.length < 6) e.senha = "Mínimo de 6 caracteres.";
    if (tipo === "MOTORISTA" && !(parseInt(form.capacidadeVan, 10) > 0))
      e.capacidadeVan = "Informe a capacidade da van.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = () => {
    if (!validate()) return;
    const nome = form.nome.trim();
    signUp.mutate({
      nome,
      username: nome,
      email: form.email.trim(),
      senha: form.senha,
      tipo,
      telefone: form.telefone.trim() || undefined,
      ...(tipo === "MOTORISTA" && {
        cnh: form.cnh.trim() || undefined,
        placaVeiculo: form.placaVeiculo.trim() || undefined,
        capacidadeVan: parseInt(form.capacidadeVan, 10),
        chavePix: form.chavePix.trim() || undefined,
        titularPix: form.titularPix.trim() || nome,
      }),
    });
  };

  const campo = (label, name, props = {}) => (
    <>
      <TextInput
        label={label}
        mode="outlined"
        value={form[name]}
        onChangeText={set(name)}
        error={!!errors[name]}
        style={styles.input}
        {...props}
      />
      {errors[name] ? <HelperText type="error" visible>{errors[name]}</HelperText> : null}
    </>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.section}>Perfil</Text>
          <SegmentedButtons
            value={tipo}
            onValueChange={setTipo}
            buttons={[
              { value: "MOTORISTA", label: "Motorista", icon: "bus-school" },
              { value: "RESPONSAVEL", label: "Responsável", icon: "account-child-circle" },
            ]}
            style={styles.input}
          />

          <Text variant="titleMedium" style={styles.section}>Dados de acesso</Text>
          {campo("Nome completo *", "nome")}
          {campo("E-mail *", "email", { keyboardType: "email-address", autoCapitalize: "none" })}
          {campo("Senha * (mín. 6)", "senha", {
            secureTextEntry: !showPassword,
            right: (
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword((v) => !v)}
              />
            ),
          })}
          {campo("Telefone", "telefone", { keyboardType: "phone-pad" })}

          {tipo === "MOTORISTA" && (
            <View>
              <Text variant="titleMedium" style={styles.section}>Van e Pix</Text>
              {campo("CNH", "cnh", { keyboardType: "numeric" })}
              {campo("Placa da van", "placaVeiculo", { autoCapitalize: "characters" })}
              {campo("Capacidade (alunos)", "capacidadeVan", { keyboardType: "numeric" })}
              {campo("Chave Pix", "chavePix")}
              {campo("Titular do Pix", "titularPix")}
            </View>
          )}

          {signUp.isError && (
            <HelperText type="error" visible>{signUp.error?.friendlyMessage}</HelperText>
          )}

          <Button
            mode="contained"
            icon="check-circle-outline"
            loading={signUp.isPending}
            disabled={signUp.isPending}
            onPress={handleSignUp}
            buttonColor={colors.primary}
            textColor={colors.secondary}
            style={styles.button}
          >
            Finalizar cadastro
          </Button>
          <Button onPress={() => router.back()} disabled={signUp.isPending}>
            Já tenho conta
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 18 },
  section: { fontWeight: "700", color: colors.secondary, marginVertical: 8 },
  input: { marginBottom: 4, backgroundColor: colors.surface },
  button: { marginTop: 14, borderRadius: 12 },
});
