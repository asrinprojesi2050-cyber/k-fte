import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, borderRadius } from "../theme";

export const Marker = (props: any) => null;

export default function MapView(props: any) {
  return (
    <View style={[styles.container, props.style]}>
      <Text style={styles.text}>Harita özelliği (react-native-maps) Web sürümünde desteklenmiyor.</Text>
      <Text style={styles.subtext}>Lütfen mobil cihazınızdan veya emülatörden test edin.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 20,
  },
  text: {
    color: colors.textSecondary,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtext: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 12,
  }
});
