import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import uiKit from "@/constants/Colors";
import { useSession } from "@/context/session-context";

export default function Index() {
  const { ready, token } = useSession();

  if (!ready) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={uiKit.actions.mapMarker} />
        <Text style={styles.loaderText}>Préparation de l’espace client…</Text>
      </View>
    );
  }

  return <Redirect href={(token ? "/home" : "/login") as never} />;
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
