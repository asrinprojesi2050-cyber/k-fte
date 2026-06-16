import { colors, spacing, borderRadius, shadows } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { apiFetch } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Category } from "../../api/types";

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "oto-servis": "car-sport-outline",
  "oto-tamir": "car-sport-outline",
  "elektrik": "flash-outline",
  "tesisat": "water-outline",
  "boya-badana": "color-palette-outline",
  "boyaci-tadilat": "color-palette-outline",
  "temizlik": "sparkles-outline",
  "ev-temizligi": "sparkles-outline",
  "tamirat": "hammer-outline",
  "nakliyat": "cube-outline",
  "bahce": "leaf-outline",
  "kilit": "lock-closed-outline",
  "kamera": "videocam-outline",
  "kombi": "thermometer-outline",
  "cam": "square-outline",
  "mobilya": "bed-outline",
  "diger": "construct-outline",
};

function iconFor(slug: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICONS[slug] ?? "construct-outline";
}

export default function CustomerHomeScreen() {
  const { auth } = useAuth();
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth?.user;

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      apiFetch<Category[]>("/api/categories")
        .then(setCategories)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hoş geldin, {user?.name ?? "Müşteri"}!</Text>
        <Text style={styles.subtitle}>Bugün hangi hizmete ihtiyacın var?</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.quickActions}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={styles.actionCard}
              onPress={() => navigation.navigate("CreateRequest", { categoryId: cat.id })}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={iconFor(cat.slug)} size={28} color={colors.primaryDark} />
              </View>
              <Text style={styles.actionLabel}>{cat.nameTr}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 40 },
  header: { marginBottom: spacing.xxl, marginTop: 20 },
  greeting: { fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: spacing.xs, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: colors.textSecondary },
  quickActions: { gap: spacing.md },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)"
  },
  iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
  actionLabel: { fontSize: 17, fontWeight: "600", color: colors.text, flex: 1 },
});
