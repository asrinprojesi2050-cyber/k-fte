import { colors, spacing, borderRadius, shadows } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Image, FlatList } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { apiFetch } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Category } from "../../api/types";
import { fetchProviders, Provider } from "../../api/providers";

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
  const [topProviders, setTopProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth?.user;

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([
        apiFetch<Category[]>("/api/categories"),
        fetchProviders({ limit: 5 })
      ])
        .then(([cats, provs]) => {
          setCategories(cats);
          setTopProviders(provs);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hoş geldin, {user?.name ?? "Müşteri"}!</Text>
        <Text style={styles.subtitle}>Bugün hangi hizmete ihtiyacın var?</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ustaları Keşfet</Text>
              <Pressable onPress={() => navigation.navigate("ProviderDirectory")}>
                <Text style={styles.seeAllText}>Tümünü Gör</Text>
              </Pressable>
            </View>
            
            {topProviders.length > 0 ? (
              <FlatList
                data={topProviders}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: 4 }}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable 
                    style={styles.providerCard}
                    onPress={() => navigation.navigate("ProviderPublicProfile", { providerId: item.id })}
                  >
                    <View style={styles.providerAvatarWrap}>
                      {item.photoUrl ? (
                        <Image source={{ uri: `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}${item.photoUrl}` }} style={styles.providerAvatar} />
                      ) : (
                        <Ionicons name="person" size={24} color={colors.primaryDark} />
                      )}
                    </View>
                    <Text style={styles.providerName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color={colors.warning} />
                      <Text style={styles.ratingText}>{item.ratingAvg.toFixed(1)}</Text>
                    </View>
                  </Pressable>
                )}
              />
            ) : (
              <Pressable 
                style={styles.emptyProviderBanner}
                onPress={() => navigation.navigate("ProviderDirectory")}
              >
                <Ionicons name="map-outline" size={32} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyProviderTitle}>Ustaları Haritada Bul</Text>
                  <Text style={styles.emptyProviderText}>Şehrindeki tüm ustaları görmek için tıkla.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hizmet Kategorileri</Text>
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
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 40 },
  header: { marginBottom: spacing.lg, marginTop: 20 },
  greeting: { fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: spacing.xs, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: colors.textSecondary },
  
  section: { marginBottom: spacing.xxl },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: colors.text, marginBottom: spacing.sm },
  seeAllText: { fontSize: 14, color: colors.primary, fontWeight: "600" },

  providerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    width: 120,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  providerAvatarWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: "center", alignItems: "center",
    marginBottom: spacing.sm, overflow: "hidden"
  },
  providerAvatar: { width: "100%", height: "100%" },
  providerName: { fontSize: 14, fontWeight: "600", color: colors.text, textAlign: "center", marginBottom: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },

  emptyProviderBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
  },
  emptyProviderTitle: { fontSize: 16, fontWeight: "bold", color: colors.primaryDark, marginBottom: 2 },
  emptyProviderText: { fontSize: 14, color: colors.textSecondary },

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
