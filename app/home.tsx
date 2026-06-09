import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProtectedScreen } from "@/components/ProtectedScreen";
import { useSession } from "@/context/session-context";
import { samplePois } from "@/lib/sample-data";
import { createVadrouillePoi, fetchActivePois } from "@/lib/supabase-rest";
import type { Poi } from "@/lib/types";

const defaultRegion = {
  latitude: 48.8566,
  longitude: 2.3522,
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

function HomeContent() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { user, signOut } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exploreMode, setExploreMode] = useState(false);
  const insets = useSafeAreaInsets();
  const [currentPosition, setCurrentPosition] = useState(defaultRegion);
  const [poiList, setPoiList] = useState<Poi[]>(samplePois);
  const [apiState, setApiState] = useState("Connexion Supabase en cours…");
  const [isCreatingPoi, setIsCreatingPoi] = useState(false);

  useEffect(() => {
    void loadEnvironment();
  }, []);

  const userId = user?.id ?? "Inconnu";
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
      const pois = await fetchActivePois();

      if (Array.isArray(pois)) {
        setPoiList(pois);
        setApiState("Supabase prête et accessible.");
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

      if (permission.status !== "granted") {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };

      setCurrentPosition(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 550);
    } catch {
      // Keep existing map region if location fetch fails.
    }
  }

  function enterVadrouilleMode() {
    setExploreMode(true);

    const focusedRegion = {
      latitude: currentPosition.latitude,
      longitude: currentPosition.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };

    setCurrentPosition(focusedRegion);
    mapRef.current?.animateToRegion(focusedRegion, 450);
  }

  async function handleCreatePoi() {
    setIsCreatingPoi(true);

    try {
      const createdPoi = await createVadrouillePoi({
        name: `POI vadrouille ${new Date().toISOString()}`,
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
      });

      // Show the new marker on the map immediately, then exit vadrouille mode
      setPoiList((prev) => [...prev, createdPoi]);
      setExploreMode(false);

      Alert.alert(
        "Point ajouté",
        "Visible sur la carte. Il sera examiné par le backoffice avant d’être public.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de créer le POI.";

      Alert.alert("Création impossible", message);
    } finally {
      setIsCreatingPoi(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace("/login" as never);
  }

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={currentPosition}
        region={currentPosition}
        showsUserLocation={!exploreMode}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={!exploreMode}
        scrollEnabled={!exploreMode}
        zoomEnabled={!exploreMode}
        zoomControlEnabled={false}
        zoomTapEnabled={!exploreMode}
        scrollDuringRotateOrZoomEnabled={!exploreMode}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {poiList.map((poi) => (
          <Marker
            key={poi.id}
            coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
            title={poi.name}
            description={poi.description}
          />
        ))}
      </MapView>

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
            <Text style={styles.topStatus}>{apiState}</Text>
          </View>
        </View>
      )}

      {!exploreMode ? (
        <View style={styles.bottomHintCard}>
          <Text style={styles.cardTitle}>Prêt pour la vadrouille</Text>
          <Text style={styles.cardLine}>
            Appuie sur le bouton bleu pour démarrer et poser un POI.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.vadrouilleBottomSection}>
            <Text style={styles.vadrouilleLine}>Position: {positionLabel}</Text>
            <Text style={styles.vadrouilleLine}>User ID: {userId}</Text>
            <Pressable
              onPress={() => void handleCreatePoi()}
              disabled={isCreatingPoi}
              style={({ pressed }) => [
                styles.bigAction,
                pressed && !isCreatingPoi ? styles.pressed : null,
                isCreatingPoi ? styles.disabled : null,
              ]}
            >
              <Text style={styles.bigActionPlus}>+</Text>
              <Text style={styles.bigActionLabel}>
                {isCreatingPoi
                  ? "Création en cours..."
                  : "Ajouter un point d’intérêt"}
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => setExploreMode(false)}
            style={styles.exitCross}
            android_ripple={{ color: "rgba(255,255,255,0.06)" }}
          >
            <Text style={styles.exitCrossLabel}>✕</Text>
          </Pressable>
        </>
      )}

      {!exploreMode && (
        <Pressable
          onPress={() => void refocusOnCurrentLocation()}
          style={({ pressed }) => [
            styles.refocusButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.refocusButtonLabel}>Recentrer</Text>
        </Pressable>
      )}

      {!exploreMode && (
        <Pressable
          onPress={enterVadrouilleMode}
          style={({ pressed }) => [
            styles.startVadrouille,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.startVadrouilleLabel}>
            Démarrer mode vadrouille
          </Text>
        </Pressable>
      )}

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
          <View style={[styles.drawer, { paddingTop: insets.top + 14 }]}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <Pressable
                onPress={() => setMenuOpen(false)}
                style={styles.drawerCloseIcon}
              >
                <Text style={styles.drawerCloseIconText}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.drawerSubtitle}>{apiState}</Text>
            <MenuItem
              label="Profil"
              onPress={() => router.push("/profile" as never)}
              onDone={() => setMenuOpen(false)}
            />
            <MenuItem
              label="POI status"
              onPress={() => router.push("/poi-status" as never)}
              onDone={() => setMenuOpen(false)}
            />
            <MenuItem
              label="Favoris"
              onPress={() => router.push("/favorites" as never)}
              onDone={() => setMenuOpen(false)}
            />
            <MenuItem
              label="Se déconnecter"
              danger
              onPress={handleLogout}
              onDone={() => setMenuOpen(false)}
            />
          </View>
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
        pressed ? styles.pressed : null,
      ]}
    >
      <Text
        style={[
          styles.menuItemLabel,
          danger ? styles.menuItemLabelDanger : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#07111f",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderColor: "rgba(148, 163, 184, 0.15)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonLabel: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "700",
  },
  topBarRight: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  topTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "900",
  },
  topStatus: {
    color: "#cbd5e1",
    marginTop: 2,
    fontSize: 12,
  },
  bottomHintCard: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 88,
    zIndex: 15,
    borderRadius: 28,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    padding: 20,
    gap: 8,
  },
  vadrouilleBottomSection: {
    position: "absolute",
    top: "43%",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 14,
    backgroundColor: "rgba(2, 8, 23, 0.96)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  cardLine: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 20,
  },
  vadrouilleLine: {
    color: "#e2e8f0",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",
  },
  bigAction: {
    width: "70%",
    minHeight: 128,
    borderRadius: 26,
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignSelf: "center",
  },
  bigActionPlus: {
    color: "#60a5fa",
    fontSize: 36,
    lineHeight: 38,
    fontWeight: "900",
    marginBottom: 4,
  },
  bigActionLabel: {
    color: "#60a5fa",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  refocusButton: {
    position: "absolute",
    left: 18,
    bottom: 18,
    zIndex: 22,
    minHeight: 46,
    minWidth: 112,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 17, 31, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(248, 250, 252, 0.12)",
  },
  refocusButtonLabel: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
  },
  startVadrouille: {
    position: "absolute",
    right: 18,
    bottom: 18,
    zIndex: 22,
    minHeight: 46,
    minWidth: 182,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.55)",
  },
  startVadrouilleLabel: {
    color: "#eff6ff",
    fontSize: 14,
    fontWeight: "900",
  },
  exitCross: {
    position: "absolute",
    top: "31%",
    left: "50%",
    transform: [{ translateX: -26 }],
    zIndex: 25,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.55)",
  },
  exitCrossLabel: {
    color: "#60a5fa",
    fontSize: 22,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 8, 23, 0.66)",
    paddingHorizontal: 18,
    paddingBottom: 18,
    justifyContent: "flex-start",
  },
  drawer: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
    padding: 18,
    gap: 10,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  drawerTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  drawerSubtitle: {
    color: "#cbd5e1",
    fontSize: 12,
    marginBottom: 8,
  },
  drawerCloseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.5)",
  },
  drawerCloseIconText: {
    color: "#60a5fa",
    fontSize: 20,
    fontWeight: "900",
  },
  menuItem: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(2, 8, 23, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.08)",
  },
  menuItemLabel: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  menuItemLabelDanger: {
    color: "#fca5a5",
  },
});
