import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProtectedScreen } from "@/components/ProtectedScreen";
import { samplePois } from "@/lib/sample-data";
import { fetchActivePois } from "@/lib/supabase-rest";
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
  const [pois, setPois] = useState<Poi[]>(samplePois);
  const [message, setMessage] = useState("États des points d’intérêt.");

  useEffect(() => {
    let active = true;

    async function loadPois() {
      try {
        const data = await fetchActivePois();
        if (active && Array.isArray(data)) {
          setPois(data);
          setMessage("Données reçues depuis Supabase.");
        }
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les POIs.",
          );
        }
      }
    }

    void loadPois();

    return () => {
      active = false;
    };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>POI status</Text>
      <Text style={styles.title}>État des points d’intérêt</Text>
      <Text style={styles.subtitle}>{message}</Text>

      <View style={styles.list}>
        {pois.map((poi) => (
          <View key={poi.id} style={styles.card}>
            <Text style={styles.category}>{poi.category}</Text>
            <Text style={styles.name}>{poi.name}</Text>
            <Text style={styles.description}>{poi.description}</Text>
            <Text style={styles.status}>{poi.status}</Text>
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
    color: "#f59e0b",
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
    color: "#2dd4bf",
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
  status: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  backButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2dd4bf",
  },
  backButtonText: {
    color: "#05201d",
    fontWeight: "900",
  },
});
