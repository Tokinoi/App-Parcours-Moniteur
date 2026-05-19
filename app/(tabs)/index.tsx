import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { healthCheck } from "@/lib/api";
import {
  clearSession,
  getCurrentToken,
  requestCode,
  verifyCode,
} from "@/lib/auth";
import { appConfig } from "@/lib/config";

function maskToken(token: string | null) {
  if (!token) {
    return "No session stored";
  }

  if (token.length <= 12) {
    return token;
  }

  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

export default function HomeScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState("Ready to connect to the API.");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    void refreshStoredToken();
  }, []);

  const tokenLabel = useMemo(() => maskToken(token), [token]);

  async function refreshStoredToken() {
    const storedToken = await getCurrentToken();
    setToken(storedToken);
  }

  async function handleRequestCode() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setMessage("Enter an email address first.");
      return;
    }

    setBusyAction("request");
    try {
      await requestCode(normalizedEmail);
      setMessage(`Verification code requested for ${normalizedEmail}.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to request a verification code.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleVerifyCode() {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!normalizedEmail || !trimmedCode) {
      setMessage("Enter both the email address and verification code.");
      return;
    }

    setBusyAction("verify");
    try {
      await verifyCode(normalizedEmail, trimmedCode);
      await refreshStoredToken();
      setMessage("Session stored securely on the device.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to verify the code.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleHealthCheck() {
    setBusyAction("health");
    try {
      const health = await healthCheck();
      setMessage(`Health check OK: ${JSON.stringify(health)}`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to reach the API health endpoint.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleLogout() {
    setBusyAction("logout");
    try {
      await clearSession();
      setToken(null);
      setMessage("Session cleared from secure storage.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to clear the session.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>Expo managed app</Text>
          <Text style={styles.title}>Parcours Moniteur</Text>
          <Text style={styles.subtitle}>
            Connected to the backend contract exposed by the S01 branch.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Configuration</Text>
          <Text style={styles.cardValue}>
            API origin: {appConfig.apiOrigin}
          </Text>
          <Text style={styles.cardValue}>
            Environment: {appConfig.environment}
          </Text>
          <Text style={styles.cardValue}>Secure token: {tokenLabel}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Auth flow</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={email}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setCode}
            placeholder="Verification code"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={code}
          />

          <View style={styles.actions}>
            <ActionButton
              label={busyAction === "request" ? "Sending…" : "Request code"}
              onPress={handleRequestCode}
              variant="secondary"
              disabled={busyAction !== null}
            />
            <ActionButton
              label={busyAction === "verify" ? "Verifying…" : "Verify code"}
              onPress={handleVerifyCode}
              disabled={busyAction !== null}
            />
          </View>

          <View style={styles.actionsSingle}>
            <ActionButton
              label={busyAction === "health" ? "Checking…" : "Check API health"}
              onPress={handleHealthCheck}
              variant="ghost"
              disabled={busyAction !== null}
            />
            <ActionButton
              label={busyAction === "logout" ? "Clearing…" : "Clear session"}
              onPress={handleLogout}
              variant="danger"
              disabled={busyAction !== null}
            />
          </View>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusText}>{message}</Text>
          {busyAction ? (
            <ActivityIndicator color="#7dd3fc" style={styles.spinner} />
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

function ActionButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
}: ActionButtonProps) {
  const variantStyle =
    variant === "secondary"
      ? styles.button_secondary
      : variant === "ghost"
        ? styles.button_ghost
        : variant === "danger"
          ? styles.button_danger
          : styles.button_primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        pressed && !disabled ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          variant === "ghost" ? styles.buttonLabelGhost : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#07111f",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  hero: {
    paddingVertical: 12,
    gap: 6,
  },
  kicker: {
    color: "#7dd3fc",
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: "#f8fafc",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#0f172a",
    borderColor: "#1e293b",
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  cardLabel: {
    color: "#7dd3fc",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 12,
    fontWeight: "700",
  },
  cardValue: {
    color: "#e2e8f0",
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#020617",
    color: "#f8fafc",
    borderColor: "#243244",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionsSingle: {
    gap: 12,
    marginTop: 4,
  },
  button: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  button_primary: {
    backgroundColor: "#14b8a6",
  },
  button_secondary: {
    backgroundColor: "#0f172a",
    borderColor: "#334155",
    borderWidth: 1,
  },
  button_ghost: {
    backgroundColor: "#172036",
  },
  button_danger: {
    backgroundColor: "#7f1d1d",
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonLabelGhost: {
    color: "#cbd5e1",
  },
  statusCard: {
    backgroundColor: "#111827",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  statusLabel: {
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 12,
    fontWeight: "700",
  },
  statusText: {
    color: "#f8fafc",
    fontSize: 14,
    lineHeight: 21,
  },
  spinner: {
    alignSelf: "flex-start",
    marginTop: 6,
  },
});
