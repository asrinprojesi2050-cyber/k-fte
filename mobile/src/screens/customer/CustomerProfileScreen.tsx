import { colors, spacing, borderRadius } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function CustomerProfileScreen() {
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
      <Text style={styles.name}>{user?.name ?? "Müşteri"}</Text>
      <Text style={styles.phone}>{user?.phone}</Text>

      <Pressable style={styles.editButton} onPress={() => navigation.navigate("CustomerProfileEdit")}>
        <Ionicons name="pencil-outline" size={18} color={colors.primary} />
        <Text style={styles.editButtonText}>Profili Düzenle</Text>
      </Pressable>

      <View style={styles.divider} />

      <Pressable style={styles.logoutButton} onPress={signOut}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Çıkış Yap</Text>
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
  logoutButton: { backgroundColor: colors.error, borderRadius: borderRadius.md, paddingVertical: 14, paddingHorizontal: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
