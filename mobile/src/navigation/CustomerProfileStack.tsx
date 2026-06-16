import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CustomerProfileScreen from "../screens/customer/CustomerProfileScreen";
import CustomerProfileEditScreen from "../screens/customer/CustomerProfileEditScreen";

const Stack = createNativeStackNavigator<any>();

export default function CustomerProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CustomerProfileMain" component={CustomerProfileScreen} options={{ title: "Profil" }} />
      <Stack.Screen name="CustomerProfileEdit" component={CustomerProfileEditScreen} options={{ title: "Profili Düzenle" }} />
    </Stack.Navigator>
  );
}
