import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CustomerHomeScreen from "../screens/customer/CustomerHomeScreen";
import ProviderDirectoryScreen from "../screens/customer/ProviderDirectoryScreen";
import ProviderPublicProfileScreen from "../screens/customer/ProviderPublicProfileScreen";
import { CustomerHomeStackParamList } from "./types";
import { colors } from "../theme";

const Stack = createNativeStackNavigator<CustomerHomeStackParamList>();

export default function CustomerHomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen 
        name="CustomerHome" 
        component={CustomerHomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ProviderDirectory" 
        component={ProviderDirectoryScreen} 
        options={{ title: "Ustaları Keşfet" }} 
      />
      <Stack.Screen 
        name="ProviderPublicProfile" 
        component={ProviderPublicProfileScreen} 
        options={{ title: "Usta Profili" }} 
      />
    </Stack.Navigator>
  );
}
