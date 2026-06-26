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
  TextInput,
  View,
  Modal,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { apiFetch, ApiError } from "../api/client";
import { createReview } from "../api/jobs";
import { formatCurrency } from "../utils/currency";

interface AdditionalCost {
  id: string;
  amount: number;
  description: string;
  status: string;
}

interface JobDetail {
  id: string;
  status: string;
  milestone: string | null;
  finalPrice: number;
  currency: string;
  startedAt: string;
  completedAt: string | null;
  request: {
    description: string;
    status: string;
    category: { nameTr: string };
    customerId: string;
    customer: { name: string; phone: string };
    scheduledAt: string | null;
  };
  provider: { id: string; name: string; phone: string; ratingAvg: number };
  offer: { price: number; message: string | null; isDiscovery: boolean };
  payment: { status: string } | null;
  review: { id: string; rating: number } | null;
  additionalCosts: AdditionalCost[];
}

export default function JobDetailScreen() {
  const { auth } = useAuth();
  const toast = useToast();
  const route = useRoute<RouteProp<Record<string, { jobId: string }>, string>>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { jobId } = route.params;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentSent, setPaymentSent] = useState(false);
  
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const [costModalVisible, setCostModalVisible] = useState(false);
  const [costAmount, setCostAmount] = useState("");
  const [costDesc, setCostDesc] = useState("");

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

  async function handleMilestone(milestone: string) {
    setSubmitting(true);
    try {
      await apiFetch(`/api/jobs/${jobId}/milestone`, { method: "POST", token: auth?.token, body: { milestone } });
      toast.show({ message: "Durum güncellendi." });
      loadJob();
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Hata", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (typeof window !== "undefined" && window.confirm) {
      if (!window.confirm("Bu işi iptal etmek istediğine emin misin? (Son 2 saat içindeyse ceza uygulanabilir)")) return;
    } else {
      Alert.alert("İptal Et", "Bu işi iptal etmek istediğine emin misin? (Son 2 saat içindeyse ceza uygulanabilir)", [
        { text: "Vazgeç", style: "cancel" },
        { text: "İptal Et", style: "destructive", onPress: executeCancel },
      ]);
      return;
    }
    executeCancel();
  }

  async function executeCancel() {
    setSubmitting(true);
    try {
      const res = await apiFetch<any>(`/api/jobs/${jobId}/cancel`, { method: "POST", token: auth?.token });
      if (res.penaltyApplied) {
        toast.show({ message: "İş iptal edildi. Geç iptal sebebiyle ceza puanı aldınız.", type: "error" });
      } else {
        toast.show({ message: "İş iptal edildi." });
      }
      loadJob();
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Hata", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestCost() {
    if (!costAmount || !costDesc) return Alert.alert("Hata", "Lütfen tutar ve açıklama girin.");
    setSubmitting(true);
    try {
      await apiFetch(`/api/additional-costs`, {
        method: "POST", token: auth?.token,
        body: { jobId, amount: Number(costAmount), description: costDesc }
      });
      toast.show({ message: "Ek masraf talebi gönderildi." });
      setCostModalVisible(false);
      loadJob();
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Hata", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApproveCost(costId: string) {
    setSubmitting(true);
    try {
      await apiFetch(`/api/additional-costs/${costId}/approve`, { method: "POST", token: auth?.token });
      toast.show({ message: "Ek masraf onaylandı." });
      loadJob();
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Hata", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRejectCost(costId: string) {
    setSubmitting(true);
    try {
      await apiFetch(`/api/additional-costs/${costId}/reject`, { method: "POST", token: auth?.token });
      toast.show({ message: "Ek masraf reddedildi." });
      loadJob();
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Hata", type: "error" });
    } finally {
      setSubmitting(false);
    }
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

  async function handlePaymentSent() {
    setSubmitting(true);
    try {
      await apiFetch(`/api/jobs/${jobId}/payment-sent`, { method: "POST", token: auth?.token });
      toast.show({ message: "Ödeme bildirimi alındı, yöneticiler kontrol ediyor." });
      setPaymentSent(true);
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Bir şey yanlış gitti.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  function handleReview() {
    (navigation as any).navigate("ReviewForm", { jobId, providerName: job?.provider.name });
  }

  async function handleDispute() {
    if (!disputeReason.trim()) {
      toast.show({ message: "Lütfen bir sebep girin.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(`/api/jobs/${jobId}/dispute`, {
        method: "POST",
        token: auth?.token,
        body: { reason: disputeReason },
      });
      toast.show({ message: "Şikayetiniz iletildi." });
      setDisputeModalVisible(false);
      loadJob();
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Hata", type: "error" });
    } finally {
      setSubmitting(false);
    }
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
      case "WAITING_PAYMENT": return "Ödeme Bekleniyor";
      case "IN_PROGRESS": return "Devam Ediyor";
      case "COMPLETED": return "Tamamlandı";
      case "DISPUTED": return "İhtilaflı";
      default: return status;
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "WAITING_PAYMENT": return "#f39c12";
      case "IN_PROGRESS": return colors.primary;
      case "COMPLETED": return colors.success;
      case "DISPUTED": return colors.error;
      default: return colors.textMuted;
    }
  }

  const canComplete = isProvider && job.status === "IN_PROGRESS";
  const canSendPayment = !isProvider && job.status === "WAITING_PAYMENT" && !paymentSent;
  const canReview = !isProvider && job.status === "COMPLETED" && !job.review;
  const canDispute = job.status === "IN_PROGRESS";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.category}>{job.request.category.nameTr}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor(job.status) }]}>
            <Text style={styles.badgeText}>{statusLabel(job.status)}</Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatCurrency(job.finalPrice, job.currency)}</Text>
      </View>

      {job.request.scheduledAt && (
        <View style={{ backgroundColor: colors.infoLight, padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ color: colors.info, fontSize: 14, fontWeight: "600" }}>
            📅 Randevu: {new Date(job.request.scheduledAt).toLocaleString("tr-TR")}
          </Text>
        </View>
      )}

      {job.milestone && (
        <View style={{ backgroundColor: colors.primaryLight, padding: 12, borderRadius: 8, marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="flag-outline" size={20} color={colors.primary} />
          <Text style={{ color: colors.primaryDark, fontSize: 15, fontWeight: "bold" }}>
            Anlık Durum: {job.milestone}
          </Text>
        </View>
      )}

      {job.status === "WAITING_PAYMENT" && (
        <View style={{ backgroundColor: "#fff3cd", padding: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: "#ffeeba" }}>
          {!isProvider ? (
            <Text style={{ color: "#856404", fontSize: 15, fontWeight: "500", lineHeight: 22 }}>
              Lütfen {formatCurrency(job.finalPrice, job.currency)} tutarını şu IBAN'a gönderin:{"\n"}
              <Text style={{ fontWeight: "bold" }}>TR99 0000 0000 0000 0000 0000 00</Text>{"\n\n"}
              Açıklama: <Text style={{ fontWeight: "bold" }}>KOFTE-{job.id.substring(0,6).toUpperCase()}</Text>
            </Text>
          ) : (
            <Text style={{ color: "#856404", fontSize: 15, fontWeight: "500", lineHeight: 22 }}>
              Müşterinin ödemesi bekleniyor, ödeme platform havuzuna geçince işe başlayabileceksiniz.
            </Text>
          )}
        </View>
      )}

      <Pressable 
        style={styles.infoCard}
        onPress={() => {
          if (!isProvider) {
            navigation.navigate("ProviderPublicProfile", { providerId: job.provider.id });
          }
        }}
      >
        <Ionicons name={isProvider ? "person" : "construct"} size={24} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoLabel}>{isProvider ? "Müşteri" : "Usta"}</Text>
          <Text style={[styles.infoValue, !isProvider && { color: colors.primary, textDecorationLine: "underline" }]}>
            {isProvider ? job.request.customer.name : job.provider.name}
          </Text>
          <Text style={styles.infoSubtext}>
            {isProvider ? job.request.customer.phone : job.provider.phone}
          </Text>
        </View>
        {!isProvider && <Ionicons name="chevron-forward" size={20} color={colors.border} />}
      </Pressable>

      {job.offer.message && (
        <View style={styles.messageBox}>
          <Text style={styles.messageLabel}>Ustanın notu:</Text>
          <Text style={styles.messageText}>{job.offer.message}</Text>
          {job.offer.isDiscovery && (
            <Text style={{ color: colors.primary, fontWeight: "bold", marginTop: 8 }}>🔍 Bu bir ücretsiz keşif teklifidir.</Text>
          )}
        </View>
      )}

      {job.additionalCosts?.length > 0 && (
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={styles.sectionTitle}>Ekstra Masraflar</Text>
          {job.additionalCosts.map(cost => (
            <View key={cost.id} style={{ backgroundColor: colors.card, padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>{cost.description}</Text>
                <Text style={{ fontWeight: "bold", color: colors.primary }}>{formatCurrency(cost.amount, job.currency)}</Text>
              </View>
              <Text style={{ color: cost.status === "ACCEPTED" ? colors.success : cost.status === "REJECTED" ? colors.error : colors.warning, fontWeight: "bold", marginBottom: 8 }}>
                Durum: {cost.status === "ACCEPTED" ? "Onaylandı" : cost.status === "REJECTED" ? "Reddedildi" : "Onay Bekliyor"}
              </Text>
              
              {!isProvider && cost.status === "PENDING" && (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable style={{ flex: 1, backgroundColor: colors.success, padding: 8, borderRadius: 4, alignItems: "center" }} onPress={() => handleApproveCost(cost.id)}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Onayla</Text>
                  </Pressable>
                  <Pressable style={{ flex: 1, borderWidth: 1, borderColor: colors.error, padding: 8, borderRadius: 4, alignItems: "center" }} onPress={() => handleRejectCost(cost.id)}>
                    <Text style={{ color: colors.error, fontWeight: "bold" }}>Reddet</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>İş Açıklaması</Text>
      <Text style={styles.description}>{job.request.description}</Text>

      <View style={styles.divider} />

      {isProvider && job.status === "IN_PROGRESS" && (
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={styles.sectionTitle}>Durum Güncelle</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {["Yola Çıktım", "İşe Başladım", "Malzeme Bekleniyor"].map(m => (
              <Pressable key={m} style={{ backgroundColor: colors.border, padding: 10, borderRadius: 8 }} onPress={() => handleMilestone(m)}>
                <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.secondaryButton} onPress={() => setCostModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Ekstra Masraf Talep Et</Text>
          </Pressable>
        </View>
      )}

      {canComplete && (
        <Pressable style={styles.primaryButton} onPress={handleComplete} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>İşi Tamamla</Text>}
        </Pressable>
      )}

      {canSendPayment && (
        <Pressable style={styles.primaryButton} onPress={handlePaymentSent} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Parayı Gönderdim</Text>}
        </Pressable>
      )}

      {canReview && (
        <Pressable style={styles.secondaryButton} onPress={handleReview}>
          <Ionicons name="star-outline" size={18} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Değerlendir</Text>
        </Pressable>
      )}

      {job.status !== "COMPLETED" && job.status !== "CANCELLED" && (
        <Pressable style={[styles.secondaryButton, { borderColor: colors.error, marginTop: 16 }]} onPress={handleCancel}>
          <Ionicons name="close-circle-outline" size={18} color={colors.error} />
          <Text style={[styles.secondaryButtonText, { color: colors.error }]}>İşi İptal Et</Text>
        </Pressable>
      )}

      {canDispute && (
        <Pressable style={[styles.secondaryButton, { borderColor: colors.error, marginTop: 16 }]} onPress={() => setDisputeModalVisible(true)}>
          <Ionicons name="warning-outline" size={18} color={colors.error} />
          <Text style={[styles.secondaryButtonText, { color: colors.error }]}>Sorun Bildir (Şikayet Et)</Text>
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

      <Modal visible={disputeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sorun Bildir</Text>
            <Text style={styles.modalSub}>Lütfen yaşadığınız sorunu kısaca anlatın. İşlem askıya alınacak ve yönetici mesajlarınızı inceleyerek karar verecektir.</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              placeholder="Sorun nedir?..."
              value={disputeReason}
              onChangeText={setDisputeReason}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setDisputeModalVisible(false)} disabled={submitting}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable style={styles.modalSubmit} onPress={handleDispute} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Gönder</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={costModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ekstra Masraf Talep Et</Text>
            <Text style={styles.modalSub}>Beklenmeyen bir durum mu oldu? Müşteriden ekstra masraf onaylamasını isteyin.</Text>
            
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Tutar ({job.currency})</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 12 }}
              keyboardType="number-pad"
              placeholder="Örn: 500"
              value={costAmount}
              onChangeText={setCostAmount}
            />

            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Açıklama</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={3}
              placeholder="Neden ekstra masraf gerekiyor?"
              value={costDesc}
              onChangeText={setCostDesc}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setCostModalVisible(false)} disabled={submitting}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable style={[styles.modalSubmit, { backgroundColor: colors.primary }]} onPress={handleRequestCost} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Talep Et</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  
  infoCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.card, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  infoLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "600", marginBottom: 2 },
  infoValue: { fontSize: 17, color: colors.text, fontWeight: "bold", marginBottom: 2 },
  infoSubtext: { fontSize: 14, color: colors.textMuted },
  
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: spacing.xl },
  modalContent: { backgroundColor: "#fff", borderRadius: borderRadius.xl, padding: spacing.xl },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: spacing.sm },
  modalSub: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  modalInput: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, height: 100, textAlignVertical: "top", marginBottom: spacing.lg },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.md },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
  modalSubmit: { backgroundColor: colors.error, paddingVertical: 10, paddingHorizontal: 16, borderRadius: borderRadius.md },
  modalSubmitText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
