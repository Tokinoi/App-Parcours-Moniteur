import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProtectedScreen } from "@/components/ProtectedScreen";
import { uiKit } from "@/constants/Colors";
import { useSession } from "@/context/session-context";
import { getCurrentUser } from "@/lib/auth";
import { fetchFavoritePois, removeFavorite } from "@/lib/supabase-rest";
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
  const [favorites, setFavorites] = useState<Poi[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFavorites() {
      try {
        const profile = user ?? (await getCurrentUser());
        const data = await fetchFavoritePois({ userId: profile.id });
        if (active && Array.isArray(data)) {
          setFavorites(data);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
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

  async function handleRemove(poiId: string) {
    const userId = user?.id;
    if (!userId) return;
    setFavorites((prev) => prev.filter((p) => p.id !== poiId));
    try {
      await removeFavorite(userId, poiId);
    } catch {
      const data = await fetchFavoritePois({ userId });
      setFavorites(data);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}
      >
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backLabel}>Retour à la carte</Text>
      </Pressable>

      <Text style={styles.kicker}>Favoris</Text>
      <Text style={styles.title}>Mes POIs favoris</Text>
      {errorMessage && <Text style={styles.subtitle}>{errorMessage}</Text>}

      {favorites.length === 0 && !errorMessage && (
        <Text style={styles.subtitle}>
          Aucun favori pour le moment. Ajoutez-en depuis la page Points d'intérêt.
        </Text>
      )}

      <View style={styles.list}>
        {favorites.map((poi) => (
          <View key={poi.id} style={styles.card}>
            <View style={styles.cardTopRow}>
              <Text style={styles.category}>{poi.category}</Text>
              <Pressable
                onPress={() => void handleRemove(poi.id)}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.removeHeart}>♥</Text>
              </Pressable>
            </View>
            <Text style={styles.name}>{poi.name}</Text>
            <Text style={styles.description}>{poi.description}</Text>
          </View>
        ))}
      </View>
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
    color: uiKit.palette.mint,
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
  subtitle: {
    color: uiKit.text.secondary,
    fontSize: 14,
    lineHeight: 21,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: uiKit.surfaces.cardStrong,
    borderRadius: 24,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    color: uiKit.palette.sun,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: "800",
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 80, 80, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 80, 80, 0.35)",
  },
  removeHeart: {
    fontSize: 18,
    color: "#ff5050",
  },
  name: {
    color: uiKit.palette.white,
    fontSize: 17,
    fontWeight: "900",
  },
  description: {
    color: uiKit.text.secondary,
    fontSize: 13,
    lineHeight: 19,
  },

  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
