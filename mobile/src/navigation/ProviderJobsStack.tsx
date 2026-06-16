import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProviderJobsScreen from "../screens/provider/ProviderJobsScreen";
import JobDetailScreen from "../screens/JobDetailScreen";
import { ProviderJobsStackParamList } from "./types";

const Stack = createNativeStackNavigator<ProviderJobsStackParamList>();

export default function ProviderJobsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProviderJobsList" component={ProviderJobsScreen} options={{ title: "İşlerim" }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: "İş Detayı" }} />
    </Stack.Navigator>
  );
}
