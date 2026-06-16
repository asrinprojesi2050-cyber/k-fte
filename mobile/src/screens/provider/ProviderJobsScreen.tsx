import { colors, spacing, borderRadius } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { apiFetch } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { ProviderJobsStackParamList } from "../../navigation/types";
import ErrorRetry from "../../components/ErrorRetry";
import { SkeletonList } from "../../components/Skeleton";

interface Job {
  id: string;
  status: string;
  finalPrice: number;
  createdAt: string;
  completedAt: string | null;
  request: { description: string; category: { nameTr: string } };
  customer: { name: string };
}

type Nav = NativeStackNavigationProp<ProviderJobsStackParamList, "ProviderJobsList">;

export default function ProviderJobsScreen() {
  const { auth } = useAuth();
  const navigation = useNavigation<Nav>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const data = await apiFetch<Job[]>("/api/jobs/mine", { token: auth?.token });
      setJobs(data);
    } catch {
      setError(true);
    }
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [auth?.token]);

  useFocusEffect(useCallback(() => { fetchJobs(); }, [fetchJobs]));

  if (loading) {
    return <SkeletonList />;
  }

  if (error) {
    return <ErrorRetry message="İşler yüklenemedi." onRetry={() => fetchJobs()} />;
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

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={jobs.length === 0 ? styles.empty : styles.list}
      data={jobs}
      keyExtractor={(j) => j.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchJobs(true)} colors={[colors.primary]} />}
      ListHeaderComponent={<Text style={styles.heading}>İşlerim</Text>}
      ListEmptyComponent={
        <View style={styles.emptyInner}>
          <Ionicons name="briefcase-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Henüz işin yok.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate("JobDetail", { jobId: item.id })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.category}>{item.request.category.nameTr}</Text>
            <View style={[styles.badge, { backgroundColor: statusColor(item.status) }]}>
              <Text style={styles.badgeText}>{statusLabel(item.status)}</Text>
            </View>
          </View>
          <Text style={styles.description} numberOfLines={2}>{item.request.description}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.customer}>{item.customer.name}</Text>
            <Text style={styles.amount}>{item.finalPrice} MKD</Text>
          </View>
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
  heading: { fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  category: { fontSize: 13, fontWeight: "600", color: colors.primary },
  badge: { borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  description: { fontSize: 15, color: colors.text, marginBottom: 10 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  customer: { fontSize: 13, color: colors.textSecondary },
  amount: { fontSize: 13, fontWeight: "600", color: colors.primary },
});
