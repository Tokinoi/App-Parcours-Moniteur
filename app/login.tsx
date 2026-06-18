import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { uiKit } from "@/constants/Colors";
import { useSession } from "@/context/session-context";

export default function LoginScreen() {
  const router = useRouter();
  const { ready, token, signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Connectez-vous pour accéder au parcours.",
  );

  useEffect(() => {
    if (ready && token) {
      router.replace("/home" as never);
    }
  }, [ready, router, token]);

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      setMessage("Renseignez votre email et votre mot de passe.");
      return;
    }

    setBusy(true);
    try {
      await signIn(normalizedEmail, password);
      router.replace("/home" as never);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Connexion impossible.",
      );
    } finally {
      setBusy(false);
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
        <View style={styles.glowA} />
        <View style={styles.glowB} />

        <View style={styles.hero}>
          <Text style={styles.badge}>Parcours Moniteur</Text>
          <Text style={styles.title}>Se connecter</Text>
          <Text style={styles.subtitle}>
            Retrouvez vos parcours, vos favoris et le mode vadrouille sur une
            seule vue.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Connexion</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={uiKit.text.muted}
            style={styles.input}
            value={email}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setPassword}
            placeholder="Mot de passe"
            placeholderTextColor={uiKit.text.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          <Pressable
            onPress={handleLogin}
            disabled={busy}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && !busy ? styles.pressed : null,
              busy ? styles.disabled : null,
            ]}
          >
            <Text style={styles.primaryButtonLabel}>
              {busy ? "Connexion…" : "Entrer dans l'app"}
            </Text>
          </Pressable>

          <Text style={styles.message}>{message}</Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <Link href={"/signup" as never} asChild>
            <Pressable>
              <Text style={styles.footerLink}>Créer une inscription</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: uiKit.palette.night,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    gap: 18,
  },
  glowA: {
    position: "absolute",
    top: -80,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: uiKit.gradients.glowA,
  },
  glowB: {
    position: "absolute",
    bottom: 90,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 160,
    backgroundColor: uiKit.gradients.glowB,
  },
  hero: {
    gap: 10,
  },
  badge: {
    color: uiKit.palette.sky,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    fontSize: 11,
    fontWeight: "800",
  },
  title: {
    color: uiKit.palette.white,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "900",
  },
  subtitle: {
    color: uiKit.text.secondary,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 340,
  },
  card: {
    backgroundColor: uiKit.surfaces.cardStrong,
    borderColor: uiKit.surfaces.border,
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 12,
  },
  cardLabel: {
    color: uiKit.palette.sun,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: "800",
  },
  input: {
    backgroundColor: uiKit.surfaces.inputBackground,
    color: uiKit.palette.white,
    borderColor: uiKit.surfaces.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: uiKit.actions.primary,
    borderRadius: 18,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonLabel: {
    color: uiKit.palette.night,
    fontSize: 16,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
  message: {
    color: uiKit.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  footerText: {
    color: uiKit.text.muted,
    fontSize: 14,
  },
  footerLink: {
    color: uiKit.palette.sun,
    fontSize: 14,
    fontWeight: "800",
  },
});
