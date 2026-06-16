import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import OtpScreen from "../screens/auth/OtpScreen";
import PhoneScreen from "../screens/auth/PhoneScreen";
import RoleSelectScreen from "../screens/auth/RoleSelectScreen";
import CustomerTabs from "./CustomerTabs";
import ProviderTabs from "./ProviderTabs";
import { AuthStackParamList } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export default function RootNavigator() {
  const { auth, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {auth ? (
        auth.role === "customer" ? <CustomerTabs /> : <ProviderTabs />
      ) : (
        <AuthStack.Navigator>
          <AuthStack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ headerShown: false }} />
          <AuthStack.Screen name="Phone" component={PhoneScreen} options={{ title: "" }} />
          <AuthStack.Screen name="Otp" component={OtpScreen} options={{ title: "" }} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
