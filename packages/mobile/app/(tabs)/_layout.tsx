import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "../../components/music-ui";
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: "#a1adba",
        tabBarLabelStyle: { fontSize: 10, lineHeight: 14, height: 16, marginTop: 0 },
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: C.border,
          paddingTop: 9,
          paddingBottom: Math.max(insets.bottom, 10),
          height: 74 + insets.bottom,
        },
      }}
    >
      {[
        ["index", "Início", "home-outline"],
        ["explore", "Explorar", "compass-outline"],
        ["library", "Biblioteca", "albums-outline"],
        ["premium", "Premium", "sparkles-outline"],
      ].map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name!}
          options={{
            title,
            tabBarIcon: ({ color }) => (
              <Ionicons name={icon as "home-outline"} size={21} color={color} />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="artist" options={{ href: null }} />
    </Tabs>
  );
}
