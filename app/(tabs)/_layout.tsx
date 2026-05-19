import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { type ComponentProps } from "react";
import { useColorScheme } from "react-native";

function TabBarIcon(props: {
  name: ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colorScheme === "dark" ? "#7dd3fc" : "#0f766e",
        tabBarInactiveTintColor: colorScheme === "dark" ? "#94a3b8" : "#6b7280",
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#0f172a" : "#ffffff",
          borderTopColor: colorScheme === "dark" ? "#1e293b" : "#e5e7eb",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Connexion",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
