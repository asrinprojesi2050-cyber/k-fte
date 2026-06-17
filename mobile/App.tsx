import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { ToastProvider } from "./src/components/Toast";
import RootNavigator from "./src/navigation/RootNavigator";
import { addNotificationResponseListener } from "./src/services/push";
import { initI18n } from "./src/locales/i18n";

export default function App() {
  const [i18nLoaded, setI18nLoaded] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nLoaded(true));

    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log("Notification tapped:", data);
    });
    return () => sub.remove();
  }, []);

  if (!i18nLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
