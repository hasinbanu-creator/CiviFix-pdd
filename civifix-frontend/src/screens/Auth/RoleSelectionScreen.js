import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import Screen from "../../components/Screen";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

const roles = [
  {
    id: "CITIZEN",
    title: "Citizen",
    description: "Report issues and track their progress.",
    icon: "account-outline",
    color: COLORS.primary,
  },
  {
    id: "INSPECTOR",
    title: "Inspector",
    description: "Review assigned complaints and update status.",
    icon: "clipboard-check-outline",
    color: COLORS.secondary,
  },
  {
    id: "ADMIN",
    title: "Admin",
    description: "Manage users, wards, and view analytics.",
    icon: "shield-account-outline",
    color: COLORS.accent,
  },
];

const RoleSelectionScreen = ({ navigation }) => {
  const handleSelectRole = (roleId) => {
    // For now, we will navigate to login, and maybe pass the role if needed by the backend.
    // The backend uses email for login, so role might just be for UI context or specific register flows.
    // Let's pass the role to Login just in case.
    navigation.navigate("Login", { role: roleId });
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>
          Select how you want to use the CiviFix platform today.
        </Text>
      </View>

      <View style={styles.rolesContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={styles.roleCard}
            activeOpacity={0.8}
            onPress={() => handleSelectRole(role.id)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${role.color}15` }]}>
              <Icon name={role.icon} size={32} color={role.color} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </View>
            <Icon name="chevron-right" size={24} color={COLORS.textGray} />
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textLight,
    lineHeight: 24,
  },
  rolesContainer: {
    gap: SPACING.lg,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.lg,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
});

export default RoleSelectionScreen;
