import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";

import uiKit from "@/constants/Colors";
import { useSession } from "@/context/session-context";

export function ProtectedScreen({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, token } = useSession();

  useEffect(() => {
    if (ready && !token) {
      router.replace("/login" as never);
    }
  }, [ready, router, token]);

  if (!ready) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={uiKit.actions.mapMarker} />
        <Text style={styles.loaderText}>Chargement de votre session…</Text>
      </View>
    );
  }

  if (!token) {
    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiKit.surfaces.appBackground,
    gap: 12,
  },
  loaderText: {
    color: uiKit.text.secondary,
    fontSize: 14,
  },
});
