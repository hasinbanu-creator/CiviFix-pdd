import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from "react-native";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import Screen from "../../components/Screen";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

const PreferenceItem = ({ icon, title, description, value, onValueChange }) => (
  <View style={styles.preferenceItem}>
    <View style={[styles.iconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
      <Icon name={icon} size={24} color={COLORS.primary} />
    </View>
    <View style={styles.preferenceContent}>
      <Text style={styles.preferenceTitle}>{title}</Text>
      <Text style={styles.preferenceDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: COLORS.border, true: COLORS.primary }}
      thumbColor={COLORS.card}
      ios_backgroundColor={COLORS.border}
    />
  </View>
);

const NotificationPreferencesScreen = ({ navigation }) => {
  // In a real app, you would load these from backend/context
  const [preferences, setPreferences] = useState({
    push: true,
    email: true,
    sms: false,
    complaintUpdates: true,
    promotions: false,
  });

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    // Here you would also sync with backend via react-query mutation
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Notification Settings</Text>
          <Text style={styles.subtitle}>Manage how we contact you</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Methods</Text>
          <View style={styles.card}>
            <PreferenceItem
              icon="cellphone-message"
              title="Push Notifications"
              description="Receive alerts on your device"
              value={preferences.push}
              onValueChange={() => togglePreference("push")}
            />
            <View style={styles.divider} />
            <PreferenceItem
              icon="email-outline"
              title="Email Notifications"
              description="Receive detailed emails"
              value={preferences.email}
              onValueChange={() => togglePreference("email")}
            />
            <View style={styles.divider} />
            <PreferenceItem
              icon="message-text-outline"
              title="SMS Alerts"
              description="Text messages for urgent updates"
              value={preferences.sms}
              onValueChange={() => togglePreference("sms")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <View style={styles.card}>
            <PreferenceItem
              icon="clipboard-text-outline"
              title="Complaint Updates"
              description="Status changes and resolution notes"
              value={preferences.complaintUpdates}
              onValueChange={() => togglePreference("complaintUpdates")}
            />
            <View style={styles.divider} />
            <PreferenceItem
              icon="star-outline"
              title="Announcements"
              description="News and platform updates"
              value={preferences.promotions}
              onValueChange={() => togglePreference("promotions")}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.xl,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  preferenceContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  preferenceTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 76,
  },
});

export default NotificationPreferencesScreen;