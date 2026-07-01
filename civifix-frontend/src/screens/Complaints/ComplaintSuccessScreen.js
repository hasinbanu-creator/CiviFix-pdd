import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, BackHandler } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";

const ComplaintSuccessScreen = ({ route, navigation }) => {
  const { complaint } = route.params;
  const complaintId = complaint?.complaint_id || complaint?._id || "—";
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Prevent going back to form/preview
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.navigate("Dashboard");
      return true;
    });

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Icon name="check-decagram" size={80} color="#059669" />
        </Animated.View>

        <Text style={styles.title}>Complaint Submitted!</Text>
        <Text style={styles.subtitle}>Your complaint has been registered successfully.</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Complaint ID</Text>
            <Text style={styles.infoValue}>{complaintId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, { color: "#D97706" }]}>Pending Review</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Next Step</Text>
            <Text style={styles.infoValue}>Assigning to Inspector</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionCard}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => navigation.navigate("ComplaintDetail", { complaint })}
        >
          <Text style={styles.primaryBtnText}>View Complaint</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={() => navigation.replace("CreateComplaint")}
        >
          <Text style={styles.secondaryBtnText}>Create Another</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.outlineBtn} 
          onPress={() => navigation.navigate("Dashboard")}
        >
          <Text style={styles.outlineBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.xl },
  iconContainer: { marginBottom: SPACING.lg },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.textDark, marginBottom: SPACING.sm },
  subtitle: { fontSize: FONT_SIZES.base, color: COLORS.textLight, textAlign: "center", marginBottom: SPACING.xxl },
  
  infoCard: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, width: "100%", ...SHADOWS.md,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: SPACING.sm },
  infoLabel: { fontSize: FONT_SIZES.base, color: COLORS.textGray, fontWeight: "500" },
  infoValue: { fontSize: FONT_SIZES.base, color: COLORS.textDark, fontWeight: "700" },
  divider: { height: 1, backgroundColor: COLORS.border },

  actionCard: {
    backgroundColor: COLORS.card, padding: SPACING.xl,
    borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: BORDER_RADIUS.md, alignItems: "center", marginBottom: SPACING.md,
  },
  primaryBtnText: { color: COLORS.card, fontWeight: "700", fontSize: FONT_SIZES.md },
  secondaryBtn: {
    backgroundColor: `${COLORS.primary}15`, paddingVertical: 16,
    borderRadius: BORDER_RADIUS.md, alignItems: "center", marginBottom: SPACING.md,
  },
  secondaryBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: FONT_SIZES.md },
  outlineBtn: {
    paddingVertical: 16, alignItems: "center",
  },
  outlineBtnText: { color: COLORS.textGray, fontWeight: "700", fontSize: FONT_SIZES.md },
});

export default ComplaintSuccessScreen;
