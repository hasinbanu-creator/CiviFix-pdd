import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import Screen from "../../components/Screen";
import Button from "../../components/Button";

const ContactMethod = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.methodCard} activeOpacity={0.8} onPress={onPress}>
    <View style={styles.methodIcon}>
      <Icon name={icon} size={24} color={COLORS.primary} />
    </View>
    <View style={styles.methodInfo}>
      <Text style={styles.methodTitle}>{title}</Text>
      <Text style={styles.methodSubtitle}>{subtitle}</Text>
    </View>
    <Icon name="chevron-right" size={24} color={COLORS.textGray} />
  </TouchableOpacity>
);

const ContactSupportScreen = ({ navigation }) => {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      alert("Message sent! Support will get back to you soon.");
      navigation.goBack();
    }, 1500);
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          
          <ContactMethod 
            icon="email-outline"
            title="Email Support"
            subtitle="civifix.support@gmail.com"
            onPress={() => {}}
          />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Send us a Message</Text>
          <View style={styles.formCard}>
            <Text style={styles.label}>How can we help you?</Text>
            <TextInput
              style={styles.input}
              placeholder="Describe your issue or question in detail..."
              placeholderTextColor={COLORS.textGray}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Button 
              title={submitting ? "Sending..." : "Send Message"} 
              onPress={handleSend}
              disabled={submitting || !message.trim()}
              loading={submitting}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", alignItems: "center", padding: SPACING.xl,
    backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  backButton: { marginRight: SPACING.md },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: "700", color: COLORS.textDark },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  sectionTitle: {
    fontSize: FONT_SIZES.base, fontWeight: "700", color: COLORS.textDark,
    marginBottom: SPACING.md, marginTop: SPACING.md, marginLeft: SPACING.xs,
  },
  methodCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card,
    padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  methodIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: `${COLORS.primary}15`,
    alignItems: "center", justifyContent: "center", marginRight: SPACING.md,
  },
  methodInfo: { flex: 1 },
  methodTitle: { fontSize: FONT_SIZES.base, fontWeight: "600", color: COLORS.textDark, marginBottom: 2 },
  methodSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textLight },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.lg },
  
  formCard: {
    backgroundColor: COLORS.card, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  label: { fontSize: FONT_SIZES.sm, fontWeight: "600", color: COLORS.textDark, marginBottom: SPACING.sm },
  input: {
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZES.base,
    color: COLORS.textDark, minHeight: 120,
  },
  submitBtn: { marginTop: SPACING.lg },
});

export default ContactSupportScreen;
