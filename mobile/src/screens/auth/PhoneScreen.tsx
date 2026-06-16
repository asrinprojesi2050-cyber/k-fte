import { colors, spacing, borderRadius } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { requestOtp } from "../../api/auth";
import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Phone">;

export default function PhoneScreen({ route, navigation }: Props) {
  const { role } = route.params;
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (phone.trim().length < 6) {
      setError("Geçerli bir telefon numarası girin");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone.trim());
      navigation.navigate("Otp", { role, phone: phone.trim() });
    } catch (err) {
      setError("Kod gönderilemedi, tekrar deneyin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Ionicons name="phone-portrait-outline" size={40} color={colors.primary} style={{ marginBottom: spacing.lg }} />
      <Text style={styles.title}>Telefon numaran</Text>
      <Text style={styles.subtitle}>
        {role === "customer" ? "Müşteri" : "Usta"} girişi için telefon numaranı doğrulayalım.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="+389 7X XXX XXX"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        autoFocus
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleContinue} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kod Gönder</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xxl },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: 14, fontSize: 16, color: colors.text, backgroundColor: colors.card, marginBottom: spacing.md },
  error: { color: colors.error, fontSize: 14 },
  button: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.md },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
