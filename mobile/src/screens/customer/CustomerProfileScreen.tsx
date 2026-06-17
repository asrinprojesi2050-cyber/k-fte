import { colors, spacing, borderRadius } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../../locales/i18n";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const LANGUAGES = [
  { code: "tr", label: "🇹🇷" },
  { code: "en", label: "🇬🇧" },
  { code: "mk", label: "🇲🇰" },
  { code: "sq", label: "🇦🇱" },
];

export default function CustomerProfileScreen() {
  const { t, i18n } = useTranslation();
  const { auth, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const user = auth?.user;

  return (
    <View style={styles.container}>
      {user?.photoUrl ? (
        <Image source={{ uri: `${API_URL}${user.photoUrl}` }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? "?"}</Text>
        </View>
      )}
      <Text style={styles.name}>{user?.name ?? t("profile")}</Text>
      <Text style={styles.phone}>{user?.phone}</Text>

      <Pressable style={styles.editButton} onPress={() => navigation.navigate("CustomerProfileEdit")}>
        <Ionicons name="pencil-outline" size={18} color={colors.primary} />
        <Text style={styles.editButtonText}>Profili Düzenle</Text>
      </Pressable>

      <View style={styles.divider} />

      <Text style={styles.langTitle}>{t("change_language")}</Text>
      <View style={styles.langContainer}>
        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.code}
            style={[styles.langBtn, i18n.language === lang.code && styles.langBtnActive]}
            onPress={() => changeLanguage(lang.code)}
          >
            <Text style={styles.langText}>{lang.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.divider} />

      <Pressable style={styles.logoutButton} onPress={signOut}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>{t("logout")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: "center", padding: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", marginBottom: spacing.lg, marginTop: 40 },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  name: { fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: spacing.xs },
  phone: { fontSize: 15, color: colors.textSecondary },
  editButton: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xl, paddingVertical: 10, paddingHorizontal: 24, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.primary },
  editButtonText: { fontSize: 15, fontWeight: "600", color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, width: "100%", marginVertical: spacing.xxl },
  langTitle: { color: colors.textSecondary, marginBottom: spacing.sm },
  langContainer: { flexDirection: "row", gap: spacing.md },
  langBtn: { padding: spacing.sm, borderRadius: borderRadius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: "transparent" },
  langBtnActive: { borderColor: colors.primary },
  langText: { fontSize: 24 },
  logoutButton: { backgroundColor: colors.error, borderRadius: borderRadius.md, paddingVertical: 14, paddingHorizontal: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
