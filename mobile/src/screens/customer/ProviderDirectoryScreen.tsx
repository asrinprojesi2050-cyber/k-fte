import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, shadows } from "../../theme";
import { fetchProviders, Provider } from "../../api/providers";
import MapView, { Marker, Callout } from "../../components/Map";
import * as Location from "expo-location";

export default function ProviderDirectoryScreen() {
  const navigation = useNavigation<any>();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [location, setLocation] = useState({
    latitude: 42.0,
    longitude: 21.43,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    setLoading(true);
    fetchProviders()
      .then(setProviders)
      .catch(console.error)
      .finally(() => setLoading(false));

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    })();
  }, []);

  const renderProviderCard = ({ item }: { item: Provider }) => (
    <Pressable
      style={styles.providerCard}
      onPress={() => navigation.navigate("ProviderPublicProfile", { providerId: item.id })}
    >
      <View style={styles.providerAvatarWrap}>
        {item.photoUrl ? (
          <Image
            source={{ uri: `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"}${item.photoUrl}` }}
            style={styles.providerAvatar}
          />
        ) : (
          <Ionicons name="person" size={24} color={colors.primaryDark} />
        )}
      </View>
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>{item.name}</Text>
        <Text style={styles.providerCategory}>
          {item.category?.nameTr || "Usta"} - {item.city}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.statText}>{item.ratingAvg.toFixed(1)} Puan</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.statText}>{item.completedJobsCount} İş</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Toggle View Mode */}
      <View style={styles.toggleContainer}>
        <Pressable
          style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]}
          onPress={() => setViewMode("list")}
        >
          <Ionicons name="list" size={18} color={viewMode === "list" ? "#fff" : colors.primary} />
          <Text style={[styles.toggleText, viewMode === "list" && styles.toggleTextActive]}>Liste</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, viewMode === "map" && styles.toggleBtnActive]}
          onPress={() => setViewMode("map")}
        >
          <Ionicons name="map" size={18} color={viewMode === "map" ? "#fff" : colors.primary} />
          <Text style={[styles.toggleText, viewMode === "map" && styles.toggleTextActive]}>Harita</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : viewMode === "list" ? (
        <FlatList
          data={providers}
          keyExtractor={(item) => item.id}
          renderItem={renderProviderCard}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <MapView style={styles.map} initialRegion={location} showsUserLocation>
          {providers.map((p) => {
            if (!p.latitude || !p.longitude) return null;
            return (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                onCalloutPress={() => navigation.navigate("ProviderPublicProfile", { providerId: p.id })}
              >
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutName}>{p.name}</Text>
                    <Text style={styles.calloutCat}>{p.category?.nameTr || "Usta"}</Text>
                    <Text style={styles.calloutRating}>⭐ {p.ratingAvg.toFixed(1)}</Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  toggleContainer: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
  },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: 15, fontWeight: "600", color: colors.primary },
  toggleTextActive: { color: "#fff" },

  listContent: { padding: spacing.md, paddingBottom: 40, gap: spacing.md },
  
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  providerAvatarWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: "center", alignItems: "center",
    marginRight: spacing.md, overflow: "hidden"
  },
  providerAvatar: { width: "100%", height: "100%" },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 2 },
  providerCategory: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xs },
  
  statsRow: { flexDirection: "row", gap: spacing.md },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },

  map: { flex: 1 },
  callout: { width: 140, padding: 4 },
  calloutName: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  calloutCat: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  calloutRating: { fontSize: 12, fontWeight: "600", color: colors.warning },
});
