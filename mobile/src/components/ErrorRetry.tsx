import { colors, spacing, borderRadius } from "../theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  message?: string;
  onRetry: () => void;
}

export default function ErrorRetry({ message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
      <Text style={styles.message}>{message ?? "Bir şey yanlış gitti."}</Text>
      <Pressable style={styles.button} onPress={onRetry}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.buttonText}>Tekrar Dene</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, gap: spacing.md, padding: spacing.xl },
  message: { fontSize: 15, color: colors.textSecondary, textAlign: "center" },
  button: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 12, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
