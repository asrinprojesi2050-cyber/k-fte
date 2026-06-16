import { colors, spacing, borderRadius } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { apiFetch } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { CustomerRequestsStackParamList } from "../../navigation/types";
import { cancelRequest } from "../../api/jobs";
import ErrorRetry from "../../components/ErrorRetry";
import { SkeletonList } from "../../components/Skeleton";

interface Request {
  id: string;
  description: string;
  budget: number | null;
  status: string;
  createdAt: string;
  category: { nameTr: string };
  offers: { id: string; amount: number }[];
}

type Nav = NativeStackNavigationProp<CustomerRequestsStackParamList, "CustomerRequestsList">;

export default function CustomerRequestsScreen() {
  const { auth } = useAuth();
  const navigation = useNavigation<Nav>();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const data = await apiFetch<Request[]>("/api/requests/mine", { token: auth?.token });
      setRequests(data);
    } catch {
      setError(true);
    }
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [auth?.token]);

  useFocusEffect(useCallback(() => { fetchRequests(); }, [fetchRequests]));

  async function handleCancel(requestId: string) {
    Alert.alert("İptal Et", "Bu talebi iptal etmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "İptal Et", style: "destructive", onPress: async () => {
        try {
          await cancelRequest(requestId, auth?.token);
          fetchRequests();
        } catch (e: any) {
          Alert.alert("Hata", e.message ?? "Bir şey yanlış gitti.");
        }
      }},
    ]);
  }

  if (loading) {
    return <SkeletonList />;
  }

  if (error) {
    return <ErrorRetry message="Talepler yüklenemedi." onRetry={() => fetchRequests()} />;
  }

  function statusLabel(status: string) {
    switch (status) {
      case "OPEN": return "Açık";
      case "MATCHED": return "Eşleşti";
      case "COMPLETED": return "Tamamlandı";
      case "CANCELLED": return "İptal";
      default: return status;
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "OPEN": return colors.primary;
      case "MATCHED": return colors.success;
      case "COMPLETED": return colors.textMuted;
      case "CANCELLED": return colors.error;
      default: return colors.textMuted;
    }
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={requests.length === 0 ? styles.empty : styles.list}
      data={requests}
      keyExtractor={(r) => r.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRequests(true)} colors={[colors.primary]} />}
      ListEmptyComponent={
        <View style={styles.emptyInner}>
          <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Henüz bir talebin yok.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate("RequestDetail", { requestId: item.id })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.category}>{item.category.nameTr}</Text>
            <View style={[styles.badge, { backgroundColor: statusColor(item.status) }]}>
              <Text style={styles.badgeText}>{statusLabel(item.status)}</Text>
            </View>
          </View>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          <View style={styles.cardFooter}>
            {item.budget ? <Text style={styles.budget}>Bütçe: {item.budget} MKD</Text> : null}
            <Text style={styles.offerCount}>{item.offers.length} teklif</Text>
          </View>
          {item.status === "OPEN" && (
            <Pressable style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
              <Ionicons name="close-outline" size={16} color={colors.error} />
              <Text style={styles.cancelText}>İptal Et</Text>
            </Pressable>
          )}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  emptyInner: { alignItems: "center", gap: spacing.md },
  emptyText: { fontSize: 15, color: colors.textMuted },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  category: { fontSize: 13, fontWeight: "600", color: colors.primary },
  badge: { borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  description: { fontSize: 15, color: colors.text, marginBottom: 10 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
  budget: { fontSize: 13, color: colors.textSecondary },
  offerCount: { fontSize: 13, color: colors.textSecondary },
  cancelBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 },
  cancelText: { fontSize: 13, color: colors.error },
});
