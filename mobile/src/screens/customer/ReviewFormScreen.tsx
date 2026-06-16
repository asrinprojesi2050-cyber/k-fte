import { colors, spacing, borderRadius } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast";
import { createReview } from "../../api/jobs";

export default function ReviewFormScreen() {
  const { auth } = useAuth();
  const toast = useToast();
  const route = useRoute<RouteProp<Record<string, { jobId: string; providerName: string }>, string>>();
  const navigation = useNavigation();
  const { jobId, providerName } = route.params;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) return Alert.alert("Hata", "Lütfen bir puan seç.");
    setSubmitting(true);
    try {
      await createReview({ jobId, rating, comment: comment.trim() || undefined }, auth?.token);
      toast.show({ message: "Değerlendirmen kaydedildi!" });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Bir şey yanlış gitti.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.providerRow}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>
        <Text style={styles.providerName}>{providerName}</Text>
      </View>

      <Text style={styles.label}>Puanın</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Ionicons name={n <= rating ? "star" : "star-outline"} size={44} color={n <= rating ? "#f1c40f" : colors.border} />
          </Pressable>
        ))}
      </View>
      {rating > 0 && <Text style={styles.ratingLabel}>{["", "Kötü", "Orta", "İyi", "Çok İyi", "Mükemmel"][rating]}</Text>}

      <Text style={styles.label}>Yorumun (isteğe bağlı)</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Deneyimini paylaş..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={4}
        value={comment}
        onChangeText={setComment}
      />

      <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Gönder</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  providerRow: { alignItems: "center", marginBottom: spacing.xxl },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, justifyContent: "center", alignItems: "center", marginBottom: spacing.md },
  providerName: { fontSize: 20, fontWeight: "bold", color: colors.text },
  label: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: spacing.md, marginTop: spacing.lg },
  stars: { flexDirection: "row", gap: spacing.xs, justifyContent: "center" },
  ratingLabel: { textAlign: "center", fontSize: 15, color: colors.primary, fontWeight: "600", marginTop: spacing.sm },
  textArea: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border, minHeight: 100, textAlignVertical: "top" },
  submitButton: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 16, alignItems: "center", marginTop: spacing.xxl },
  submitButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
