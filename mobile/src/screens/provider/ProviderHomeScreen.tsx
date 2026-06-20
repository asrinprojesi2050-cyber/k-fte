import { colors, spacing, borderRadius, shadows } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState, useRef } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "../../components/Map";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { apiFetch } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { ProviderHomeStackParamList } from "../../navigation/types";
import ErrorRetry from "../../components/ErrorRetry";
import { SkeletonList } from "../../components/Skeleton";
import { formatCurrency } from "../../utils/currency";

interface NearbyRequest {
  id: string;
  description: string;
  budget: number | null;
  currency: string;
  distanceKm: number | null;
  createdAt: string;
  customer: { name: string };
  category: { nameTr: string };
  latitude: number;
  longitude: number;
}

type Nav = NativeStackNavigationProp<ProviderHomeStackParamList, "ProviderHomeList">;

export default function ProviderHomeScreen() {
  const { auth } = useAuth();
  const navigation = useNavigation<Nav>();
  const [requests, setRequests] = useState<NearbyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const mapRef = useRef<MapView>(null);

  const pUser = auth?.user as any;
  const hasLocation = pUser?.latitude != null && pUser?.longitude != null;

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLocationError(false);
    setFetchError(false);
    try {
      const data = await apiFetch<NearbyRequest[]>("/api/requests/nearby?radiusKm=50", { token: auth?.token });
      setRequests(data);
      
      // Auto-fit map to markers if there are any
      if (data.length > 0 && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(
            data.map(r => ({ latitude: r.latitude, longitude: r.longitude })),
            { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true }
          );
        }, 500);
      }
    } catch (e: any) {
      if (e?.status === 400) setLocationError(true);
      else setFetchError(true);
    }
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [auth?.token]);

  useFocusEffect(useCallback(() => { fetchRequests(); }, [fetchRequests]));

  if (loading) {
    return <SkeletonList />;
  }

  if (fetchError) {
    return <ErrorRetry message="Talepler yüklenemedi." onRetry={() => fetchRequests()} />;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={requests.length === 0 && !locationError ? styles.empty : styles.list}
      data={requests}
      keyExtractor={(r) => r.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRequests(true)} colors={[colors.primary]} />}
      ListHeaderComponent={
        <>
          <Text style={styles.heading}>Yakındaki Talepler</Text>
          
          {hasLocation && !locationError && requests.length > 0 && (
            <View style={styles.mapContainer}>
              <MapView 
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: pUser.latitude,
                  longitude: pUser.longitude,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
              >
                <Marker 
                  coordinate={{ latitude: pUser.latitude, longitude: pUser.longitude }} 
                  pinColor="blue"
                  title="Senin Konumun"
                />
                {requests.map(req => (
                  <Marker 
                    key={req.id}
                    coordinate={{ latitude: req.latitude, longitude: req.longitude }}
                    pinColor={colors.primary}
                    title={req.category.nameTr}
                    description={`${req.distanceKm?.toFixed(1)} km uzaklıkta`}
                    onCalloutPress={() => navigation.navigate("RequestDetail", { requestId: req.id })}
                  />
                ))}
              </MapView>
            </View>
          )}

          {locationError && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={22} color="#fff" />
              <View style={styles.warningBody}>
                <Text style={styles.warningTitle}>Konum ayarlanmamış</Text>
                <Text style={styles.warningText}>Yakındaki talepleri görmek için profiline konum ekle.</Text>
                <Pressable
                  style={styles.warningButton}
                  onPress={() => (navigation as any).getParent()?.navigate("ProviderProfileStack", { screen: "ProviderProfileEdit" })}
                >
                  <Text style={styles.warningButtonText}>Profili Düzenle</Text>
                </Pressable>
              </View>
            </View>
          )}
          {!hasLocation && !locationError && (
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.infoBannerText}>Konum eklemek için profilini düzenle</Text>
            </View>
          )}
        </>
      }
      ListEmptyComponent={
        locationError ? null : (
          <View style={styles.emptyInner}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Yakında açık talep yok.</Text>
          </View>
        )
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate("RequestDetail", { requestId: item.id })}
        >
          <View style={styles.cardHeader}>
            <View style={styles.catWrap}>
              <Ionicons name="build" size={14} color={colors.primaryDark} />
              <Text style={styles.category}>{item.category.nameTr}</Text>
            </View>
            {item.distanceKm != null && (
              <View style={styles.distWrap}>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.distance}>{item.distanceKm.toFixed(1)} km</Text>
              </View>
            )}
          </View>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.customerWrap}>
              <Ionicons name="person-circle-outline" size={16} color={colors.textMuted} />
              <Text style={styles.customer}>{item.customer?.name ?? "Müşteri"}</Text>
            </View>
            {item.budget ? (
              <View style={styles.budgetWrap}>
                <Text style={styles.budget}>{formatCurrency(item.budget, item.currency)}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 40 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  emptyInner: { alignItems: "center", gap: spacing.md },
  emptyText: { fontSize: 15, color: colors.textMuted },
  heading: { fontSize: 24, fontWeight: "bold", color: colors.text, marginBottom: spacing.lg, letterSpacing: -0.5 },

  mapContainer: {
    height: 220,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  map: { flex: 1 },

  warningBanner: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  warningBody: { flex: 1 },
  warningTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  warningText: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginBottom: spacing.md },
  warningButton: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: borderRadius.full, paddingVertical: 8, paddingHorizontal: 16, alignSelf: "flex-start" },
  warningButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  infoBannerText: { fontSize: 14, color: colors.primaryDark, flex: 1, fontWeight: "500" },

  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  catWrap: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  category: { fontSize: 13, fontWeight: "700", color: colors.primaryDark },
  distWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  distance: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
  
  description: { fontSize: 16, color: colors.text, marginBottom: spacing.lg, lineHeight: 22 },
  
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  customerWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  customer: { fontSize: 14, color: colors.textSecondary, fontWeight: "500" },
  budgetWrap: { backgroundColor: colors.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  budget: { fontSize: 14, fontWeight: "700", color: colors.success },
});

