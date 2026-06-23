import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProtectedScreen } from "@/components/ProtectedScreen";
import { uiKit } from "@/constants/Colors";
import { useParcours } from "@/context/parcours-context";
import { useSession } from "@/context/session-context";
import {
  fetchRoadRoute,
  formatDistance,
  haversineDistance,
  type LatLon,
} from "@/lib/routing";
import { samplePois } from "@/lib/sample-data";
import { createVadrouillePoi, fetchAllPois } from "@/lib/supabase-rest";
import type { Poi } from "@/lib/types";

const poiIcon = require("@/assets/images/transparent_poi_icon.png");

const defaultRegion = {
  latitude: 45.7579,
  longitude: 4.832,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

export default function HomeScreen() {
  return (
    <ProtectedScreen>
      <HomeContent />
    </ProtectedScreen>
  );
}

function formatTime(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const sign = totalSeconds < 0 ? "+" : "";
  return `${sign}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function HomeContent() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { signOut } = useSession();
  const {
    activeParcours,
    currentStepIndex,
    elapsedSeconds,
    nextStep,
    abandon,
  } = useParcours();

  const [menuOpen, setMenuOpen] = useState(false);
  const [exploreMode, setExploreMode] = useState(false);
  const insets = useSafeAreaInsets();
  const [currentPosition, setCurrentPosition] = useState(defaultRegion);
  const [poiList, setPoiList] = useState<Poi[]>(samplePois);
  const [apiState, setApiState] = useState("Connexion Supabase en cours…");
  const [isCreatingPoi, setIsCreatingPoi] = useState(false);
  const [poiAdded, setPoiAdded] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);

  // Parcours navigation state
  const [routeCoords, setRouteCoords] = useState<LatLon[]>([]);
  const [distanceToNext, setDistanceToNext] = useState<number | null>(null);
  const [nearTarget, setNearTarget] = useState(false);
  const [followUser, setFollowUser] = useState(false);
  // Ref mirrors followUser so the GPS callback always reads the latest value
  // without needing to re-subscribe (stale closure prevention).
  const followUserRef = useRef(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );
  const currentStepIndexRef = useRef(currentStepIndex);
  const activeParcourRef = useRef(activeParcours);
  const userLocationRef = useRef<LatLon | null>(null);
  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);
  useEffect(() => {
    activeParcourRef.current = activeParcours;
  }, [activeParcours]);
  useEffect(() => {
    followUserRef.current = followUser;
  }, [followUser]);

  // Exit vadrouille mode when a parcours starts
  useEffect(() => {
    if (activeParcours) setExploreMode(false);
  }, [activeParcours]);

  // Animate to current step's POI when step changes
  useEffect(() => {
    if (!activeParcours) return;
    const step = activeParcours.steps[currentStepIndex];
    if (!step) return;
    mapRef.current?.animateToRegion(
      {
        latitude: step.poi.latitude,
        longitude: step.poi.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      500,
    );
  }, [activeParcours, currentStepIndex]);

  // Start / stop GPS tracking when parcours mode changes
  useEffect(() => {
    if (!activeParcours) {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
      setDistanceToNext(null);
      setNearTarget(false);
      followUserRef.current = false;
      setFollowUser(false);
      setRouteCoords([]);
      return;
    }

    setFollowUser(true);

    void Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== "granted") return;
      void Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 8,
          timeInterval: 2000,
        },
        (loc) => {
          const pos: LatLon = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          userLocationRef.current = pos;

          // Auto-pan if follow mode is on (read ref, not stale state)
          if (followUserRef.current) {
            mapRef.current?.animateToRegion(
              { ...pos, latitudeDelta: 0.005, longitudeDelta: 0.005 },
              400,
            );
          }

          // Distance to current target POI
          const step =
            activeParcourRef.current?.steps[currentStepIndexRef.current];
          if (step) {
            const dist = haversineDistance(pos, {
              latitude: step.poi.latitude,
              longitude: step.poi.longitude,
            });
            setDistanceToNext(dist);
            setNearTarget(dist < 50);
          }
        },
      ).then((sub) => {
        locationSubscription.current = sub;
      });
    });

    return () => {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParcours]);

  // Re-fetch road route whenever parcours or step changes
  useEffect(() => {
    if (!activeParcours) {
      setRouteCoords([]);
      return;
    }

    const remaining = activeParcours.steps.slice(currentStepIndex);
    const poiWaypoints = remaining.map((s) => ({
      latitude: s.poi.latitude,
      longitude: s.poi.longitude,
    }));
    // Prepend GPS position only when we actually have one, to avoid duplicate
    // waypoints (OSRM returns 400 when two consecutive waypoints are identical).
    const waypoints: LatLon[] = userLocationRef.current
      ? [userLocationRef.current, ...poiWaypoints]
      : poiWaypoints;

    void fetchRoadRoute(waypoints).then(setRouteCoords);
  }, [activeParcours, currentStepIndex]);

  const remainingSeconds = activeParcours
    ? activeParcours.durationMinutes * 60 - elapsedSeconds
    : 0;
  const isOvertime = remainingSeconds < 0;

  useEffect(() => {
    void loadEnvironment();
  }, []);

  const positionLabel = useMemo(
    () =>
      `${currentPosition.latitude.toFixed(5)}, ${currentPosition.longitude.toFixed(5)}`,
    [currentPosition.latitude, currentPosition.longitude],
  );

  async function loadEnvironment() {
    await loadPois();
    await refocusOnCurrentLocation();
  }

  async function loadPois() {
    try {
      const pois = await fetchAllPois();
      if (Array.isArray(pois) && pois.length > 0) {
        setPoiList(pois);
        setApiState("L'outils des moniteurs d'auto-école.");
      }
    } catch (error) {
      setApiState(
        error instanceof Error ? error.message : "Supabase indisponible.",
      );
    }
  }

  async function refocusOnCurrentLocation() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      userLocationRef.current = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      const nextRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
      setCurrentPosition(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 550);
    } catch {}
  }

  async function enterVadrouilleMode() {
    setExploreMode(true);
    const latDelta = 0.004;
    const southOffset = latDelta * 0.31;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        userLocationRef.current = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        const tightRegion = {
          latitude: location.coords.latitude - southOffset,
          longitude: location.coords.longitude,
          latitudeDelta: latDelta,
          longitudeDelta: 0.004,
        };
        setCurrentPosition(tightRegion);
        mapRef.current?.animateToRegion(tightRegion, 600);
        return;
      }
    } catch {}
    const tightRegion = {
      latitude: currentPosition.latitude - southOffset,
      longitude: currentPosition.longitude,
      latitudeDelta: latDelta,
      longitudeDelta: 0.004,
    };
    setCurrentPosition(tightRegion);
    mapRef.current?.animateToRegion(tightRegion, 600);
  }

  async function handleCreatePoi() {
    setIsCreatingPoi(true);
    try {
      const createdPoi = await createVadrouillePoi({
        name: `POI vadrouille ${new Date().toISOString()}`,
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
      });
      setPoiList((prev) => [...prev, createdPoi]);
      setPoiAdded(true);
      setTimeout(() => setPoiAdded(false), 3000);
    } catch (error) {
      Alert.alert(
        "Création impossible",
        error instanceof Error ? error.message : "Impossible de créer le POI.",
      );
    } finally {
      setIsCreatingPoi(false);
    }
  }

  function handleNextStep() {
    if (!activeParcours) return;
    const isLast = currentStepIndex === activeParcours.steps.length - 1;
    if (isLast) {
      Alert.alert(
        "Parcours terminé !",
        `Bravo ! Vous avez complété "${activeParcours.name}" en ${formatTime(elapsedSeconds)}.`,
        [{ text: "Super !", onPress: abandon }],
      );
    } else {
      nextStep();
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace("/login" as never);
  }

  // Use OSRM road route when available, straight-line fallback while loading
  const parcoursPolyline =
    routeCoords.length >= 2
      ? routeCoords
      : (activeParcours?.steps.map((s) => ({
          latitude: s.poi.latitude,
          longitude: s.poi.longitude,
        })) ?? []);

  const inParcours = activeParcours !== null;
  const normalMode = !exploreMode && !inParcours;

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={currentPosition}
        region={currentPosition}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled
        pitchEnabled
        scrollEnabled={!exploreMode}
        zoomEnabled={!exploreMode}
        zoomControlEnabled={false}
        zoomTapEnabled={!exploreMode}
        scrollDuringRotateOrZoomEnabled={!exploreMode}
        onPress={() => setSelectedPoiId(null)}
        onPanDrag={() => {
          setSelectedPoiId(null);
          if (inParcours) {
            followUserRef.current = false;
            setFollowUser(false);
          }
        }}
      >
        {/* Parcours mode: numbered markers */}
        {inParcours
          ? activeParcours.steps.map((step, i) => {
              const isPast = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <Marker
                  key={step.poi.id}
                  coordinate={{
                    latitude: step.poi.latitude,
                    longitude: step.poi.longitude,
                  }}
                  title={step.poi.name}
                  description={step.instruction}
                >
                  <View
                    style={[
                      styles.stepMarker,
                      isCurrent && styles.stepMarkerCurrent,
                      isPast && styles.stepMarkerPast,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepMarkerNumber,
                        isCurrent && styles.stepMarkerNumberCurrent,
                      ]}
                    >
                      {i + 1}
                    </Text>
                  </View>
                </Marker>
              );
            })
          : poiList.map((poi) => {
              const isSelected = selectedPoiId === poi.id;
              return (
                <Marker
                  key={poi.id}
                  coordinate={{
                    latitude: poi.latitude,
                    longitude: poi.longitude,
                  }}
                  title={poi.name}
                  description={poi.status}
                  tracksViewChanges={isSelected}
                  onPress={() => {
                    setSelectedPoiId(poi.id);
                    mapRef.current?.animateToRegion(
                      {
                        latitude: poi.latitude,
                        longitude: poi.longitude,
                        latitudeDelta: 0.006,
                        longitudeDelta: 0.006,
                      },
                      500,
                    );
                  }}
                >
                  <Image
                    source={poiIcon}
                    style={isSelected ? styles.markerIconSelected : styles.markerIcon}
                    resizeMode="contain"
                  />
                </Marker>
              );
            })}

        {/* Route polyline */}
        {inParcours && parcoursPolyline.length > 1 && (
          <Polyline
            coordinates={parcoursPolyline}
            strokeColor={uiKit.palette.sky}
            strokeWidth={3}
            lineDashPattern={[8, 5]}
          />
        )}
      </MapView>

      {/* Top bar */}
      {!exploreMode && (
        <View style={[styles.topBar, { top: insets.top + 12 }]}>
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={styles.menuButton}
          >
            <Text style={styles.menuButtonLabel}>☰</Text>
          </Pressable>
          <View style={styles.topBarRight}>
            <Text style={styles.topTitle}>Parcours Moniteur</Text>
            <Text style={styles.topStatus}>
              {inParcours
                ? `Parcours actif · ${activeParcours.skill}`
                : apiState}
            </Text>
          </View>
        </View>
      )}

      {/* Normal mode bottom */}
      {normalMode && (
        <View style={[styles.bottomHintCard, { bottom: 88 + insets.bottom }]}>
          <Text style={styles.cardTitle}>Prêt pour la vadrouille</Text>
          <Text style={styles.cardLine}>
            Démarrez un parcours d'apprentissage ou posez un POI librement.
          </Text>
        </View>
      )}

      {normalMode && (
        <Pressable
          onPress={() => void refocusOnCurrentLocation()}
          style={({ pressed }) => [
            styles.refocusButton,
            { bottom: 18 + insets.bottom },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.refocusButtonLabel}>⊙ Recentrer</Text>
        </Pressable>
      )}

      {normalMode && (
        <Pressable
          onPress={() => void enterVadrouilleMode()}
          style={({ pressed }) => [
            styles.startVadrouille,
            { bottom: 18 + insets.bottom },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.startVadrouilleLabel}>Mode vadrouille</Text>
        </Pressable>
      )}

      {/* Vadrouille panel */}
      {exploreMode && (
        <View style={[styles.vadrouilleBottomSection, { paddingBottom: 32 + insets.bottom }]}>
          <Pressable
            onPress={() => setExploreMode(false)}
            style={({ pressed }) => [styles.exitBar, pressed && styles.pressed]}
          >
            <Text style={styles.exitBarIcon}>✕</Text>
            <Text style={styles.exitBarLabel}>Quitter le mode vadrouille</Text>
          </Pressable>

          <Text style={styles.positionLabel}>📍 {positionLabel}</Text>

          <Pressable
            onPress={() => void handleCreatePoi()}
            disabled={isCreatingPoi || poiAdded}
            style={({ pressed }) => [
              styles.bigAction,
              poiAdded && styles.bigActionDone,
              pressed && !isCreatingPoi && !poiAdded && styles.pressed,
              isCreatingPoi && styles.disabled,
            ]}
          >
            <Text
              style={[
                styles.bigActionPlus,
                poiAdded && styles.bigActionPlusDone,
              ]}
            >
              {poiAdded ? "✓" : "+"}
            </Text>
            <Text
              style={[
                styles.bigActionLabel,
                poiAdded && styles.bigActionLabelDone,
              ]}
            >
              {isCreatingPoi
                ? "Création en cours…"
                : poiAdded
                  ? "Point enregistré"
                  : "Ajouter un point d'intérêt"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Re-centre button (parcours mode) */}
      {inParcours && (
        <Pressable
          onPress={() => {
            followUserRef.current = true;
            setFollowUser(true);
            if (userLocationRef.current) {
              mapRef.current?.animateToRegion(
                {
                  ...userLocationRef.current,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                },
                400,
              );
            }
          }}
          style={({ pressed }) => [
            styles.recentreButton,
            followUser && styles.recentreButtonActive,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.recentreButtonLabel}>
            {followUser ? "⊙ Suivi actif" : "⊙ Recentrer"}
          </Text>
        </Pressable>
      )}

      {/* Parcours panel */}
      {inParcours &&
        (() => {
          const step = activeParcours.steps[currentStepIndex];
          const isLast = currentStepIndex === activeParcours.steps.length - 1;
          return (
            <View style={[styles.parcoursPanel, { paddingBottom: 32 + insets.bottom }]}>
              <View style={styles.parcoursHeaderRow}>
                <View style={styles.parcoursStepBadge}>
                  <Text style={styles.parcoursStepBadgeText}>
                    Étape {currentStepIndex + 1} / {activeParcours.steps.length}
                  </Text>
                </View>
                <View
                  style={[
                    styles.timerBadge,
                    isOvertime && styles.timerBadgeOvertime,
                  ]}
                >
                  <Text
                    style={[
                      styles.timerText,
                      isOvertime && styles.timerTextOvertime,
                    ]}
                  >
                    ⏱ {formatTime(remainingSeconds)}
                  </Text>
                </View>
              </View>

              <View style={styles.parcoursPoiRow}>
                <Text style={styles.parcoursPoiName}>{step.poi.name}</Text>
                {distanceToNext !== null && (
                  <View
                    style={[
                      styles.distanceBadge,
                      nearTarget && styles.distanceBadgeNear,
                    ]}
                  >
                    <Text
                      style={[
                        styles.distanceText,
                        nearTarget && styles.distanceTextNear,
                      ]}
                    >
                      {nearTarget
                        ? "📍 Vous y êtes !"
                        : `📍 ${formatDistance(distanceToNext)}`}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.parcoursInstruction}>{step.instruction}</Text>

              <View style={styles.parcoursActionRow}>
                <Pressable
                  onPress={abandon}
                  style={({ pressed }) => [
                    styles.abandonButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.abandonButtonLabel}>Abandonner</Text>
                </Pressable>
                <Pressable
                  onPress={handleNextStep}
                  style={({ pressed }) => [
                    styles.nextStepButton,
                    nearTarget && styles.nextStepButtonNear,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.nextStepButtonLabel}>
                    {isLast ? "Terminer ✓" : "J'y suis →"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })()}

      {/* Burger menu */}
      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setMenuOpen(false)}
        >
          <Pressable
            style={[styles.drawer, { paddingTop: insets.top + 18 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <Pressable
                onPress={() => setMenuOpen(false)}
                style={({ pressed }) => [
                  styles.drawerCloseIcon,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.drawerCloseIconText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.drawerDivider} />

            <MenuItem
              label="Parcours d'apprentissage"
              onPress={() => router.push("/parcours" as never)}
              onDone={() => setMenuOpen(false)}
            />
            <MenuItem
              label="Points d'intérêt"
              onPress={() => router.push("/poi-status" as never)}
              onDone={() => setMenuOpen(false)}
            />
            <MenuItem
              label="Favoris"
              onPress={() => router.push("/favorites" as never)}
              onDone={() => setMenuOpen(false)}
            />
            <MenuItem
              label="Profil"
              onPress={() => router.push("/profile" as never)}
              onDone={() => setMenuOpen(false)}
            />

            <View style={styles.drawerDivider} />

            <MenuItem
              label="Se déconnecter"
              danger
              onPress={handleLogout}
              onDone={() => setMenuOpen(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuItem({
  label,
  onPress,
  onDone,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  onDone?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        onDone?.();
        onPress();
      }}
      style={({ pressed }) => [
        styles.menuItem,
        danger && styles.menuItemDanger,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.menuItemLabel, danger && styles.menuItemLabelDanger]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: uiKit.palette.night,
  },

  // ── Markers ─────────────────────────────────────────────────────────────
  markerIcon: {
    width: 36,
    height: 36,
  },
  markerIconSelected: {
    width: 48,
    height: 48,
  },
  stepMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: uiKit.surfaces.cardStrong,
    borderWidth: 2,
    borderColor: uiKit.palette.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  stepMarkerCurrent: {
    backgroundColor: uiKit.palette.sky,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: uiKit.palette.white,
    borderWidth: 2,
  },
  stepMarkerPast: {
    opacity: 0.45,
    borderColor: uiKit.text.muted,
  },
  stepMarkerNumber: {
    color: uiKit.palette.sky,
    fontSize: 13,
    fontWeight: "900",
  },
  stepMarkerNumberCurrent: {
    color: uiKit.palette.night,
    fontSize: 15,
  },

  // ── Top bar ──────────────────────────────────────────────────────────────
  topBar: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: uiKit.surfaces.cardStrong,
    borderColor: uiKit.surfaces.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonLabel: {
    color: uiKit.palette.white,
    fontSize: 22,
    fontWeight: "700",
  },
  topBarRight: {
    flex: 1,
    backgroundColor: uiKit.surfaces.cardStrong,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topTitle: {
    color: uiKit.palette.white,
    fontSize: 15,
    fontWeight: "900",
  },
  topStatus: {
    color: uiKit.text.secondary,
    marginTop: 2,
    fontSize: 11,
  },

  // ── Normal bottom ────────────────────────────────────────────────────────
  bottomHintCard: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 15,
    borderRadius: 28,
    backgroundColor: uiKit.surfaces.cardStrong,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    color: uiKit.palette.white,
    fontSize: 22,
    fontWeight: "900",
  },
  cardLine: {
    color: uiKit.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  refocusButton: {
    position: "absolute",
    left: 18,
    zIndex: 22,
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiKit.surfaces.cardStrong,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
  },
  refocusButtonLabel: {
    color: uiKit.palette.white,
    fontSize: 14,
    fontWeight: "900",
  },
  startVadrouille: {
    position: "absolute",
    right: 18,
    zIndex: 22,
    minHeight: 50,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiKit.actions.secondary,
    borderWidth: 1,
    borderColor: "rgba(93, 217, 250, 0.4)",
  },
  startVadrouilleLabel: {
    color: uiKit.palette.white,
    fontSize: 14,
    fontWeight: "900",
  },

  // ── Vadrouille panel ─────────────────────────────────────────────────────
  vadrouilleBottomSection: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 14,
    backgroundColor: "rgba(9, 32, 67, 0.98)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: uiKit.surfaces.border,
    padding: 20,
    gap: 16,
  },
  exitBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  exitBarIcon: {
    color: uiKit.palette.sky,
    fontSize: 16,
    fontWeight: "900",
  },
  exitBarLabel: {
    color: uiKit.palette.sky,
    fontSize: 15,
    fontWeight: "800",
  },
  positionLabel: {
    color: uiKit.text.secondary,
    fontSize: 13,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  bigAction: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: uiKit.actions.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  bigActionPlus: {
    color: uiKit.palette.night,
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "900",
  },
  bigActionPlusDone: {
    fontSize: 44,
  },
  bigActionLabel: {
    color: uiKit.palette.night,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  bigActionDone: {
    backgroundColor: "rgba(9, 232, 92, 0.55)",
  },
  bigActionLabelDone: {},

  // ── Parcours panel ───────────────────────────────────────────────────────
  parcoursPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 14,
    backgroundColor: "rgba(9, 32, 67, 0.98)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: uiKit.surfaces.border,
    padding: 20,
    gap: 14,
  },
  parcoursHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  parcoursStepBadge: {
    backgroundColor: uiKit.surfaces.cardBackground,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  parcoursStepBadgeText: {
    color: uiKit.palette.sky,
    fontSize: 12,
    fontWeight: "800",
  },
  timerBadge: {
    backgroundColor: "rgba(93, 217, 250, 0.12)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(93, 217, 250, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  timerBadgeOvertime: {
    backgroundColor: "rgba(255, 195, 184, 0.12)",
    borderColor: "rgba(255, 195, 184, 0.35)",
  },
  timerText: {
    color: uiKit.palette.sky,
    fontSize: 14,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  timerTextOvertime: {
    color: uiKit.palette.blush,
  },
  parcoursPoiRow: {
    gap: 6,
  },
  parcoursPoiName: {
    color: uiKit.palette.white,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },
  distanceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(93, 217, 250, 0.1)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(93, 217, 250, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  distanceBadgeNear: {
    backgroundColor: "rgba(9, 232, 92, 0.15)",
    borderColor: "rgba(9, 232, 92, 0.4)",
  },
  distanceText: {
    color: uiKit.palette.sky,
    fontSize: 12,
    fontWeight: "700",
  },
  distanceTextNear: {
    color: uiKit.palette.mint,
  },
  parcoursInstruction: {
    color: uiKit.text.secondary,
    fontSize: 14,
    lineHeight: 21,
  },
  parcoursActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  abandonButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 195, 184, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 195, 184, 0.25)",
  },
  abandonButtonLabel: {
    color: uiKit.palette.blush,
    fontSize: 14,
    fontWeight: "800",
  },
  nextStepButton: {
    flex: 2,
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiKit.actions.secondary,
    borderWidth: 1,
    borderColor: "rgba(93, 217, 250, 0.4)",
  },
  nextStepButtonNear: {
    backgroundColor: uiKit.actions.primary,
    borderColor: "rgba(9, 232, 92, 0.5)",
  },
  nextStepButtonLabel: {
    color: uiKit.palette.white,
    fontSize: 16,
    fontWeight: "900",
  },
  recentreButton: {
    position: "absolute",
    top: "42%",
    right: 18,
    zIndex: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: uiKit.surfaces.cardStrong,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
  },
  recentreButtonActive: {
    borderColor: "rgba(9, 232, 92, 0.4)",
    backgroundColor: "rgba(9, 232, 92, 0.08)",
  },
  recentreButtonLabel: {
    color: uiKit.palette.white,
    fontSize: 13,
    fontWeight: "800",
  },

  // ── Shared ───────────────────────────────────────────────────────────────
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },

  // ── Burger menu ──────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: uiKit.surfaces.overlay,
    justifyContent: "flex-start",
  },
  drawer: {
    width: "100%",
    backgroundColor: "rgba(9, 32, 67, 0.99)",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: uiKit.surfaces.border,
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 8,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  drawerTitle: {
    color: uiKit.palette.white,
    fontSize: 24,
    fontWeight: "900",
  },
  drawerCloseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiKit.surfaces.cardBackground,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
  },
  drawerCloseIconText: {
    color: uiKit.palette.sky,
    fontSize: 18,
    fontWeight: "900",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: uiKit.surfaces.border,
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: uiKit.surfaces.cardBackground,
    borderWidth: 1,
    borderColor: uiKit.surfaces.border,
    paddingHorizontal: 20,
  },
  menuItemDanger: {
    backgroundColor: "rgba(255, 195, 184, 0.08)",
    borderColor: "rgba(255, 195, 184, 0.2)",
  },
  menuItemLabel: {
    color: uiKit.palette.white,
    fontSize: 16,
    fontWeight: "800",
  },
  menuItemLabelDanger: {
    color: uiKit.palette.blush,
  },
});
