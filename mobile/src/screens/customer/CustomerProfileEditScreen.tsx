import { colors, spacing, borderRadius } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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
import { apiFetch } from "../../api/client";
import * as ImagePicker from "expo-image-picker";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function CustomerProfileEditScreen() {
  const { auth, updateUser } = useAuth();
  const navigation = useNavigation();
  const user = auth?.user;

  const [name, setName] = useState(user?.name ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoUrl ?? null);
  const [submitting, setSubmitting] = useState(false);

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
    if (name.trim()) body.name = name.trim();
    if (photoUrl) body.photoUrl = `${API_URL}${photoUrl}`;

    setSubmitting(true);
    try {
      const updated = await apiFetch<any>("/api/customers/me", { method: "PATCH", token: auth?.token, body });
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
            <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
            <Text style={styles.photoPlaceholderText}>Fotoğraf Yükle</Text>
          </View>
        )}
      </Pressable>

      <Text style={styles.label}>Ad Soyad</Text>
      <TextInput
        style={styles.input}
        placeholder="Adınız"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  photoArea: { alignItems: "center", marginBottom: spacing.lg },
  photo: { width: 120, height: 120, borderRadius: 60 },
  photoPlaceholder: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: colors.card,
    justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.border, borderStyle: "dashed",
  },
  photoPlaceholderText: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: spacing.sm, marginTop: spacing.lg },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  saveButton: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 16, alignItems: "center", marginTop: spacing.xl },
  saveButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
