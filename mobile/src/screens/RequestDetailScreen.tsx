import { colors, spacing, borderRadius, shadows } from "../theme";
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
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { apiFetch, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { formatCurrency } from "../utils/currency";

interface OfferWithProvider {
  id: string;
  price: number;
  currency: string;
  message: string | null;
  status: string;
  provider: { id: string; name: string; ratingAvg: number };
  job?: { id: string; review: { id: string } | null } | null;
}

interface RequestDetail {
  id: string;
  description: string;
  budget: number | null;
  currency: string;
  status: string;
  createdAt: string;
  category: { nameTr: string };
  customer?: { id: string; name: string };
  offers: OfferWithProvider[];
}

type Nav = NativeStackNavigationProp<any>;

export default function RequestDetailScreen() {
  const { auth } = useAuth();
  const toast = useToast();
  const route = useRoute<RouteProp<Record<string, { requestId: string }>, string>>();
  const navigation = useNavigation<Nav>();
  const { requestId } = route.params;

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isProvider = auth?.role === "provider";

  function load() {
    setLoading(true);
    apiFetch<RequestDetail>(`/api/requests/${requestId}`, { token: auth?.token })
      .then(setRequest)
      .catch(() => toast.show({ message: "Talep detayı yüklenemedi", type: "error" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [requestId, auth?.token]);

  async function handleAcceptOffer(offerId: string) {
    setSubmitting(true);
    try {
      const job = await apiFetch<{ id: string }>(`/api/offers/${offerId}/accept`, { method: "POST", token: auth?.token });
      toast.show({ message: "Teklif kabul edildi! İş başlıyor." });
      setTimeout(() => navigation.replace("JobDetail", { jobId: job.id }), 500);
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Bir şey yanlış gitti.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMakeOffer() {
    if (!offerPrice || isNaN(Number(offerPrice))) {
      return Alert.alert("Hata", "Lütfen geçerli bir fiyat gir.");
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/offers", {
        method: "POST",
        token: auth?.token,
        body: { requestId, price: Number(offerPrice), message: offerMessage.trim() || undefined },
      });
      toast.show({ message: "Teklifin gönderildi!" });
      navigation.goBack();
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Bir şey yanlış gitti.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function executeCancelRequest() {
    setSubmitting(true);
    try {
      await apiFetch(`/api/requests/${requestId}/cancel`, { method: "POST", token: auth?.token });
      toast.show({ message: "Talep iptal edildi." });
      navigation.goBack();
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Bir şey yanlış gitti.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelRequest() {
    if (typeof window !== "undefined" && window.confirm) {
      if (!window.confirm("Bu talebi iptal etmek istediğine emin misin?")) return;
      return executeCancelRequest();
    }
    Alert.alert("İptal Et", "Bu talebi iptal etmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "İptal Et", style: "destructive", onPress: executeCancelRequest },
    ]);
  }

  async function executeWithdrawOffer(offerId: string) {
    setSubmitting(true);
    try {
      await apiFetch(`/api/offers/${offerId}/withdraw`, { method: "POST", token: auth?.token });
      toast.show({ message: "Teklif geri çekildi." });
      load();
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Bir şey yanlış gitti.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdrawOffer(offerId: string) {
    if (typeof window !== "undefined" && window.confirm) {
      if (!window.confirm("Bu teklifi geri çekmek istediğine emin misin?")) return;
      return executeWithdrawOffer(offerId);
    }
    Alert.alert("Geri Çek", "Bu teklifi geri çekmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Geri Çek", style: "destructive", onPress: () => executeWithdrawOffer(offerId) },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.center}>
        <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, marginTop: spacing.sm }}>Talep bulunamadı.</Text>
      </View>
    );
  }

  function statusBadge(status: string) {
    let bgColor = colors.primaryLight;
    let textColor = colors.primaryDark;
    let label = status;

    if (status === "OPEN") { bgColor = colors.info + "20"; textColor = colors.info; label = "Açık"; }
    else if (status === "MATCHED") { bgColor = colors.successLight; textColor = colors.success; label = "Eşleşti"; }
    else if (status === "COMPLETED") { bgColor = colors.successLight; textColor = colors.success; label = "Tamamlandı"; }
    else if (status === "CANCELLED") { bgColor = colors.errorLight; textColor = colors.error; label = "İptal"; }

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
      </View>
    );
  }

  const canAccept = request.status === "OPEN" && !isProvider;
  const canCancel = request.status === "OPEN" && !isProvider;
  const hasJob = request.status === "MATCHED" || request.status === "COMPLETED";

  const acceptedOffer = request.offers.find((o) => o.status === "ACCEPTED");
  const acceptedJobId = acceptedOffer?.job?.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.requestCard}>
        <View style={styles.header}>
          <View style={styles.catWrap}>
            <Ionicons name="build" size={16} color={colors.primaryDark} />
            <Text style={styles.category}>{request.category.nameTr}</Text>
          </View>
          {statusBadge(request.status)}
        </View>

        <Text style={styles.description}>{request.description}</Text>

        {request.budget && (
          <View style={styles.budgetWrap}>
            <Ionicons name="wallet-outline" size={18} color={colors.success} />
            <Text style={styles.budget}>{formatCurrency(request.budget, request.currency)}</Text>
          </View>
        )}
      </View>

      {hasJob && acceptedJobId && (
        <Pressable style={styles.jobLink} onPress={() => navigation.navigate("JobDetail", { jobId: acceptedJobId })}>
          <Ionicons name="briefcase" size={20} color="#fff" />
          <Text style={styles.jobLinkText}>İşin Durumuna Git</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: "auto" }} />
        </Pressable>
      )}

      {isProvider && request.status === "OPEN" ? (
        <View style={styles.offerForm}>
          <Text style={styles.sectionTitle}>Teklif Ver</Text>
          <Text style={styles.label}>Fiyat ({request.currency === "EUR" ? "€" : "MKD"}) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 2500"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={offerPrice}
            onChangeText={setOfferPrice}
          />
          <Text style={styles.label}>Mesaj (İsteğe bağlı)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="İşle ilgili notların, yapacakların..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            value={offerMessage}
            onChangeText={setOfferMessage}
          />
          <Pressable style={styles.primaryButton} onPress={handleMakeOffer} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Teklif Gönder</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}

      {canCancel && (
        <Pressable style={styles.cancelButton} onPress={handleCancelRequest} disabled={submitting}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={styles.cancelButtonText}>Talebi İptal Et</Text>
        </Pressable>
      )}

      {request.offers.length > 0 && (
        <View style={styles.offersSection}>
          <Text style={styles.sectionTitle}>
            Gelen Teklifler ({request.offers.length})
          </Text>
          {request.offers
            .filter((o) => o.status === "PENDING" || o.status === "ACCEPTED" || o.status === "WITHDRAWN")
            .map((offer) => (
              <View key={offer.id} style={[styles.offerCard, offer.status === "ACCEPTED" && styles.offerCardAccepted]}>
                <Pressable 
                  style={styles.offerHeader}
                  onPress={() => !isProvider && navigation.navigate("ProviderPublicProfile", { providerId: offer.provider.id })}
                >
                  <View style={styles.offerAvatar}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.offerProvider, !isProvider && { textDecorationLine: "underline" }]}>{offer.provider.name}</Text>
                    <View style={styles.ratingWrap}>
                      <Ionicons name="star" size={12} color={colors.warning} />
                      <Text style={styles.offerRating}>{offer.provider.ratingAvg.toFixed(1)}</Text>
                    </View>
                  </View>
                  <Text style={styles.offerPrice}>{formatCurrency(offer.price, offer.currency)}</Text>
                </Pressable>
                
                {offer.message && (
                  <View style={styles.messageBox}>
                    <Text style={styles.offerMessage}>{offer.message}</Text>
                  </View>
                )}
                
                <View style={styles.offerActions}>
                  {offer.status === "ACCEPTED" && (
                    <View style={styles.acceptedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={styles.acceptedText}>Kabul Edildi</Text>
                    </View>
                  )}
                  {offer.status === "WITHDRAWN" && (
                    <Text style={styles.withdrawnText}>Geri çekildi</Text>
                  )}
                  {canAccept && offer.status === "PENDING" && (
                    <Pressable style={styles.acceptButton} onPress={() => handleAcceptOffer(offer.id)} disabled={submitting}>
                      <Text style={styles.acceptButtonText}>Teklifi Kabul Et</Text>
                    </Pressable>
                  )}
                  {isProvider && offer.status === "PENDING" && offer.provider.id === auth?.user?.id && (
                    <Pressable style={styles.withdrawButton} onPress={() => handleWithdrawOffer(offer.id)} disabled={submitting}>
                      <Text style={styles.withdrawButtonText}>Teklifi Geri Çek</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  
  requestCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  catWrap: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full },
  category: { fontSize: 14, fontWeight: "700", color: colors.primaryDark, textTransform: "uppercase" },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 13, fontWeight: "700" },
  
  description: { fontSize: 17, lineHeight: 26, color: colors.text, marginBottom: spacing.lg },
  
  budgetWrap: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.successLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.full },
  budget: { fontSize: 16, fontWeight: "700", color: colors.success },
  
  jobLink: { backgroundColor: colors.primary, borderRadius: borderRadius.xl, padding: spacing.xl, flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl, ...shadows.md },
  jobLinkText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: colors.text, marginBottom: spacing.lg, letterSpacing: -0.5 },
  
  offerForm: { marginBottom: spacing.xl },
  label: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: 16, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, ...shadows.sm },
  textArea: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: 16, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, minHeight: 100, textAlignVertical: "top", ...shadows.sm },
  primaryButton: { backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: 16, flexDirection: "row", justifyContent: "center", gap: spacing.sm, alignItems: "center", marginBottom: spacing.xl, ...shadows.md },
  primaryButtonText: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.5 },
  
  cancelButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: 14, marginBottom: spacing.xl, backgroundColor: colors.errorLight, borderRadius: borderRadius.full },
  cancelButtonText: { fontSize: 16, color: colors.error, fontWeight: "700" },
  
  offersSection: { marginTop: spacing.md },
  offerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)"
  },
  offerCardAccepted: { borderColor: colors.success, borderWidth: 2 },
  offerHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  offerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, justifyContent: "center", alignItems: "center" },
  offerProvider: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 2 },
  ratingWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  offerRating: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  offerPrice: { fontSize: 20, fontWeight: "800", color: colors.primary },
  
  messageBox: { backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.primary },
  offerMessage: { fontSize: 15, color: colors.text, lineHeight: 22 },
  
  offerActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  acceptButton: { flex: 1, backgroundColor: colors.success, borderRadius: borderRadius.full, paddingVertical: 12, alignItems: "center", ...shadows.sm },
  acceptButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  withdrawButton: { flex: 1, borderRadius: borderRadius.full, paddingVertical: 12, alignItems: "center", borderWidth: 2, borderColor: colors.error },
  withdrawButtonText: { color: colors.error, fontSize: 15, fontWeight: "700" },
  
  acceptedBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.successLight, borderRadius: borderRadius.full, paddingHorizontal: 16, paddingVertical: 8 },
  acceptedText: { color: colors.success, fontSize: 15, fontWeight: "700" },
  withdrawnText: { fontSize: 14, color: colors.textMuted, fontStyle: "italic", paddingVertical: 10 },
});
