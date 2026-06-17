import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CustomerRequestsScreen from "../screens/customer/CustomerRequestsScreen";
import RequestDetailScreen from "../screens/RequestDetailScreen";
import JobDetailScreen from "../screens/JobDetailScreen";
import ReviewFormScreen from "../screens/customer/ReviewFormScreen";
import ProviderPublicProfileScreen from "../screens/customer/ProviderPublicProfileScreen";
import { CustomerRequestsStackParamList } from "./types";

const Stack = createNativeStackNavigator<CustomerRequestsStackParamList>();

export default function CustomerRequestsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CustomerRequestsList"
        component={CustomerRequestsScreen}
        options={{ title: "Taleplerim" }}
      />
      <Stack.Screen
        name="RequestDetail"
        component={RequestDetailScreen}
        options={{ title: "Talep Detayı" }}
      />
      <Stack.Screen
        name="JobDetail"
        component={JobDetailScreen}
        options={{ title: "İş Detayı" }}
      />
      <Stack.Screen
        name="ReviewForm"
        component={ReviewFormScreen}
        options={{ title: "Değerlendir" }}
      />
      <Stack.Screen
        name="ProviderPublicProfile"
        component={ProviderPublicProfileScreen}
        options={{ title: "Usta Profili" }}
      />
    </Stack.Navigator>
  );
}
