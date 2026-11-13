import React, { useState } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  HelperText,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/useAuthStore";
import { useAppStore } from "../../store/useAppStore";
import { useLoginMutation } from "../../hooks/useAuth";
import { getSessionRequest } from "../../api/authApi";
import { API_BASE_URL } from "../../api/client";

// Login (POST /session) + Quick Token para evitar o rate limit de 5 logins/15 min
export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const [showDev, setShowDev] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [loadingQuick, setLoadingQuick] = useState(false);

  const handleLogin = () => {
    if (!email.trim() || !senha.trim()) {
      setLocalError("Informe e-mail e senha.");
      return;
    }
    setLocalError("");
    loginMutation.mutate({ email: email.trim(), senha: senha.trim() });
  };

  // Valida um token JWT real em GET /session (não consome o rate limit de POST /session)
  const handleQuickToken = async () => {
    const tokenLimpo = manualToken.trim().replace(/^Bearer\s+/i, "");
    if (!tokenLimpo) {
      showSnackbar("Cole um token JWT válido de POST /session.", "info");
      return;
    }

    setLoadingQuick(true);
    try {
      const sessionUser = await getSessionRequest(tokenLimpo);
      setAuth(sessionUser, tokenLimpo);
      showSnackbar(`Sessão restaurada para ${sessionUser?.nome || "usuário"}!`, "success");
    } catch (e) {
      showSnackbar(e.friendlyMessage || "Token inválido ou expirado.", "error");
    } finally {
      setLoadingQuick(false);
    }
  };

  const errorMsg =
    localError || (loginMutation.isError && loginMutation.error?.friendlyMessage);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="bus-school" size={44} color={colors.secondary} />
          </View>
          <Text variant="headlineMedium" style={styles.brand}>FILLMORE</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Transporte Escolar • Recife/PE
          </Text>
        </View>

        <Surface style={styles.card} elevation={2}>
          <Text variant="titleLarge" style={styles.title}>Entrar</Text>

          <TextInput
            label="E-mail"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            label="Senha"
            mode="outlined"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />

          {errorMsg ? <HelperText type="error" visible>{errorMsg}</HelperText> : null}

          <Button
            mode="contained"
            icon="login"
            onPress={handleLogin}
            loading={loginMutation.isPending}
            disabled={loginMutation.isPending}
            buttonColor={colors.primary}
            textColor={colors.secondary}
            style={styles.button}
          >
            Entrar
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.push("/(auth)/signup")}
            textColor={colors.secondary}
            style={styles.button}
          >
            Criar conta
          </Button>
        </Surface>

        <Surface style={styles.devCard} elevation={1}>
          <View style={styles.devHeader}>
            <Text variant="titleSmall" style={styles.devTitle}>Modo Dev / Quick Token</Text>
            <Button compact onPress={() => setShowDev(!showDev)}>
              {showDev ? "Ocultar" : "Expandir"}
            </Button>
          </View>
          <Text variant="bodySmall">API: {API_BASE_URL}</Text>

          {showDev && (
            <View style={styles.devBody}>
              <TextInput
                label="Token JWT real (Bearer)"
                mode="outlined"
                dense
                value={manualToken}
                onChangeText={setManualToken}
                autoCapitalize="none"
                style={styles.input}
              />
              <Button
                mode="contained"
                loading={loadingQuick}
                disabled={loadingQuick}
                onPress={handleQuickToken}
                buttonColor={colors.secondary}
              >
                Acessar com Token
              </Button>
            </View>
          )}
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  scroll: { flexGrow: 1, padding: 20, justifyContent: "center" },
  hero: { alignItems: "center", marginBottom: 22 },
  logo: {
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brand: { color: "#FFFFFF", fontWeight: "900", letterSpacing: 1.5 },
  subtitle: { color: "#CBD5E1", marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 22, marginBottom: 16 },
  title: { fontWeight: "800", color: colors.secondary, marginBottom: 12 },
  input: { marginBottom: 12, backgroundColor: colors.surface },
  button: { marginTop: 8, borderRadius: 12 },
  devCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  devHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  devTitle: { fontWeight: "700", color: "#92400E" },
  devBody: { marginTop: 12 },
});
