import { colors, spacing, borderRadius } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthStackParamList } from "../../navigation/types";
import { useTranslation } from "react-i18next";

type Props = NativeStackScreenProps<AuthStackParamList, "RoleSelect">;

export default function RoleSelectScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Ionicons name="flame" size={48} color={colors.primary} />
      </View>
      <Text style={styles.title}>Köfte</Text>
      <Text style={styles.subtitle}>{t("app_subtitle")}</Text>

      <View style={styles.buttons}>
        <Pressable style={styles.customerButton} onPress={() => navigation.navigate("Phone", { role: "customer" })}>
          <Ionicons name="person-outline" size={24} color="#fff" />
          <Text style={styles.buttonText}>{t("im_customer")}</Text>
          <Text style={styles.buttonHint}>{t("want_service")}</Text>
        </Pressable>

        <Pressable style={styles.providerButton} onPress={() => navigation.navigate("Phone", { role: "provider" })}>
          <Ionicons name="construct-outline" size={24} color="#fff" />
          <Text style={styles.buttonText}>{t("im_provider")}</Text>
          <Text style={styles.buttonHint}>{t("want_provide_service")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: spacing.xl },
  logo: { alignSelf: "center", marginBottom: spacing.md },
  title: { fontSize: 36, fontWeight: "bold", color: colors.text, textAlign: "center", marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: "center", marginBottom: 48 },
  buttons: { gap: spacing.lg },
  customerButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  providerButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  buttonHint: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
});
