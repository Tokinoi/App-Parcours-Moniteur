import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ProtectedScreen } from "@/components/ProtectedScreen";
import { uiKit } from "@/constants/Colors";
import { useParcours } from "@/context/parcours-context";
import { fetchActivePois } from "@/lib/supabase-rest";
import {
  buildPersonalizedSession,
  buildSharedTrainings,
  getTrainingDurations,
  getTrainingFocusOptions,
} from "@/lib/training-engine";
import type { Parcours, Poi, TrainingFocus } from "@/lib/types";

const DEFAULT_ORIGIN = {
  latitude: 45.7579,
  longitude: 4.832,
};

type TrainingMode = "session" | "shared";

export default function ParcoursScreen() {
  return (
    <ProtectedScreen>
      <ParcoursContent />
    </ProtectedScreen>
  );
}

const FOCUS_COLORS: Record<TrainingFocus, string> = {
  Giratoires: uiKit.palette.sky,
  "Priorités à droite": uiKit.palette.sun,
  "Conduite urbaine": uiKit.palette.mint,
  "Carrefours à feux": uiKit.palette.sky,
  Stationnement: uiKit.palette.mint,
  Mixte: uiKit.palette.white,
};

function focusColor(focus: TrainingFocus) {
  return FOCUS_COLORS[focus] ?? uiKit.palette.sky;
}

function ParcoursContent() {
  const router = useRouter();
  const { startParcours } = useParcours();
  const focusOptions = useMemo(() => getTrainingFocusOptions(), []);
  const durationOptions = useMemo(() => getTrainingDurations(), []);

  const [pois, setPois] = useState<Poi[]>([]);
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [locationLabel, setLocationLabel] = useState("Localisation par défaut");
  const [mode, setMode] = useState<TrainingMode>("session");
  const [selectedFocus, setSelectedFocus] =
    useState<TrainingFocus>("Giratoires");
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;
    let permissionGranted = false;

    async function loadPois() {
      const poisData = await fetchActivePois();

      if (!active) {
        return poisData;
      }

      setPois(poisData);
      setErrorMessage(
        poisData.length > 0 ? null : "Aucun POI actif trouvé dans Supabase.",
      );

      return poisData;
    }

    async function loadLocation() {
      if (!permissionGranted) {
        setLocationLabel("Autour de Lyon par défaut");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!active) {
        return;
      }

      const nextOrigin = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setOrigin(nextOrigin);
      setLocationLabel(
        `Autour de ${nextOrigin.latitude.toFixed(4)}, ${nextOrigin.longitude.toFixed(4)}`,
      );
    }

    async function loadData() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        permissionGranted = permission.status === "granted";

        if (!active) {
          return;
        }

        await loadPois();
        await loadLocation();

        if (permissionGranted) {
          locationSubscription.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 15,
              timeInterval: 10000,
            },
            (location) => {
              if (!active) {
                return;
              }

              const nextOrigin = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              };
              setOrigin(nextOrigin);
              setLocationLabel(
                `Autour de ${nextOrigin.latitude.toFixed(4)}, ${nextOrigin.longitude.toFixed(4)}`,
              );
            },
          );
        }

        refreshTimerRef.current = setInterval(() => {
          void loadPois().catch((error) => {
            if (!active) {
              return;
            }
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Impossible de rafraîchir les POIs actifs.",
            );
          });
        }, 15_000);
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les POIs actifs.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
      locationSubscription.current?.remove();
      locationSubscription.current = null;
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, []);

  const personalizedSession = useMemo(
    () =>
      buildPersonalizedSession({
        pois,
        origin,
        focus: selectedFocus,
        durationMinutes: selectedDuration,
      }),
    [origin, pois, selectedDuration, selectedFocus],
  );

  const sharedTrainings = useMemo(
    () => buildSharedTrainings({ pois, origin }),
    [origin, pois],
  );

  function handleStart(parcours: Parcours) {
    startParcours(parcours);
    router.back();
  }

  async function handleShare(parcours: Parcours) {
    try {
      await Share.share({
        title: parcours.name,
        message: `${parcours.name}\n${parcours.description}\nDurée: ${parcours.durationMinutes} min\nExercices: ${parcours.exerciseTypes?.join(", ") ?? parcours.skill}`,
      });
    } catch (error) {
      Alert.alert(
        "Partage impossible",
        error instanceof Error
          ? error.message
          : "Impossible de partager ce parcours.",
      );
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

      <Text style={styles.kicker}>Parcours terrain</Text>
      <Text style={styles.title}>
        Session personnalisée ou parcours partageable
      </Text>
      <Text style={styles.subtitle}>
        Le moteur compose des parcours à partir des POIs actifs de Supabase, de
        votre position actuelle et du type d'exercice recherché.
      </Text>

      <View style={styles.segmentedControl}>
        <SegmentButton
          label="Session personnalisée"
          active={mode === "session"}
          onPress={() => setMode("session")}
        />
        <SegmentButton
          label="Parcours partageables"
          active={mode === "shared"}
          onPress={() => setMode("shared")}
        />
      </View>

      <View style={styles.locationCard}>
        <Text style={styles.locationKicker}>Localisation actuelle</Text>
        <Text style={styles.locationValue}>{locationLabel}</Text>
        <Text style={styles.locationHint}>
          Les suggestions sont triées selon la distance à votre position et la
          cohérence avec le type d'exercice.
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={uiKit.palette.sky} />
          <Text style={styles.loadingText}>Chargement des POIs actifs…</Text>
        </View>
      )}

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      {mode === "session" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Créer une session personnelle</Text>

          <View style={styles.pillGroup}>
            {durationOptions.map((duration) => (
              <FilterChip
                key={duration}
                label={`${duration} min`}
                active={selectedDuration === duration}
                onPress={() => setSelectedDuration(duration)}
              />
            ))}
          </View>

          <View style={styles.pillGroup}>
            {focusOptions.map((focus) => (
              <FilterChip
                key={focus}
                label={focus}
                active={selectedFocus === focus}
                onPress={() => setSelectedFocus(focus)}
                accentColor={focusColor(focus)}
              />
            ))}
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Aperçu généré</Text>
            {personalizedSession ? (
              <TrainingCard
                parcours={personalizedSession}
                onStart={handleStart}
                onShare={handleShare}
                showShare
              />
            ) : (
              <Text style={styles.emptyText}>
                Aucun parcours n'a pu être généré avec les POIs disponibles.
                Pour un focus giratoires, il faut au moins trois POIs actifs qui
                mentionnent un rond-point, un giratoire ou une bretelle.
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parcours partageables</Text>
          <Text style={styles.sectionSubtitle}>
            Triés par durée, type d'exercices puis proximité à votre position
            actuelle.
          </Text>

          <View style={styles.list}>
            {sharedTrainings.map((parcours) => (
              <TrainingCard
                key={parcours.id}
                parcours={parcours}
                onStart={handleStart}
                onShare={handleShare}
                showShare
              />
            ))}

            {sharedTrainings.length === 0 && !loading && (
              <Text style={styles.emptyText}>
                Aucun parcours partageable n'a pu être composé à partir des POIs
                actifs.
              </Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        active && styles.segmentButtonActive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.segmentButtonLabel,
          active && styles.segmentButtonLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  accentColor,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accentColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        accentColor ? { borderColor: accentColor } : null,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function TrainingCard({
  parcours,
  onStart,
  onShare,
  showShare = false,
}: {
  parcours: Parcours;
  onStart: (p: Parcours) => void;
  onShare: (p: Parcours) => void;
  showShare?: boolean;
}) {
  const color = focusColor(parcours.skill as TrainingFocus);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.skillBadge,
            { backgroundColor: `${color}22`, borderColor: `${color}55` },
          ]}
        >
          <Text style={[styles.skillBadgeText, { color }]}>
            {parcours.skill}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>⏱ {parcours.durationMinutes} min</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaItem}>{parcours.steps.length} étapes</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{parcours.name}</Text>
      <Text style={styles.cardDescription}>{parcours.description}</Text>

      <View style={styles.badgeRow}>
        {(parcours.exerciseTypes ?? []).map((exerciseType) => (
          <View key={exerciseType} style={styles.exerciseBadge}>
            <Text style={styles.exerciseBadgeLabel}>{exerciseType}</Text>
          </View>
        ))}
      </View>

      <View style={styles.metaLine}>
        <Text style={styles.metaLineLabel}>Départ</Text>
        <Text style={styles.metaLineValue}>
          {parcours.originLabel ?? "Localisation courante"}
        </Text>
      </View>

      <View style={styles.stepsPreview}>
        {parcours.steps.map((step, index) => (
          <View key={step.poi.id} style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: color }]}>
              <Text style={styles.stepDotNumber}>{index + 1}</Text>
            </View>
            <Text style={styles.stepName} numberOfLines={1}>
              {step.poi.name}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => onStart(parcours)}
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.startButtonLabel}>Démarrer</Text>
        </Pressable>

        {showShare && parcours.shareable && (
          <Pressable
            onPress={() => onShare(parcours)}
            style={({ pressed }) => [
              styles.shareButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.shareButtonLabel}>Partager</Text>
          </Pressable>
        )}
      </View>
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
  segmentedControl: {
    flexDirection: "row",
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
    backgroundColor: uiKit.surfaces.cardStrong,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: uiKit.palette.sky,
    borderColor: uiKit.palette.sky,
  },
  segmentButtonLabel: {
    color: uiKit.text.secondary,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  segmentButtonLabelActive: {
    color: uiKit.palette.night,
  },
  locationCard: {
    backgroundColor: uiKit.surfaces.cardStrong,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
    gap: 6,
  },
  locationKicker: {
    color: uiKit.palette.sky,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: "800",
  },
  locationValue: {
    color: uiKit.palette.white,
    fontSize: 16,
    fontWeight: "900",
  },
  locationHint: {
    color: uiKit.text.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
  loadingCard: {
    backgroundColor: uiKit.surfaces.cardStrong,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: uiKit.text.secondary,
    fontSize: 13,
  },
  errorText: {
    color: uiKit.palette.sun,
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: uiKit.palette.white,
    fontSize: 20,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: uiKit.text.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
  pillGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
    backgroundColor: uiKit.surfaces.cardStrong,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: uiKit.palette.sky,
    borderColor: uiKit.palette.sky,
  },
  filterChipLabel: {
    color: uiKit.text.secondary,
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipLabelActive: {
    color: uiKit.palette.night,
  },
  previewCard: {
    gap: 12,
  },
  previewLabel: {
    color: uiKit.palette.mint,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: "800",
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: uiKit.surfaces.cardStrong,
    borderRadius: 28,
    padding: 18,
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
    fontSize: 14,
    lineHeight: 21,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  exerciseBadge: {
    borderRadius: 999,
    backgroundColor: uiKit.surfaces.cardBackground,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  exerciseBadgeLabel: {
    color: uiKit.text.secondary,
    fontSize: 11,
    fontWeight: "700",
  },
  metaLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  metaLineLabel: {
    color: uiKit.palette.mint,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metaLineValue: {
    color: uiKit.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  stepsPreview: {
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotNumber: {
    color: uiKit.palette.white,
    fontSize: 12,
    fontWeight: "900",
  },
  stepName: {
    color: uiKit.palette.white,
    fontSize: 13,
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  startButton: {
    flex: 1,
    backgroundColor: uiKit.palette.sky,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  startButtonLabel: {
    color: uiKit.palette.night,
    fontSize: 13,
    fontWeight: "900",
  },
  shareButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
    backgroundColor: uiKit.surfaces.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  shareButtonLabel: {
    color: uiKit.palette.white,
    fontSize: 13,
    fontWeight: "800",
  },
  emptyText: {
    color: uiKit.text.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
