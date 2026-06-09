import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProtectedScreen } from "@/components/ProtectedScreen";
import { useSession } from "@/context/session-context";
import { getCurrentUser } from "@/lib/auth";
import type { UserProfile } from "@/lib/types";

export default function ProfileScreen() {
  return (
    <ProtectedScreen>
      <ProfileContent />
    </ProtectedScreen>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { user } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [status, setStatus] = useState("Profil issu de Supabase.");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const data = await getCurrentUser();
        if (active) {
          setProfile(data);
          setStatus("Profil synchronisé avec Supabase.");
        }
      } catch (error) {
        if (active && error instanceof Error) {
          setStatus(error.message);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Profil</Text>
      <Text style={styles.title}>Votre identité moniteur</Text>
      <Text style={styles.subtitle}>{status}</Text>

      <View style={styles.card}>
        <LabelValue label="Email" value={profile?.email ?? "Non disponible"} />
        <LabelValue
          label="Nom"
          value={
            [profile?.first_name, profile?.last_name]
              .filter(Boolean)
              .join(" ") || "Non renseigné"
          }
        />
        <LabelValue label="Admin" value={profile?.is_admin ? "Oui" : "Non"} />
      </View>

      <View style={styles.actionRow}>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Retour</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/home" as never)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Ouvrir la carte</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#07111f",
  },
  content: {
    padding: 18,
    gap: 14,
    paddingTop: 52,
  },
  kicker: {
    color: "#2dd4bf",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: "800",
  },
  title: {
    color: "#f8fafc",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 26,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },
  labelRow: {
    gap: 4,
  },
  label: {
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: "800",
  },
  value: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020817",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  secondaryButtonText: {
    color: "#f8fafc",
    fontWeight: "800",
  },
  primaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2dd4bf",
  },
  primaryButtonText: {
    color: "#05201d",
    fontWeight: "900",
  },
});
