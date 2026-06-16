import { colors, spacing, borderRadius } from "../theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { apiFetch, ApiError } from "../api/client";
import { createReview } from "../api/jobs";

interface JobDetail {
  id: string;
  status: string;
  finalPrice: number;
  startedAt: string;
  completedAt: string | null;
  request: {
    description: string;
    status: string;
    category: { nameTr: string };
    customerId: string;
  };
  offer: { price: number; message: string | null };
  payment: { status: string } | null;
  review: { id: string; rating: number } | null;
}

export default function JobDetailScreen() {
  const { auth } = useAuth();
  const toast = useToast();
  const route = useRoute<RouteProp<Record<string, { jobId: string }>, string>>();
  const navigation = useNavigation();
  const { jobId } = route.params;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isProvider = auth?.role === "provider";

  useEffect(() => {
    loadJob();
  }, [jobId, auth?.token]);

  function loadJob() {
    setLoading(true);
    apiFetch<JobDetail>(`/api/jobs/${jobId}`, { token: auth?.token })
      .then(setJob)
      .catch(() => toast.show({ message: "İş detayı yüklenemedi", type: "error" }))
      .finally(() => setLoading(false));
  }

  async function handleComplete() {
    setSubmitting(true);
    try {
      await apiFetch(`/api/jobs/${jobId}/complete`, { method: "POST", token: auth?.token });
      toast.show({ message: "İş tamamlandı olarak işaretlendi." });
      loadJob();
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Bir şey yanlış gitti.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmPayment() {
    setSubmitting(true);
    try {
      await apiFetch(`/api/jobs/${jobId}/confirm-payment`, { method: "POST", token: auth?.token });
      toast.show({ message: "Ödeme onaylandı! İş tamamlandı." });
      loadJob();
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Bir şey yanlış gitti.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  function handleReview() {
    (navigation as any).navigate("ReviewForm", { jobId, providerName: "Usta" });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>İş bulunamadı.</Text>
      </View>
    );
  }

  function statusLabel(status: string) {
    switch (status) {
      case "IN_PROGRESS": return "Devam Ediyor";
      case "COMPLETED": return "Tamamlandı";
      case "DISPUTED": return "İhtilaflı";
      default: return status;
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "IN_PROGRESS": return colors.primary;
      case "COMPLETED": return colors.success;
      case "DISPUTED": return colors.error;
      default: return colors.textMuted;
    }
  }

  const canComplete = isProvider && job.status === "IN_PROGRESS";
  const canConfirmPayment = !isProvider && job.status === "COMPLETED" && !job.payment;
  const canReview = !isProvider && job.payment?.status === "CONFIRMED" && !job.review;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.category}>{job.request.category.nameTr}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor(job.status) }]}>
            <Text style={styles.badgeText}>{statusLabel(job.status)}</Text>
          </View>
        </View>
        <Text style={styles.amount}>{job.finalPrice} MKD</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name={isProvider ? "person-outline" : "construct-outline"} size={18} color={colors.primary} />
        <Text style={styles.infoText}>
          {isProvider ? "Müşteri ile çalışıyorsun" : "Usta takımda"}
        </Text>
      </View>

      {job.offer.message && (
        <View style={styles.messageBox}>
          <Text style={styles.messageLabel}>Ustanın notu:</Text>
          <Text style={styles.messageText}>{job.offer.message}</Text>
        </View>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>İş Açıklaması</Text>
      <Text style={styles.description}>{job.request.description}</Text>

      <View style={styles.divider} />

      {canComplete && (
        <Pressable style={styles.primaryButton} onPress={handleComplete} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>İşi Tamamla</Text>}
        </Pressable>
      )}

      {canConfirmPayment && (
        <Pressable style={styles.primaryButton} onPress={handleConfirmPayment} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Ödemeyi Onayla</Text>}
        </Pressable>
      )}

      {canReview && (
        <Pressable style={styles.secondaryButton} onPress={handleReview}>
          <Ionicons name="star-outline" size={18} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Değerlendir</Text>
        </Pressable>
      )}

      {job.review && (
        <View style={styles.reviewNote}>
          <Ionicons name="star" size={16} color="#f1c40f" />
          <Text style={styles.reviewNoteText}>Değerlendirildi: {job.review.rating}/5</Text>
        </View>
      )}

      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Geri Dön</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  content: { padding: spacing.xl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.lg },
  headerLeft: { flex: 1, gap: spacing.sm },
  category: { fontSize: 14, fontWeight: "600", color: colors.primary, textTransform: "uppercase" },
  badge: { alignSelf: "flex-start", borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  amount: { fontSize: 24, fontWeight: "bold", color: colors.primary },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  infoText: { fontSize: 15, color: colors.text, flex: 1 },
  messageBox: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.lg },
  messageLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: spacing.xs },
  messageText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: spacing.md },
  description: { fontSize: 16, lineHeight: 24, color: colors.text },
  primaryButton: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 16, alignItems: "center", marginBottom: spacing.md },
  primaryButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secondaryButton: { borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: spacing.sm, borderWidth: 2, borderColor: colors.primary, marginBottom: spacing.md },
  secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
  reviewNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, marginBottom: spacing.md },
  reviewNoteText: { fontSize: 15, color: colors.textSecondary },
  backButton: { alignItems: "center", paddingVertical: spacing.md },
  backButtonText: { fontSize: 15, color: colors.textMuted },
});
