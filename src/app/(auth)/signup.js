import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  HelperText,
  ProgressBar,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useSignUpMutation } from "../../hooks/useAuth";
import {
  apenasDigitos,
  mascaraPlaca,
  mascaraTelefone,
} from "../../utils/format";
import {
  isCapacidadeVanValida,
  isEmailValido,
  isPlacaValida,
  isTelefoneValido,
} from "../../utils/validators";

// Cadastro de motorista em 2 etapas com barra de progresso e login automático
export default function SignUpScreen() {
  const router = useRouter();
  const signUp = useSignUpMutation();

  const [etapa, setEtapa] = useState(1); // 1 = Dados pessoais | 2 = Van e Pix
  const [showPassword, setShowPassword] = useState(false);
  const [tocado, setTocado] = useState({});
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    senha: "",
    placaVeiculo: "",
    capacidadeVan: "15",
    cnh: "",
    chavePix: "",
    titularPix: "",
  });

  const atualizar = (campo, transform) => (valor) => {
    const novoValor = transform ? transform(valor) : valor;
    setForm((prev) => ({ ...prev, [campo]: novoValor }));
    setTocado((prev) => ({ ...prev, [campo]: true }));
  };

  // Validações inline da Etapa 1 (4 campos)
  const erroNome =
    tocado.nome && form.nome.trim().length < 2
      ? "Informe seu nome completo."
      : "";
  const erroTelefone =
    tocado.telefone && !isTelefoneValido(form.telefone)
      ? "Informe um telefone com DDD (10 ou 11 dígitos)."
      : "";
  const erroEmail =
    tocado.email && !isEmailValido(form.email)
      ? "Informe um e-mail válido."
      : "";
  const erroSenha =
    tocado.senha && form.senha.length < 6
      ? "A senha deve ter pelo menos 6 caracteres."
      : "";

  const etapa1Valida =
    form.nome.trim().length >= 2 &&
    isTelefoneValido(form.telefone) &&
    isEmailValido(form.email) &&
    form.senha.length >= 6;

  // Validações inline da Etapa 2 (5 campos)
  const erroPlaca =
    tocado.placaVeiculo && !isPlacaValida(form.placaVeiculo)
      ? "Informe uma placa válida (ex.: ABC1234 ou REC4E26)."
      : "";
  const erroCapacidade =
    tocado.capacidadeVan && !isCapacidadeVanValida(Number(form.capacidadeVan))
      ? "Informe a capacidade de lugares da van (mínimo 1)."
      : "";
  const erroChavePix =
    tocado.chavePix && !form.chavePix.trim()
      ? "Informe sua chave Pix para receber as mensalidades."
      : "";

  const etapa2Valida =
    isPlacaValida(form.placaVeiculo) &&
    isCapacidadeVanValida(Number(form.capacidadeVan)) &&
    Boolean(form.chavePix.trim());

  const handleAvancarEtapa = () => {
    setTocado((prev) => ({
      ...prev,
      nome: true,
      telefone: true,
      email: true,
      senha: true,
    }));
    if (!etapa1Valida) return;
    if (!form.titularPix.trim()) {
      setForm((prev) => ({ ...prev, titularPix: prev.nome.trim() }));
    }
    setEtapa(2);
  };

  const handleFinalizarCadastro = () => {
    setTocado((prev) => ({
      ...prev,
      placaVeiculo: true,
      capacidadeVan: true,
      chavePix: true,
    }));
    if (!etapa1Valida || !etapa2Valida) return;

    const nomeLimpo = form.nome.trim();
    signUp.mutate({
      nome: nomeLimpo,
      username: nomeLimpo,
      email: form.email.trim().toLowerCase(),
      senha: form.senha,
      tipo: "MOTORISTA",
      telefone: apenasDigitos(form.telefone),
      placaVeiculo: mascaraPlaca(form.placaVeiculo),
      capacidadeVan: Number.parseInt(form.capacidadeVan, 10),
      cnh: apenasDigitos(form.cnh) || undefined,
      chavePix: form.chavePix.trim(),
      titularPix: form.titularPix.trim() || nomeLimpo,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={styles.card} elevation={1}>
          <View style={styles.progressHeader}>
            <Text variant="labelLarge" style={styles.stepIndicator}>
              Etapa {etapa} de 2 •{" "}
              {etapa === 1 ? "Seus dados pessoais" : "Dados da van e Pix"}
            </Text>
            <ProgressBar
              progress={etapa === 1 ? 0.5 : 1}
              color={colors.primary}
              style={styles.progressBar}
            />
          </View>

          {etapa === 1 ? (
            <View style={styles.fieldsGroup}>
              <Text variant="titleLarge" style={styles.title}>
                Cadastro do Motorista
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Preencha seus dados de acesso e contato para os responsáveis.
              </Text>

              <TextInput
                label="Nome completo *"
                mode="outlined"
                value={form.nome}
                onChangeText={atualizar("nome")}
                error={Boolean(erroNome)}
                returnKeyType="next"
                style={styles.input}
              />
              {erroNome ? (
                <HelperText type="error" visible>
                  {erroNome}
                </HelperText>
              ) : null}

              <TextInput
                label="Telefone / WhatsApp com DDD *"
                placeholder="(81) 99999-9999"
                mode="outlined"
                keyboardType="phone-pad"
                value={form.telefone}
                onChangeText={atualizar("telefone", mascaraTelefone)}
                error={Boolean(erroTelefone)}
                returnKeyType="next"
                style={styles.input}
              />
              {erroTelefone ? (
                <HelperText type="error" visible>
                  {erroTelefone}
                </HelperText>
              ) : null}

              <TextInput
                label="E-mail *"
                placeholder="motorista@exemplo.com"
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={atualizar("email")}
                error={Boolean(erroEmail)}
                returnKeyType="next"
                style={styles.input}
              />
              {erroEmail ? (
                <HelperText type="error" visible>
                  {erroEmail}
                </HelperText>
              ) : null}

              <TextInput
                label="Senha * (mínimo 6 caracteres)"
                mode="outlined"
                secureTextEntry={!showPassword}
                value={form.senha}
                onChangeText={atualizar("senha")}
                error={Boolean(erroSenha)}
                returnKeyType="done"
                onSubmitEditing={handleAvancarEtapa}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    accessibilityLabel="Mostrar ou ocultar senha"
                    onPress={() => setShowPassword((v) => !v)}
                  />
                }
                style={styles.input}
              />
              {erroSenha ? (
                <HelperText type="error" visible>
                  {erroSenha}
                </HelperText>
              ) : null}

              <Button
                mode="contained"
                icon="arrow-right"
                disabled={!etapa1Valida}
                onPress={handleAvancarEtapa}
                buttonColor={colors.primary}
                textColor={colors.text}
                contentStyle={styles.primaryBtnContent}
                style={styles.primaryBtn}
              >
                Continuar para dados da van
              </Button>

              <Button
                mode="text"
                onPress={() => router.back()}
                textColor={colors.secondary}
                contentStyle={styles.secondaryBtnContent}
              >
                Já tenho conta
              </Button>
            </View>
          ) : (
            <View style={styles.fieldsGroup}>
              <Text variant="titleLarge" style={styles.title}>
                Sua Van e Recebimento Pix
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Esses dados controlam a lotação da van e preenchem suas
                cobranças por WhatsApp.
              </Text>

              <TextInput
                label="Placa da van *"
                placeholder="Ex.: REC4E26 ou ABC1234"
                mode="outlined"
                autoCapitalize="characters"
                value={form.placaVeiculo}
                onChangeText={atualizar("placaVeiculo", mascaraPlaca)}
                error={Boolean(erroPlaca)}
                returnKeyType="next"
                style={styles.input}
              />
              {erroPlaca ? (
                <HelperText type="error" visible>
                  {erroPlaca}
                </HelperText>
              ) : null}

              <TextInput
                label="Capacidade da van (lugares) *"
                placeholder="15"
                mode="outlined"
                keyboardType="numeric"
                value={form.capacidadeVan}
                onChangeText={atualizar("capacidadeVan", apenasDigitos)}
                error={Boolean(erroCapacidade)}
                returnKeyType="next"
                style={styles.input}
              />
              {erroCapacidade ? (
                <HelperText type="error" visible>
                  {erroCapacidade}
                </HelperText>
              ) : null}

              <TextInput
                label="CNH (opcional)"
                mode="outlined"
                keyboardType="numeric"
                value={form.cnh}
                onChangeText={atualizar("cnh", apenasDigitos)}
                returnKeyType="next"
                style={styles.input}
              />

              <TextInput
                label="Chave Pix *"
                placeholder="Celular, CPF, e-mail ou chave aleatória"
                mode="outlined"
                value={form.chavePix}
                onChangeText={atualizar("chavePix")}
                error={Boolean(erroChavePix)}
                returnKeyType="next"
                style={styles.input}
              />
              {erroChavePix ? (
                <HelperText type="error" visible>
                  {erroChavePix}
                </HelperText>
              ) : null}

              <TextInput
                label="Nome do titular do Pix"
                mode="outlined"
                value={form.titularPix}
                onChangeText={atualizar("titularPix")}
                returnKeyType="done"
                onSubmitEditing={handleFinalizarCadastro}
                style={styles.input}
              />

              {signUp.isError ? (
                <HelperText type="error" visible>
                  {signUp.error?.friendlyMessage ||
                    "Não foi possível concluir o cadastro."}
                </HelperText>
              ) : null}

              <Button
                mode="contained"
                icon="check-circle-outline"
                loading={signUp.isPending}
                disabled={!etapa2Valida || signUp.isPending}
                onPress={handleFinalizarCadastro}
                buttonColor={colors.primary}
                textColor={colors.text}
                contentStyle={styles.primaryBtnContent}
                style={styles.primaryBtn}
              >
                Criar minha conta
              </Button>

              <Button
                mode="outlined"
                icon="arrow-left"
                disabled={signUp.isPending}
                onPress={() => setEtapa(1)}
                textColor={colors.secondary}
                contentStyle={styles.secondaryBtnContent}
                style={styles.backBtn}
              >
                Voltar para etapa anterior
              </Button>
            </View>
          )}
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  progressHeader: {
    gap: 8,
    marginBottom: 16,
  },
  stepIndicator: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceVariant,
  },
  fieldsGroup: {
    gap: 8,
  },
  title: {
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
  },
  primaryBtn: {
    marginTop: 12,
    borderRadius: 12,
  },
  primaryBtnContent: {
    height: 52,
  },
  secondaryBtnContent: {
    minHeight: 48,
  },
  backBtn: {
    borderRadius: 12,
    borderColor: colors.border,
  },
});
