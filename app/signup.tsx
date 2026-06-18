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

export default function SignupScreen() {
  const router = useRouter();
  const { ready, token, signUp } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Créez votre accès moniteur en quelques secondes.",
  );

  useEffect(() => {
    if (ready && token) {
      router.replace("/home" as never);
    }
  }, [ready, router, token]);

  async function handleSignup() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      setMessage("L'email et le mot de passe sont obligatoires.");
      return;
    }

    setBusy(true);
    try {
      await signUp({
        email: normalizedEmail,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });

      setMessage("Compte créé. Vous pouvez maintenant vous connecter.");
      router.replace("/login" as never);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Inscription impossible.",
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
          <Text style={styles.badge}>Inscription</Text>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>
            Un profil simple pour retrouver vos parcours, vos POIs et vos
            favoris sur le terrain.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <TextInput
              autoCapitalize="words"
              onChangeText={setFirstName}
              placeholder="Prénom"
              placeholderTextColor={uiKit.text.muted}
              style={[styles.input, styles.halfInput]}
              value={firstName}
            />
            <TextInput
              autoCapitalize="words"
              onChangeText={setLastName}
              placeholder="Nom"
              placeholderTextColor={uiKit.text.muted}
              style={[styles.input, styles.halfInput]}
              value={lastName}
            />
          </View>

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
            onPress={handleSignup}
            disabled={busy}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && !busy ? styles.pressed : null,
              busy ? styles.disabled : null,
            ]}
          >
            <Text style={styles.primaryButtonLabel}>
              {busy ? "Création…" : "Créer le compte"}
            </Text>
          </Pressable>

          <Text style={styles.message}>{message}</Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Déjà inscrit ?</Text>
          <Link href={"/login" as never} asChild>
            <Pressable>
              <Text style={styles.footerLink}>Retour à la connexion</Text>
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
    top: -90,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: uiKit.gradients.glowA,
  },
  glowB: {
    position: "absolute",
    bottom: 110,
    right: -70,
    width: 170,
    height: 170,
    borderRadius: 170,
    backgroundColor: uiKit.gradients.glowB,
  },
  hero: {
    gap: 10,
  },
  badge: {
    color: uiKit.palette.mint,
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
    maxWidth: 350,
  },
  card: {
    backgroundColor: uiKit.surfaces.cardStrong,
    borderColor: uiKit.surfaces.border,
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
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
