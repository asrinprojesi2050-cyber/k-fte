import { colors, spacing, borderRadius, shadows } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { updateProviderProfile } from "../../api/jobs";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "../../components/Map";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function ProviderProfileEditScreen() {
  const { auth, updateUser } = useAuth();
  const navigation = useNavigation();
  const user = auth?.user as any;

  const [bio, setBio] = useState(user?.bio ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoUrl ?? null);
  const [submitting, setSubmitting] = useState(false);
  
  const initialLat = user?.latitude ? Number(user.latitude) : 42.0;
  const initialLng = user?.longitude ? Number(user.longitude) : 21.43;

  const [location, setLocation] = useState({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    // If the user doesn't have a location set, try to get current location
    if (!user?.latitude || !user?.longitude) {
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
    }
  }, [user]);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: false,
    });
    if (result.canceled || !result.assets[0]) return;

    const form = new FormData();
    const file = result.assets[0];
    form.append("file", {
      uri: file.uri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);

    try {
      const res = await fetch(`${API_URL}/api/upload/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth?.token}` },
        body: form,
      });
      const data = await res.json();
      if (res.ok) setPhotoUrl(data.url);
      else Alert.alert("Hata", "Fotoğraf yüklenemedi.");
    } catch {
      Alert.alert("Hata", "Fotoğraf yüklenemedi.");
    }
  }

  async function handleSave() {
    const body: Record<string, any> = {};
    if (bio.trim()) body.bio = bio.trim();
    if (city.trim()) body.city = city.trim();
    if (photoUrl) body.photoUrl = `${API_URL}${photoUrl}`;
    
    // Always send the current map location
    body.latitude = location.latitude;
    body.longitude = location.longitude;

    setSubmitting(true);
    try {
      const updated = await updateProviderProfile(body, auth?.token);
      await updateUser(updated);
      Alert.alert("Başarılı", "Profil güncellendi.");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Bir şey yanlış gitti.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.photoArea} onPress={pickPhoto}>
        {photoUrl ? (
          <Image source={{ uri: `${API_URL}${photoUrl}` }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={32} color={colors.primary} />
            <Text style={styles.photoPlaceholderText}>Fotoğraf Yükle</Text>
          </View>
        )}
      </Pressable>

      <Text style={styles.label}>Hakkında</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Kendini tanıt..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={4}
        value={bio}
        onChangeText={setBio}
      />

      <Text style={styles.label}>Şehir</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn: Üsküp"
        placeholderTextColor={colors.textMuted}
        value={city}
        onChangeText={setCity}
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
      <Text style={styles.sectionHint}>Haritayı kaydırarak pini çalışma bölgende konumlandır. (Yakındaki talepleri görebilmek için gereklidir)</Text>

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 40 },
  photoArea: { alignItems: "center", marginBottom: spacing.xl },
  photo: { width: 120, height: 120, borderRadius: 60, ...shadows.md, borderWidth: 3, borderColor: colors.primaryLight },
  photoPlaceholder: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primaryLight,
    justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.primary, borderStyle: "dashed",
  },
  photoPlaceholderText: { fontSize: 13, color: colors.primaryDark, marginTop: spacing.xs, fontWeight: "600" },
  label: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: spacing.sm, marginTop: spacing.lg },
  sectionHint: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xs, fontStyle: "italic" },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, ...shadows.sm },
  textArea: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border, minHeight: 100, textAlignVertical: "top", marginBottom: spacing.md, ...shadows.sm },
  
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

  saveButton: { backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingVertical: 16, alignItems: "center", marginTop: spacing.xl, ...shadows.md },
  saveButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
