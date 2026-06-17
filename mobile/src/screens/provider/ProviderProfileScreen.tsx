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

export default function ProviderProfileScreen() {
  const { t, i18n } = useTranslation();
  const { auth, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const user = auth?.user;

  const isProvider = user && "categoryId" in user;
  const pUser = user as any;

  return (
    <View style={styles.container}>
      {pUser?.photoUrl ? (
        <Image source={{ uri: `${API_URL}${pUser.photoUrl}` }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? "?"}</Text>
        </View>
      )}
      <Text style={styles.name}>{user?.name ?? t("profile")}</Text>
      <Text style={styles.phone}>{user?.phone}</Text>

      {isProvider && (
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pUser.completedJobsCount ?? 0}</Text>
            <Text style={styles.statLabel}>İş</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(pUser.ratingAvg ?? 0).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pUser.verificationStatus === "APPROVED" ? "✓" : "..."}</Text>
            <Text style={styles.statLabel}>Onay</Text>
          </View>
        </View>
      )}

      <Pressable style={styles.editButton} onPress={() => navigation.navigate("ProviderProfileEdit")}>
        <Ionicons name="pencil-outline" size={18} color={colors.primary} />
        <Text style={styles.editButtonText}>Profili Düzenle</Text>
      </Pressable>

      {isProvider && (
        <Pressable 
          style={styles.publicProfileButton} 
          onPress={() => navigation.navigate("ProviderPublicProfile", { providerId: user.id })}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.publicProfileButtonText}>Genel Profilimi Görüntüle</Text>
        </Pressable>
      )}

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
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryDark, justifyContent: "center", alignItems: "center", marginBottom: spacing.lg, marginTop: 40 },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  name: { fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: spacing.xs },
  phone: { fontSize: 15, color: colors.textSecondary },
  stats: { flexDirection: "row", gap: spacing.xxl, marginTop: spacing.xl },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "bold", color: colors.primary },
  statLabel: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs },
  editButton: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xl, paddingVertical: 10, paddingHorizontal: 24, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.primary },
  editButtonText: { fontSize: 15, fontWeight: "600", color: colors.primary },
  publicProfileButton: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md, paddingVertical: 12, paddingHorizontal: 24, borderRadius: borderRadius.md, backgroundColor: colors.primary },
  publicProfileButtonText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  divider: { height: 1, backgroundColor: colors.border, width: "100%", marginVertical: spacing.xxl },
  langTitle: { color: colors.textSecondary, marginBottom: spacing.sm },
  langContainer: { flexDirection: "row", gap: spacing.md },
  langBtn: { padding: spacing.sm, borderRadius: borderRadius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: "transparent" },
  langBtnActive: { borderColor: colors.primary },
  langText: { fontSize: 24 },
  logoutButton: { backgroundColor: colors.error, borderRadius: borderRadius.md, paddingVertical: 14, paddingHorizontal: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
