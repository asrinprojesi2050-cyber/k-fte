import { colors, spacing, borderRadius } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { fetchCategories, verifyCustomerOtp, verifyProviderOtp } from "../../api/auth";
import { Category } from "../../api/types";
import { useAuth } from "../../context/AuthContext";
import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Otp">;

export default function OtpScreen({ route }: Props) {
  const { role, phone } = route.params;
  const { signIn } = useAuth();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role === "provider") {
      fetchCategories().then(setCategories).catch(() => setCategories([]));
    }
  }, [role]);

  async function handleVerify() {
    if (code.trim().length !== 6) {
      setError("6 haneli kodu girin");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (role === "customer") {
        const result = await verifyCustomerOtp(phone, code.trim(), name.trim() || undefined);
        await signIn(result);
      } else {
        const details =
          name.trim() && categoryId && city.trim()
            ? { name: name.trim(), categoryId, city: city.trim() }
            : undefined;
        const result = await verifyProviderOtp(phone, code.trim(), details);
        await signIn(result);
      }
    } catch (err) {
      setError("Kod hatalı veya bilgiler eksik. Yeni kullanıcıysan ad, kategori ve şehir gerekli.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Ionicons name="lock-closed-outline" size={40} color={colors.primary} style={{ marginBottom: spacing.md }} />
      <Text style={styles.title}>Doğrulama kodu</Text>
      <Text style={styles.subtitle}>{phone} numarasına gönderilen 6 haneli kodu gir.</Text>

      <TextInput
        style={styles.input}
        placeholder="123456"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        autoFocus
      />

      <Text style={styles.sectionLabel}>İlk kez giriş yapıyorsan:</Text>
      <TextInput style={styles.input} placeholder="Ad Soyad" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />

      {role === "provider" && (
        <>
          <TextInput style={styles.input} placeholder="Şehir (örn. Üsküp)" placeholderTextColor={colors.textMuted} value={city} onChangeText={setCity} />
          <Text style={styles.sectionLabel}>Kategori</Text>
          <View style={styles.chipRow}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.chip, categoryId === cat.id && styles.chipSelected]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextSelected]}>
                  {cat.nameTr}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Devam Et</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: "bold", color: colors.text },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xl },
  sectionLabel: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: 14, fontSize: 16, color: colors.text, backgroundColor: colors.card, marginBottom: spacing.md },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.full, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.card },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary },
  chipTextSelected: { color: "#fff" },
  error: { color: colors.error, marginTop: spacing.sm },
  button: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: "center", marginTop: spacing.lg },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
