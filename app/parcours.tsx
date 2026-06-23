import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, Pressable, View } from "react-native";

import { ProtectedScreen } from "@/components/ProtectedScreen";
import { uiKit } from "@/constants/Colors";
import { useParcours } from "@/context/parcours-context";
import { sampleParcours } from "@/lib/sample-data";
import type { Parcours } from "@/lib/types";

export default function ParcoursScreen() {
  return (
    <ProtectedScreen>
      <ParcoursContent />
    </ProtectedScreen>
  );
}

const SKILL_COLORS: Record<string, string> = {
  "Ronds-points": uiKit.palette.sky,
  "Priorités à droite": uiKit.palette.sun,
  "Conduite urbaine": uiKit.palette.mint,
};

function skillColor(skill: string) {
  return SKILL_COLORS[skill] ?? uiKit.palette.sky;
}

function ParcoursContent() {
  const router = useRouter();
  const { startParcours } = useParcours();

  function handleStart(parcours: Parcours) {
    startParcours(parcours);
    router.back();
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

      <Text style={styles.kicker}>Apprentissage</Text>
      <Text style={styles.title}>Choisir un parcours</Text>
      <Text style={styles.subtitle}>
        Chaque parcours simule un itinéraire de 30 minutes autour d'une
        compétence de conduite spécifique.
      </Text>

      <View style={styles.list}>
        {sampleParcours.map((parcours) => (
          <ParcoursCard
            key={parcours.id}
            parcours={parcours}
            onStart={handleStart}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function ParcoursCard({
  parcours,
  onStart,
}: {
  parcours: Parcours;
  onStart: (p: Parcours) => void;
}) {
  const color = skillColor(parcours.skill);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.skillBadge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
          <Text style={[styles.skillBadgeText, { color }]}>{parcours.skill}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>⏱ {parcours.durationMinutes} min</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaItem}>{parcours.steps.length} étapes</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{parcours.name}</Text>
      <Text style={styles.cardDescription}>{parcours.description}</Text>

      {/* Steps preview */}
      <View style={styles.stepsPreview}>
        {parcours.steps.map((step, i) => (
          <View key={step.poi.id} style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: color }]}>
              <Text style={styles.stepDotNumber}>{i + 1}</Text>
            </View>
            <Text style={styles.stepName} numberOfLines={1}>
              {step.poi.name}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => onStart(parcours)}
        style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
      >
        <Text style={styles.startButtonLabel}>Démarrer ce parcours →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: uiKit.palette.night,
  },
  content: {
    padding: 18,
    paddingTop: 52,
    gap: 16,
    paddingBottom: 48,
  },

  // Back row
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

  // Header
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
    marginBottom: 4,
  },
  subtitle: {
    color: uiKit.text.secondary,
    fontSize: 14,
    lineHeight: 21,
  },

  // List
  list: { gap: 16 },

  // Card
  card: {
    backgroundColor: uiKit.surfaces.cardStrong,
    borderRadius: 28,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  skillBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaItem: {
    color: uiKit.text.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  metaDot: {
    color: uiKit.text.muted,
    fontSize: 12,
  },
  cardTitle: {
    color: uiKit.palette.white,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
  },
  cardDescription: {
    color: uiKit.text.secondary,
    fontSize: 13,
    lineHeight: 19,
  },

  // Steps preview
  stepsPreview: {
    gap: 8,
    paddingLeft: 2,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotNumber: {
    color: uiKit.palette.night,
    fontSize: 11,
    fontWeight: "900",
  },
  stepName: {
    color: uiKit.text.secondary,
    fontSize: 13,
    flex: 1,
  },

  // Start button
  startButton: {
    backgroundColor: uiKit.actions.secondary,
    borderRadius: 18,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  startButtonLabel: {
    color: uiKit.palette.white,
    fontSize: 15,
    fontWeight: "900",
  },

  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
