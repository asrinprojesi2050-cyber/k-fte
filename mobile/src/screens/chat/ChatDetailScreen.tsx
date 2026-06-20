import { colors, spacing, borderRadius } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { fetchMessages, sendMessage, Message } from "../../api/chat";
import { useSocket } from "../../context/SocketContext";

export default function ChatDetailScreen() {
  const { auth } = useAuth();
  const { socket, connected } = useSocket();
  const route = useRoute<RouteProp<Record<string, { requestId: string; otherName: string }>, string>>();
  const { requestId, otherName } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const prevCount = useRef(0);

  const loadMessages = useCallback(async (isBackground = false) => {
    if (isBackground) setRefreshing(true);
    try {
      const data = await fetchMessages(requestId, auth?.token);
      if (data.messages.length !== prevCount.current) {
        setMessages(data.messages);
        prevCount.current = data.messages.length;
      }
    } catch {} finally {
      if (isBackground) setRefreshing(false);
      setLoading(false);
    }
  }, [requestId, auth?.token]);

  useEffect(() => {
    loadMessages();

    if (!socket || !connected) return;

    socket.emit("join_request_room", requestId);

    const handleReceive = (msg: Message) => {
      setMessages((prev) => {
        // Prevent duplicate messages if we just sent it
        if (prev.some((m) => m.id === msg.id || (m.text === msg.text && m.senderId === msg.senderId && Date.now() - new Date(m.createdAt).getTime() < 2000))) {
          return prev;
        }
        return [...prev, msg];
      });
      prevCount.current += 1;
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    };

    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.emit("leave_request_room", requestId);
    };
  }, [loadMessages, requestId, socket, connected]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  async function handleSend() {
    if (!input.trim()) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    try {
      const sent = await sendMessage(requestId, text, auth?.token);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        prevCount.current += 1;
        return [...prev, sent];
      });
      // We don't need to emit send_message anymore, because chat.routes.ts handles it
      // But we can if we want immediate local broadcast before REST responds.
      // However, we changed backend to emit after DB save, so it's safer to rely on REST response.

      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {} finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatRef}
        style={styles.list}
        contentContainerStyle={messages.length === 0 ? styles.listEmpty : styles.listContent}
        data={messages}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={refreshing ? <Text style={styles.pollIndicator}>Yenileniyor...</Text> : null}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>{otherName} ile sohbet başlatın.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMe = item.senderRole === auth?.role;
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
              <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
                {item.text}
              </Text>
              <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
                {new Date(item.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Mesaj yaz..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
        />
        <Pressable style={styles.sendButton} onPress={handleSend} disabled={sending || !input.trim()}>
          {sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  list: { flex: 1 },
  listContent: { padding: spacing.lg, paddingBottom: spacing.sm },
  listEmpty: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  emptyChat: { alignItems: "center", gap: spacing.md },
  emptyText: { fontSize: 15, color: colors.textMuted },
  bubble: { maxWidth: "80%", marginBottom: spacing.md, borderRadius: borderRadius.lg, padding: spacing.md },
  bubbleMe: { backgroundColor: colors.primary, alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleOther: {
    backgroundColor: colors.card,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTextMe: { color: "#fff" },
  msgTextOther: { color: colors.text },
  msgTime: { fontSize: 11, marginTop: 4 },
  msgTimeMe: { color: "rgba(255,255,255,0.7)", textAlign: "right" },
  msgTimeOther: { color: colors.textMuted, textAlign: "right" },
  pollIndicator: { textAlign: "center", fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  inputBar: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: colors.text,
    backgroundColor: colors.background,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});
