import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProviderHomeScreen from "../screens/provider/ProviderHomeScreen";
import RequestDetailScreen from "../screens/RequestDetailScreen";
import { ProviderHomeStackParamList } from "./types";

const Stack = createNativeStackNavigator<ProviderHomeStackParamList>();

export default function ProviderHomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProviderHomeList"
        component={ProviderHomeScreen}
        options={{ title: "Yakındaki Talepler" }}
      />
      <Stack.Screen
        name="RequestDetail"
        component={RequestDetailScreen}
        options={{ title: "Talep Detayı" }}
      />
    </Stack.Navigator>
  );
}
