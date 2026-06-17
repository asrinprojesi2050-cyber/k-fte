import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadows } from "../../theme";
import { apiFetch } from "../../api/client";
import { useTranslation } from "react-i18next";
import { CustomerRequestsStackParamList } from "../../navigation/types";

interface ProviderData {
  id: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  city: string;
  ratingAvg: number;
  completedJobsCount: number;
  category: { nameTr: string; nameEn: string; nameMk: string; nameSq: string };
  jobs?: Array<{
    id: string;
    completedAt: string;
    finalPrice: number;
    request: {
      category: { nameTr: string; nameEn: string; nameMk: string; nameSq: string };
      customer: { name: string };
    };
    review?: {
      rating: number;
      comment: string | null;
    } | null;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    customer: { name: string };
    job: {
      request: { category: { nameTr: string; nameEn: string; nameMk: string; nameSq: string } };
    };
  }>;
}

export default function ProviderPublicProfileScreen() {
  const route = useRoute<RouteProp<CustomerRequestsStackParamList, "ProviderPublicProfile">>();
  const { providerId } = route.params;
  const { t, i18n } = useTranslation();
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ProviderData>(`/api/providers/${providerId}`)
      .then(setProvider)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [providerId]);

  const getCategoryName = (cat: any) => {
    if (!cat) return "";
    const lang = i18n.language;
    if (lang === "en") return cat.nameEn || cat.nameTr;
    if (lang === "mk") return cat.nameMk || cat.nameTr;
    if (lang === "sq") return cat.nameSq || cat.nameTr;
    return cat.nameTr;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>Usta bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.avatarWrap}>
          {provider.photoUrl ? (
            <Image
              source={{ uri: `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}${provider.photoUrl}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={colors.primaryDark} />
            </View>
          )}
        </View>

        <Text style={styles.name}>{provider.name}</Text>
        <Text style={styles.category}>{getCategoryName(provider.category)} - {provider.city}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="star" size={20} color={colors.warning} />
            <Text style={styles.statValue}>{provider.ratingAvg.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.statValue}>{provider.completedJobsCount}</Text>
            <Text style={styles.statLabel}>İş Tamamladı</Text>
          </View>
        </View>
      </View>

      {provider.bio && (
        <View style={styles.bioCard}>
          <Text style={styles.sectionTitle}>Hakkında</Text>
          <Text style={styles.bioText}>{provider.bio}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Neler Yaptı? (Tamamlanan İşler)</Text>
      {provider.jobs && provider.jobs.length > 0 ? (
        provider.jobs.map((job) => (
          <View key={job.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>{job.request.customer.name} için yapıldı</Text>
              {job.review ? (
                <View style={styles.starsRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < job.review!.rating ? "star" : "star-outline"}
                      size={14}
                      color={colors.warning}
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.reviewDate}>Değerlendirilmedi</Text>
              )}
            </View>
            
            <Text style={styles.reviewCategory}>
              İş: {getCategoryName(job.request.category)}
            </Text>

            {job.review?.comment && <Text style={styles.reviewComment}>"{job.review.comment}"</Text>}
            <Text style={styles.reviewDate}>
              {new Date(job.completedAt).toLocaleDateString("tr-TR")}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyReviews}>
          <Ionicons name="briefcase-outline" size={32} color={colors.border} />
          <Text style={styles.emptyReviewsText}>Henüz tamamlanmış bir işi yok.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  errorText: { marginTop: spacing.sm, color: colors.textMuted, fontSize: 16 },

  headerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  avatarWrap: {
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  name: { fontSize: 24, fontWeight: "bold", color: colors.text, marginBottom: 4 },
  category: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg },
  
  statsRow: { flexDirection: "row", alignItems: "center", width: "100%", justifyContent: "space-evenly", paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  statBox: { alignItems: "center", gap: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 13, color: colors.textSecondary },

  bioCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  bioText: { fontSize: 15, color: colors.text, lineHeight: 22 },

  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  reviewerName: { fontSize: 15, fontWeight: "700", color: colors.text },
  starsRow: { flexDirection: "row", gap: 2 },
  reviewCategory: { fontSize: 13, color: colors.primary, fontWeight: "600", marginBottom: spacing.sm },
  reviewComment: { fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: spacing.sm },
  reviewDate: { fontSize: 12, color: colors.textMuted },

  emptyReviews: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyReviewsText: { marginTop: spacing.sm, color: colors.textMuted, fontSize: 14 },
});
