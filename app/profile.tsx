import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ProtectedScreen } from "@/components/ProtectedScreen";
import { uiKit } from "@/constants/Colors";
import { useSession } from "@/context/session-context";
import { getCurrentUser, updateProfile } from "@/lib/auth";
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
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const data = await getCurrentUser();
        if (active) {
          setProfile(data);
          setFirstName(data.first_name ?? "");
          setLastName(data.last_name ?? "");
        }
      } catch {}
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  function handleCancel() {
    setFirstName(profile?.first_name ?? "");
    setLastName(profile?.last_name ?? "");
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setProfile(updated);
      setEditing(false);
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error ? error.message : "Mise à jour impossible.",
      );
    } finally {
      setSaving(false);
    }
  }

  const hasChanges =
    firstName.trim() !== (profile?.first_name ?? "") ||
    lastName.trim() !== (profile?.last_name ?? "");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}
      >
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backLabel}>Retour à la carte</Text>
      </Pressable>

      <Text style={styles.kicker}>Profil</Text>
      <Text style={styles.title}>Votre identité moniteur</Text>

      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{profile?.email ?? "Non disponible"}</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Prénom</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Prénom"
              placeholderTextColor={uiKit.text.muted}
              autoCapitalize="words"
            />
          ) : (
            <Text style={styles.value}>{profile?.first_name || "Non renseigné"}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nom</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Nom"
              placeholderTextColor={uiKit.text.muted}
              autoCapitalize="words"
            />
          ) : (
            <Text style={styles.value}>{profile?.last_name || "Non renseigné"}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Admin</Text>
          <Text style={styles.value}>{profile?.is_admin ? "Oui" : "Non"}</Text>
        </View>
      </View>

      {editing ? (
        <View style={styles.actionRow}>
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Annuler</Text>
          </Pressable>
          <Pressable
            onPress={() => void handleSave()}
            disabled={saving || !hasChanges}
            style={({ pressed }) => [
              styles.primaryButton,
              (saving || !hasChanges) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setEditing(true)}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        >
          <Text style={styles.editButtonText}>Modifier le profil</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: uiKit.palette.night,
  },
  content: {
    padding: 18,
    gap: 14,
    paddingTop: 52,
    paddingBottom: 48,
  },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  backArrow: {
    color: uiKit.palette.sky,
    fontSize: 18,
    fontWeight: "900",
  },
  backLabel: {
    color: uiKit.palette.sky,
    fontSize: 14,
    fontWeight: "700",
  },

  kicker: {
    color: uiKit.palette.sky,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: "800",
  },
  title: {
    color: uiKit.palette.white,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
  },

  card: {
    backgroundColor: uiKit.surfaces.cardStrong,
    borderRadius: 26,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
  },
  fieldGroup: {
    gap: 4,
  },
  label: {
    color: uiKit.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: "800",
  },
  value: {
    color: uiKit.palette.white,
    fontSize: 15,
    fontWeight: "800",
  },
  input: {
    color: uiKit.palette.white,
    fontSize: 15,
    fontWeight: "800",
    backgroundColor: uiKit.surfaces.cardBackground,
    borderWidth: 1,
    borderColor: uiKit.palette.sky,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    backgroundColor: uiKit.surfaces.cardBackground,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
  },
  secondaryButtonText: {
    color: uiKit.palette.white,
    fontWeight: "800",
  },
  primaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiKit.actions.primary,
  },
  primaryButtonText: {
    color: uiKit.palette.night,
    fontWeight: "900",
  },
  editButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiKit.actions.secondary,
    borderWidth: 1,
    borderColor: "rgba(93, 217, 250, 0.4)",
  },
  editButtonText: {
    color: uiKit.palette.white,
    fontSize: 15,
    fontWeight: "900",
  },

  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
