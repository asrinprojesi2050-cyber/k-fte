import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProviderProfileScreen from "../screens/provider/ProviderProfileScreen";
import ProviderProfileEditScreen from "../screens/provider/ProviderProfileEditScreen";
import ProviderPublicProfileScreen from "../screens/customer/ProviderPublicProfileScreen";

const Stack = createNativeStackNavigator<any>();

export default function ProviderProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProviderProfileMain" component={ProviderProfileScreen} options={{ title: "Profil" }} />
      <Stack.Screen name="ProviderProfileEdit" component={ProviderProfileEditScreen} options={{ title: "Profili Düzenle" }} />
      <Stack.Screen name="ProviderPublicProfile" component={ProviderPublicProfileScreen} options={{ title: "Genel Profil" }} />
    </Stack.Navigator>
  );
}
