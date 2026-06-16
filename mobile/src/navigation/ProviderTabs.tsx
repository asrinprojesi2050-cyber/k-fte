import { colors } from "../theme";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MessagesStack from "./MessagesStack";
import ProviderHomeStack from "./ProviderHomeStack";
import ProviderJobsStack from "./ProviderJobsStack";
import ProviderProfileStack from "./ProviderProfileStack";
import { ProviderTabParamList } from "./types";

const Tab = createBottomTabNavigator<ProviderTabParamList>();

export default function ProviderTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 6 + insets.bottom,
          paddingTop: 6,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          switch (route.name) {
            case "ProviderHomeStack":
              iconName = "search-outline";
              break;
            case "MessagesStack":
              iconName = "chatbubble-outline";
              break;
            case "ProviderJobsStack":
              iconName = "briefcase-outline";
              break;
            case "ProviderProfileStack":
              iconName = "person-outline";
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="ProviderHomeStack" component={ProviderHomeStack} options={{ tabBarLabel: "Talepler" }} />
      <Tab.Screen name="MessagesStack" component={MessagesStack} options={{ tabBarLabel: "Mesajlar" }} />
      <Tab.Screen name="ProviderJobsStack" component={ProviderJobsStack} options={{ tabBarLabel: "İşlerim" }} />
      <Tab.Screen name="ProviderProfileStack" component={ProviderProfileStack} options={{ tabBarLabel: "Profil" }} />
    </Tab.Navigator>
  );
}
