import { colors, spacing, borderRadius, shadows } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "../../components/Map";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { apiFetch, ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast";
import { Category } from "../../api/types";

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "oto-servis": "car-sport-outline",
  "elektrik": "flash-outline",
  "tesisat": "water-outline",
  "boya-badana": "color-palette-outline",
  "temizlik": "sparkles-outline",
  "tamirat": "hammer-outline",
  "nakliyat": "cube-outline",
  "bahce": "leaf-outline",
  "kilit": "lock-closed-outline",
  "kamera": "videocam-outline",
  "kombi": "thermometer-outline",
  "cam": "square-outline",
  "mobilya": "bed-outline",
  "diger": "construct-outline",
};

function categoryIcon(slug: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICONS[slug] ?? "construct-outline";
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.stepDot, i <= current && styles.stepDotActive]} />
      ))}
    </View>
  );
}

export default function CreateRequestScreen() {
  const { auth } = useAuth();
  const toast = useToast();
  const route = useRoute<RouteProp<Record<string, { categoryId?: string, targetProviderId?: string, targetProviderName?: string }>, string>>();
  const preselectedCategoryId = route.params?.categoryId;
  const targetProviderId = route.params?.targetProviderId;
  const targetProviderName = route.params?.targetProviderName;

  const [step, setStep] = useState(preselectedCategoryId ? 1 : 0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [categoryId, setCategoryId] = useState(preselectedCategoryId ?? "");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState<"EUR" | "MKD">("EUR");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Map state (Default to Skopje)
  const [location, setLocation] = useState({
    latitude: 42.0,
    longitude: 21.43,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    if (route.params?.categoryId) {
      setCategoryId(route.params.categoryId);
      setStep(1);
    }
  }, [route.params?.categoryId]);

  useEffect(() => {
    apiFetch<Category[]>("/api/categories")
      .then(setCategories)
      .catch(() => {})
      .finally(() => setCatsLoading(false));

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  async function handleSubmit() {
    if (!description.trim()) return Alert.alert("Hata", "Lütfen iş detayını açıkla.");
    setSubmitting(true);
    try {
      const body: Record<string, any> = {
        categoryId,
        description: description.trim(),
        budget: budget ? Number(budget) : undefined,
        currency,
        address: address.trim() || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        targetProviderId,
      };
      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
      if (photoUrl) body.photoUrls = [`${apiUrl}${photoUrl}`];
      await apiFetch("/api/requests", {
        method: "POST",
        token: auth?.token,
        body,
      });
      toast.show({ message: targetProviderId ? "Özel iş isteği gönderildi!" : "Talep oluşturuldu! Ustalar teklif verecek." });
      setStep(0);
      setCategoryId("");
      setDescription("");
      setBudget("");
      setAddress("");
      setPhotoUrl(null);
    } catch (e: any) {
      toast.show({ message: e instanceof ApiError ? e.message : "Bir şey yanlış gitti.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", {
        uri: result.assets[0].uri,
        type: "image/jpeg",
        name: "photo.jpg",
      } as any);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/upload/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth?.token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setPhotoUrl(data.url);
      toast.show({ message: "Fotoğraf yüklendi." });
    } catch (e: any) {
      toast.show({ message: "Fotoğraf yüklenemedi.", type: "error" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);

  if (step === 0) {
    return (
      <View style={styles.container}>
        <StepIndicator current={0} total={2} />
        <View style={styles.headingRow}>
          <Ionicons name="search" size={24} color={colors.primary} />
          <Text style={styles.heading}>Hangi hizmete ihtiyacın var?</Text>
        </View>
        <Text style={styles.subheading}>Bir kategori seçerek başla</Text>

        {catsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.categoryList}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((cat) => {
              const active = categoryId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.categoryCard, active && styles.categoryCardActive]}
                  onPress={() => { setCategoryId(cat.id); setStep(1); }}
                >
                  <View style={[styles.catIconWrap, active && styles.catIconWrapActive]}>
                    <Ionicons
                      name={categoryIcon(cat.slug)}
                      size={22}
                      color={active ? "#fff" : colors.primary}
                    />
                  </View>
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                    {cat.nameTr}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={active ? colors.primary : colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.formContent}>
        <StepIndicator current={1} total={2} />

        <Pressable onPress={() => setStep(0)} style={styles.backLink}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.backText}>{selectedCategory?.nameTr ?? "Kategori"} değiştir</Text>
        </Pressable>

        <View style={styles.headingRow}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
          <Text style={styles.heading}>İş detaylarını anlat</Text>
        </View>

        {targetProviderName && (
          <View style={styles.directRequestBanner}>
            <Ionicons name="star" size={18} color="#fff" />
            <Text style={styles.directRequestBannerText}>Bu talep doğrudan {targetProviderName} ustaya gönderilecek.</Text>
          </View>
        )}

        <View style={styles.selectedCatBadge}>
          <Ionicons
            name={categoryIcon(selectedCategory?.slug ?? "")}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.selectedCatText}>{selectedCategory?.nameTr}</Text>
        </View>

        <Text style={styles.label}>Ne yapılmasını istiyorsun? *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Örn: 2015 Hyundai i20'nin ön fren balataları değişecek..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Konum (Haritadan Seç)</Text>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={location}
            onRegionChangeComplete={(reg) => setLocation(reg)}
          >
            <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />
          </MapView>
          <View style={styles.mapOverlay} pointerEvents="none">
            <Ionicons name="location" size={40} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.sectionHint}>Haritayı kaydırarak pini doğru konuma getir.</Text>

        <View style={styles.budgetHeader}>
          <Text style={styles.label}>Bütçen (isteğe bağlı)</Text>
          <View style={styles.currencyToggle}>
            <Pressable 
              style={[styles.currencyBtn, currency === "EUR" && styles.currencyBtnActive]}
              onPress={() => setCurrency("EUR")}
            >
              <Text style={[styles.currencyText, currency === "EUR" && styles.currencyTextActive]}>€ EUR</Text>
            </Pressable>
            <Pressable 
              style={[styles.currencyBtn, currency === "MKD" && styles.currencyBtnActive]}
              onPress={() => setCurrency("MKD")}
            >
              <Text style={[styles.currencyText, currency === "MKD" && styles.currencyTextActive]}>MKD</Text>
            </Pressable>
          </View>
        </View>
        <TextInput
          style={styles.input}
          placeholder={`Örn: ${currency === "EUR" ? "50" : "3000"}`}
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={budget}
          onChangeText={setBudget}
        />

        <Text style={styles.label}>Adres Detayı (isteğe bağlı)</Text>
        <TextInput
          style={styles.input}
          placeholder="Kat, daire veya detaylı tarif"
          placeholderTextColor={colors.textMuted}
          value={address}
          onChangeText={setAddress}
        />

        <Pressable style={styles.photoButton} onPress={pickPhoto} disabled={uploadingPhoto}>
          {uploadingPhoto ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={styles.photoButtonText}>{photoUrl ? "Fotoğraf Değiştir" : "Fotoğraf Ekle"}</Text>
            </>
          )}
        </Pressable>
        {photoUrl && (
          <Image
            source={{ uri: `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}${photoUrl}` }}
            style={styles.photoPreview}
          />
        )}

        <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitText}>Talebi Oluştur</Text>
            </>
          )}
        </Pressable>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  formContent: { padding: spacing.xl },

  stepRow: { flexDirection: "row", gap: spacing.sm, justifyContent: "center", marginVertical: spacing.xl },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  stepDotActive: { backgroundColor: colors.primary, width: 28 },

  headingRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  heading: { fontSize: 22, fontWeight: "bold", color: colors.text, flex: 1 },
  subheading: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xxl, marginLeft: 40 },

  backLink: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xl },
  backText: { fontSize: 15, color: colors.primary, fontWeight: "500" },

  selectedCatBadge: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginBottom: spacing.xl,
  },
  selectedCatText: { fontSize: 14, fontWeight: "600", color: colors.primary },
  
  directRequestBanner: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  directRequestBannerText: { color: "#fff", fontWeight: "600", fontSize: 14, flex: 1 },

  sectionHint: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl, fontStyle: "italic" },

  mapContainer: {
    height: 200,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    marginTop: spacing.xs,
    position: "relative",
    ...shadows.md,
  },
  map: { flex: 1 },
  mapOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -40, // Pin points to center
  },

  photoButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    borderWidth: 2, borderColor: colors.primary, borderStyle: "dashed",
    borderRadius: borderRadius.md, paddingVertical: 14, marginBottom: spacing.md,
    backgroundColor: colors.primaryLight,
  },
  photoButtonText: { fontSize: 15, fontWeight: "600", color: colors.primaryDark },
  photoPreview: { width: "100%", height: 180, borderRadius: borderRadius.md, marginBottom: spacing.lg, ...shadows.sm },

  budgetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  currencyToggle: { flexDirection: "row", backgroundColor: colors.border, borderRadius: borderRadius.full, padding: 2 },
  currencyBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full },
  currencyBtnActive: { backgroundColor: colors.primary, ...shadows.sm },
  currencyText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  currencyTextActive: { color: "#fff" },

  label: { fontSize: 15, fontWeight: "600", marginBottom: spacing.sm, color: colors.text },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  textArea: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    minHeight: 120,
    textAlignVertical: "top",
    ...shadows.sm,
  },

  categoryList: { gap: spacing.md, paddingBottom: 40, paddingHorizontal: spacing.xl },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...shadows.sm,
  },
  categoryCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight, ...shadows.md },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  catIconWrapActive: { backgroundColor: colors.primary },
  categoryText: { fontSize: 17, fontWeight: "600", color: colors.text, flex: 1 },
  categoryTextActive: { color: colors.primaryDark },

  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.xl,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.lg,
  },
  submitText: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.5 },
});

