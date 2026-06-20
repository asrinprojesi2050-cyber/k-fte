import { colors } from "../theme";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CustomerHomeStack from "./CustomerHomeStack";
import CreateRequestScreen from "../screens/customer/CreateRequestScreen";
import CustomerProfileStack from "./CustomerProfileStack";
import CustomerRequestsStack from "./CustomerRequestsStack";
import MessagesStack from "./MessagesStack";
import { CustomerTabParamList } from "./types";

const Tab = createBottomTabNavigator<CustomerTabParamList>();

export default function CustomerTabs() {
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
            case "CustomerHomeStack":
              iconName = "home-outline";
              break;
            case "CreateRequest":
              iconName = "add-circle-outline";
              break;
            case "CustomerRequestsStack":
              iconName = "list-outline";
              break;
            case "MessagesStack":
              iconName = "chatbubble-outline";
              break;
            case "CustomerProfileStack":
              iconName = "person-outline";
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="CustomerHomeStack" component={CustomerHomeStack} options={{ tabBarLabel: "Ana Sayfa" }} />
      <Tab.Screen name="CreateRequest" component={CreateRequestScreen} options={{ tabBarLabel: "Talep Oluştur" }} />
      <Tab.Screen name="CustomerRequestsStack" component={CustomerRequestsStack} options={{ tabBarLabel: "Taleplerim" }} />
      <Tab.Screen name="MessagesStack" component={MessagesStack} options={{ tabBarLabel: "Mesajlar" }} />
      <Tab.Screen name="CustomerProfileStack" component={CustomerProfileStack} options={{ tabBarLabel: "Profil" }} />
    </Tab.Navigator>
  );
}
