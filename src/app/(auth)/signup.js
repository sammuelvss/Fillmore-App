import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  SegmentedButtons,
  Banner,
  HelperText,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { signUpRequest } from "../../api/authApi";
import { useAppStore } from "../../store/useAppStore";

/**
 * ============================================================================
 * TELA DE SIGN UP / CADASTRO (Esqueleto Guiado para SAMUEL — 2º a atuar)
 * ============================================================================
 * Endpoint consumido: `POST /users`
 * Campos suportados pelo Back-end (`userService.createUser`):
 * - Comuns: `nome`, `username`, `email`, `senha`, `tipo` ("MOTORISTA" | "RESPONSAVEL"), `telefone`
 * - Exclusivos de MOTORISTA: `cnh`, `placaVeiculo`, `capacidadeVan`, `chavePix`, `titularPix`
 */
export default function SignUpScreen() {
  const router = useRouter();
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  const [tipo, setTipo] = useState("MOTORISTA");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");

  // Campos dinâmicos do Motorista
  const [cnh, setCnh] = useState("");
  const [placaVeiculo, setPlacaVeiculo] = useState("");
  const [capacidadeVan, setCapacidadeVan] = useState("15");
  const [chavePix, setChavePix] = useState("");
  const [titularPix, setTitularPix] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignUp = async () => {
    setErrorMsg("");
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setErrorMsg("Nome, e-mail e senha são obrigatórios.");
      return;
    }

    try {
      setLoading(true);
      await signUpRequest({
        nome: nome.trim(),
        username: nome.trim(),
        email: email.trim(),
        senha: senha.trim(),
        tipo,
        telefone: telefone.trim() || undefined,
        ...(tipo === "MOTORISTA" && {
          cnh: cnh.trim() || undefined,
          placaVeiculo: placaVeiculo.trim() || undefined,
          capacidadeVan: Number(capacidadeVan) || 15,
          chavePix: chavePix.trim() || undefined,
          titularPix: titularPix.trim() || nome.trim(),
        }),
      });

      showSnackbar(
        "Conta criada com sucesso! Faça login para continuar.",
        "success",
      );
      router.back();
    } catch (error) {
      setErrorMsg(
        error.friendlyMessage || "Não foi possível concluir o cadastro.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Banner
        visible
        icon="account-wrench"
        style={styles.banner}
      >
        [Módulo do Integrante 2 — Samuel]: Estrutura base conectada ao endpoint
        POST /users com transação atômica de Perfil (Motorista / Responsável).
      </Banner>

      <Surface style={styles.card} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          1. Escolha o seu Perfil no Fillmore
        </Text>
        <SegmentedButtons
          value={tipo}
          onValueChange={setTipo}
          buttons={[
            {
              value: "MOTORISTA",
              label: "Motorista Escolar",
              icon: "bus-school",
            },
            {
              value: "RESPONSAVEL",
              label: "Mãe / Pai / Resp.",
              icon: "account-child-circle",
            },
          ]}
          style={styles.segmented}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          2. Dados de Acesso
        </Text>
        <TextInput
          label="Nome Completo *"
          mode="outlined"
          value={nome}
          onChangeText={setNome}
          style={styles.input}
        />
        <TextInput
          label="E-mail *"
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          label="Senha *"
          mode="outlined"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
          style={styles.input}
        />
        <TextInput
          label="Telefone / WhatsApp (Ex.: 81999990001)"
          mode="outlined"
          keyboardType="phone-pad"
          value={telefone}
          onChangeText={setTelefone}
          style={styles.input}
        />

        {tipo === "MOTORISTA" && (
          <View style={styles.motoristaSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              3. Dados da Van Escolar e Recebimento Pix
            </Text>
            <TextInput
              label="CNH do Motorista"
              mode="outlined"
              value={cnh}
              onChangeText={setCnh}
              style={styles.input}
            />
            <View style={styles.row}>
              <TextInput
                label="Placa da Van"
                mode="outlined"
                value={placaVeiculo}
                onChangeText={setPlacaVeiculo}
                placeholder="PEA-1234"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Lotação Máx."
                mode="outlined"
                keyboardType="numeric"
                value={capacidadeVan}
                onChangeText={setCapacidadeVan}
                style={[styles.input, styles.halfInput]}
              />
            </View>
            <TextInput
              label="Chave Pix (para cobrança de mensalidades)"
              mode="outlined"
              value={chavePix}
              onChangeText={setChavePix}
              style={styles.input}
            />
            <TextInput
              label="Nome do Titular Pix"
              mode="outlined"
              value={titularPix}
              onChangeText={setTitularPix}
              style={styles.input}
            />
          </View>
        )}

        {errorMsg ? (
          <HelperText type="error" visible>
            {errorMsg}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          icon="check-circle-outline"
          loading={loading}
          disabled={loading}
          onPress={handleSignUp}
          buttonColor={colors.primary}
          textColor={colors.secondary}
          style={styles.submitBtn}
        >
          Finalizar Cadastro
        </Button>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 36,
  },
  banner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
  },
  sectionTitle: {
    fontWeight: "700",
    color: colors.secondary,
    marginBottom: 10,
    marginTop: 6,
  },
  segmented: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  motoristaSection: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  submitBtn: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 4,
  },
});
