import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProtectedScreen } from "@/components/ProtectedScreen";
import { useSession } from "@/context/session-context";
import { getCurrentUser } from "@/lib/auth";
import { samplePois } from "@/lib/sample-data";
import { fetchFavoritePois } from "@/lib/supabase-rest";
import type { Poi } from "@/lib/types";

export default function FavoritesScreen() {
  return (
    <ProtectedScreen>
      <FavoritesContent />
    </ProtectedScreen>
  );
}

function FavoritesContent() {
  const router = useRouter();
  const { user } = useSession();
  const [favorites, setFavorites] = useState<Poi[]>(samplePois.slice(0, 2));
  const [message, setMessage] = useState(
    "Vos POIs favoris sont regroupés ici.",
  );

  useEffect(() => {
    let active = true;

    async function loadFavorites() {
      try {
        const profile = user ?? (await getCurrentUser());
        const data = await fetchFavoritePois({ userId: profile.id });
        if (active && Array.isArray(data)) {
          setFavorites(data);
          setMessage("Favoris synchronisés avec Supabase.");
        }
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les favoris.",
          );
        }
      }
    }

    void loadFavorites();

    return () => {
      active = false;
    };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Favoris</Text>
      <Text style={styles.title}>Mes POIs favoris</Text>
      <Text style={styles.subtitle}>{message}</Text>

      <View style={styles.list}>
        {favorites.map((poi) => (
          <View key={poi.id} style={styles.card}>
            <Text style={styles.category}>{poi.category}</Text>
            <Text style={styles.name}>{poi.name}</Text>
            <Text style={styles.description}>{poi.description}</Text>
          </View>
        ))}
      </View>

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Retour</Text>
      </Pressable>
    </ScrollView>
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
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },
  category: {
    color: "#f59e0b",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: "800",
  },
  name: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
  },
  description: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 19,
  },
  backButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f59e0b",
  },
  backButtonText: {
    color: "#111827",
    fontWeight: "900",
  },
});
