import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProtectedScreen } from "@/components/ProtectedScreen";
import { uiKit } from "@/constants/Colors";
import { useSession } from "@/context/session-context";
import {
  addFavorite,
  fetchAllPois,
  fetchFavoriteIds,
  removeFavorite,
} from "@/lib/supabase-rest";
import type { Poi } from "@/lib/types";

export default function PoiStatusScreen() {
  return (
    <ProtectedScreen>
      <PoiStatusContent />
    </ProtectedScreen>
  );
}

function PoiStatusContent() {
  const router = useRouter();
  const { user } = useSession();
  const [pois, setPois] = useState<Poi[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await fetchAllPois();
        if (active && Array.isArray(data)) {
          setPois(data);
          if (data.length === 0) {
            setErrorMessage("Aucun POI actif disponible pour le moment.");
          }
        }
      } catch (error) {
        if (active)
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les POIs.",
          );
      }
      if (user?.id) {
        try {
          const ids = await fetchFavoriteIds(user.id);
          if (active) setFavoriteIds(ids);
        } catch {}
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [user?.id]);

  async function toggleFavorite(poiId: string) {
    if (!user?.id) return;
    const isFav = favoriteIds.has(poiId);
    const next = new Set(favoriteIds);
    if (isFav) {
      next.delete(poiId);
      setFavoriteIds(next);
      try {
        await removeFavorite(user.id, poiId);
      } catch {
        next.add(poiId);
        setFavoriteIds(new Set(next));
      }
    } else {
      next.add(poiId);
      setFavoriteIds(next);
      try {
        await addFavorite(user.id, poiId);
      } catch {
        next.delete(poiId);
        setFavoriteIds(new Set(next));
      }
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

      <Text style={styles.kicker}>POI status</Text>
      <Text style={styles.title}>État des points d'intérêt</Text>
      {errorMessage && <Text style={styles.subtitle}>{errorMessage}</Text>}

      <View style={styles.list}>
        {pois.map((poi) => {
          const isFav = favoriteIds.has(poi.id);
          return (
            <View key={poi.id} style={styles.card}>
              <View style={styles.cardTopRow}>
                <Text style={styles.category}>{poi.category}</Text>
                <Pressable
                  onPress={() => void toggleFavorite(poi.id)}
                  style={({ pressed }) => [
                    styles.favButton,
                    isFav && styles.favButtonActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[styles.favHeart, isFav && styles.favHeartActive]}
                  >
                    {isFav ? "♥" : "♡"}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.name}>{poi.name}</Text>
              <Text style={styles.description}>{poi.description}</Text>
              <Text style={styles.status}>{poi.status}</Text>
            </View>
          );
        })}
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
    color: uiKit.palette.sky,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: "800",
  },
  favButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiKit.surfaces.cardBackground,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
  },
  favButtonActive: {
    backgroundColor: "rgba(255, 80, 80, 0.12)",
    borderColor: "rgba(255, 80, 80, 0.35)",
  },
  favHeart: {
    fontSize: 18,
    color: uiKit.text.muted,
  },
  favHeartActive: {
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
  status: {
    color: uiKit.palette.sun,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
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
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
