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
  HelperText,
  SegmentedButtons,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/useAuthStore";
import { useAppStore } from "../../store/useAppStore";
import { loginRequest } from "../../api/authApi";
import { API_BASE_URL } from "../../api/client";

/**
 * ============================================================================
 * TELA DE LOGIN + QUICK TOKEN DEV (Kick-off Sammuel -> Expansão Samuel)
 * ============================================================================
 * A URL da API é lida exclusivamente do arquivo `.env` (`EXPO_PUBLIC_API_URL`).
 *
 * Funcionalidades presentes:
 * 1. Autenticação real no Back-end (`POST /session`) persistindo o JWT no AsyncStorage.
 * 2. Quick Token Login (Modo Dev): permite colar um token JWT já obtido no Postman
 *    (evitando gastar as 5 requisições / 15 min do `authLimiterMiddleware`) ou entrar
 *    em modo de inspeção das telas enquanto o Samuel finaliza a integração do `.env`.
 */
export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const showSnackbar = useAppStore((state) => state.showSnackbar);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Estados do Quick Token Dev (para não estourar o Rate Limit de 5 req / 15 min)
  const [showDevTools, setShowDevTools] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [manualTipo, setManualTipo] = useState("MOTORISTA");

  const handleLogin = async () => {
    setErrorMsg("");
    if (!email.trim() || !senha.trim()) {
      setErrorMsg("Informe seu e-mail e sua senha para entrar.");
      return;
    }

    try {
      setLoading(true);
      const data = await loginRequest({
        email: email.trim(),
        senha: senha.trim(),
      });
      setAuth(data.user, data.token);
      showSnackbar(
        `Bem-vindo(a), ${data.user?.nome || "Motorista"}!`,
        "success",
      );
      router.replace("/(tabs)");
    } catch (error) {
      setErrorMsg(
        error.friendlyMessage ||
          "Falha ao autenticar. Verifique suas credenciais e o arquivo .env.",
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Permite injetar um token JWT já gerado no Postman (poupando o limite de 5 logins/15m)
   * ou testar o fluxo visual do app imediatamente.
   */
  const handleQuickTokenInject = () => {
    const tokenFinal = manualToken.trim() || "dev-preview-jwt-token";
    const mockUser = {
      id: "00000000-0000-4000-8000-000000000001",
      nome:
        manualTipo === "MOTORISTA"
          ? "Motorista (Modo Dev)"
          : "Responsável (Modo Dev)",
      email: "dev@fillmore.app",
      tipo: manualTipo,
      telefone: "",
      motorista:
        manualTipo === "MOTORISTA"
          ? {
              id: "00000000-0000-4000-8000-000000000002",
              placaVeiculo: "VAN-0000",
              capacidadeVan: 15,
              chavePix: "",
              titularPix: "",
            }
          : null,
      responsavel:
        manualTipo === "RESPONSAVEL"
          ? {
              id: "00000000-0000-4000-8000-000000000003",
            }
          : null,
    };

    setAuth(mockUser, tokenFinal);
    showSnackbar(
      manualToken.trim()
        ? "Token JWT injetado no Zustand com sucesso!"
        : "Modo Dev Preview ativado!",
      "info",
    );
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner Superior Institucional */}
        <View style={styles.heroHeader}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons
              name="bus-school"
              size={44}
              color={colors.secondary}
            />
          </View>
          <Text variant="headlineMedium" style={styles.brandTitle}>
            FILLMORE
          </Text>
          <Text variant="bodyMedium" style={styles.brandSubtitle}>
            Gestão de Transporte Escolar Informal • Recife/PE
          </Text>
        </View>

        {/* Card de Login Principal */}
        <Surface style={styles.formCard} elevation={2}>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Acessar Plataforma
          </Text>
          <Text variant="bodySmall" style={styles.cardCaption}>
            Autenticação integrada ao Express 5 + NeonDB (JWT persistido)
          </Text>

          <TextInput
            label="E-mail"
            placeholder="Ex.: motorista@fillmore.com"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email-outline" />}
            style={styles.input}
          />

          <TextInput
            label="Senha"
            placeholder="Digite sua senha"
            mode="outlined"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />

          {errorMsg ? (
            <HelperText type="error" visible style={styles.errorBox}>
              {errorMsg}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            icon="login"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.primaryBtn}
            contentStyle={styles.primaryBtnContent}
            buttonColor={colors.primary}
            textColor={colors.secondary}
          >
            Entrar na Conta
          </Button>

          <Button
            mode="outlined"
            icon="account-plus-outline"
            onPress={() => router.push("/(auth)/signup")}
            disabled={loading}
            style={styles.secondaryBtn}
            textColor={colors.secondary}
          >
            Criar Nova Conta (Motorista / Responsável)
          </Button>
        </Surface>

        {/* Painel Quick Token Login (protege contra Rate Limit 429 de 5 req / 15 min) */}
        <Surface style={styles.devCard} elevation={1}>
          <View style={styles.devHeader}>
            <View style={styles.devTitleRow}>
              <MaterialCommunityIcons
                name="shield-key-outline"
                size={20}
                color={colors.primaryDark}
              />
              <Text variant="titleSmall" style={styles.devTitle}>
                Modo Dev / Quick Token Login
              </Text>
            </View>
            <Button
              mode="text"
              compact
              onPress={() => setShowDevTools(!showDevTools)}
              textColor={colors.primaryDark}
            >
              {showDevTools ? "Ocultar" : "Expandir"}
            </Button>
          </View>

          <Text variant="bodySmall" style={styles.devHint}>
            API (.env): <Text style={styles.boldText}>{API_BASE_URL}</Text>
          </Text>

          {showDevTools && (
            <View style={styles.devExpanded}>
              <Text variant="labelMedium" style={styles.devSectionTitle}>
                Injetar Token JWT do Postman (Evita Rate Limit 5 req/15m):
              </Text>
              <SegmentedButtons
                value={manualTipo}
                onValueChange={setManualTipo}
                buttons={[
                  { value: "MOTORISTA", label: "Motorista", icon: "bus-school" },
                  {
                    value: "RESPONSAVEL",
                    label: "Responsável",
                    icon: "account-supervisor",
                  },
                ]}
                style={styles.segmented}
                density="small"
              />
              <TextInput
                label="Token JWT (Opcional — deixe vazio p/ Preview UI)"
                mode="outlined"
                value={manualToken}
                onChangeText={setManualToken}
                autoCapitalize="none"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                style={styles.input}
                dense
              />
              <Button
                mode="contained"
                icon="key-chain"
                onPress={handleQuickTokenInject}
                buttonColor={colors.secondary}
                textColor="#FFFFFF"
                style={styles.devActionBtn}
              >
                Acessar com Token / Modo Dev
              </Button>
            </View>
          )}
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  heroHeader: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 22,
  },
  logoBadge: {
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandTitle: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    color: "#CBD5E1",
    textAlign: "center",
    marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: "800",
    color: colors.secondary,
  },
  cardCaption: {
    color: colors.textSecondary,
    marginBottom: 16,
    marginTop: 2,
  },
  input: {
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  errorBox: {
    marginBottom: 8,
    fontWeight: "600",
  },
  primaryBtn: {
    marginTop: 4,
    borderRadius: 12,
  },
  primaryBtnContent: {
    paddingVertical: 6,
  },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 12,
    borderColor: colors.border,
  },
  devCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 24,
  },
  devHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  devTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  devTitle: {
    fontWeight: "700",
    color: "#92400E",
    flex: 1,
  },
  devHint: {
    color: "#78350F",
    marginTop: 2,
  },
  boldText: {
    fontWeight: "700",
  },
  devExpanded: {
    marginTop: 12,
  },
  devSectionTitle: {
    color: "#78350F",
    fontWeight: "700",
    marginBottom: 8,
  },
  segmented: {
    marginBottom: 10,
  },
  devActionBtn: {
    borderRadius: 10,
  },
});
