import { colors, spacing, borderRadius, shadows } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { Conversation, fetchConversations } from "../../api/chat";
import ErrorRetry from "../../components/ErrorRetry";
import { SkeletonList } from "../../components/Skeleton";

export default function ChatListScreen() {
  const { auth } = useAuth();
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const data = await fetchConversations(auth?.token);
      setConversations(data);
    } catch {
      setError(true);
    }
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [auth?.token]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  if (loading) {
    return <SkeletonList count={6} />;
  }

  if (error) {
    return <ErrorRetry message="Sohbetler yüklenemedi." onRetry={() => fetch()} />;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={conversations.length === 0 ? styles.empty : styles.list}
      data={conversations}
      keyExtractor={(c) => c.requestId}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetch(true)} colors={[colors.primary]} />}
      ListEmptyComponent={
        <View style={styles.emptyInner}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Henüz sohbet yok.</Text>
          <Text style={styles.emptyHint}>Bir talep oluşturunca sohbet başlar.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate("ChatDetail", { requestId: item.requestId, otherName: item.otherName })}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color={colors.primaryDark} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.otherName}>{item.otherName}</Text>
              <Text style={styles.time}>
                {new Date(item.lastMessageAt).toLocaleDateString("tr-TR")}
              </Text>
            </View>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastSenderRole === auth?.role ? "Sen: " : ""}{item.lastMessage}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  list: { padding: spacing.lg },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  emptyInner: { alignItems: "center", gap: spacing.sm },
  emptyText: { fontSize: 15, color: colors.textMuted },
  emptyHint: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)"
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: { flex: 1, justifyContent: "center" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  otherName: { fontSize: 16, fontWeight: "700", color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
  category: { fontSize: 12, color: colors.primaryDark, fontWeight: "600", marginBottom: 4 },
  lastMessage: { fontSize: 15, color: colors.textSecondary, fontStyle: "italic", lineHeight: 20 },
});
