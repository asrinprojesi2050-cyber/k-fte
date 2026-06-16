import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors, spacing, borderRadius } from "../theme";

export function SkeletonLine({ width = "100%", height = 14 }: { width?: number | string; height?: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[styles.line, { width: width as any, height, opacity }]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonLine width="30%" height={12} />
        <SkeletonLine width={50} height={20} />
      </View>
      <View style={{ gap: 8, marginBottom: 8 }}>
        <SkeletonLine width="100%" height={14} />
        <SkeletonLine width="80%" height={14} />
      </View>
      <View style={styles.cardFooter}>
        <SkeletonLine width="40%" height={12} />
        <SkeletonLine width={60} height={12} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  line: { backgroundColor: colors.border, borderRadius: 4 },
});
