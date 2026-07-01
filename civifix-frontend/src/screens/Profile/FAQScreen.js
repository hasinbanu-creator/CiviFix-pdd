import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, UIManager, Platform } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import Screen from "../../components/Screen";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    question: "How do I raise a complaint?",
    answer: "Tap on the '+' button in the bottom navigation bar or on the dashboard. Fill out the details, attach a photo if possible, select the exact location, and submit."
  },
  {
    question: "Can I track my complaint status?",
    answer: "Yes, you can track the status of your complaints in the 'Status' tab. We also send you notifications when the status changes."
  },
  {
    question: "How long does it take to resolve an issue?",
    answer: "Resolution time varies based on the priority and category of the complaint. Urgent issues like water supply are typically addressed within 24 hours."
  },
  {
    question: "What happens if my complaint is rejected?",
    answer: "If a complaint is rejected, the reason will be provided in the complaint details. You can reopen the complaint or raise a new one if you believe it was an error."
  }
];

const FAQItem = ({ faq }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.questionRow} onPress={toggleExpand} activeOpacity={0.7}>
        <Text style={styles.questionText}>{faq.question}</Text>
        <Icon name={expanded ? "chevron-up" : "chevron-down"} size={24} color={COLORS.textGray} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.answerRow}>
          <Text style={styles.answerText}>{faq.answer}</Text>
        </View>
      )}
    </View>
  );
};

const FAQScreen = ({ navigation }) => {
  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & FAQs</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.card}>
          {FAQS.map((faq, idx) => (
            <React.Fragment key={idx}>
              <FAQItem faq={faq} />
              {idx < FAQS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.supportBox}>
          <Icon name="headset" size={40} color={COLORS.primary} style={styles.supportIcon} />
          <Text style={styles.supportTitle}>Still need help?</Text>
          <Text style={styles.supportSub}>Our support team is here for you.</Text>
          <TouchableOpacity 
            style={styles.supportBtn}
            onPress={() => navigation.navigate("ContactSupport")}
          >
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    fontSize: FONT_SIZES.lg, fontWeight: "700", color: COLORS.textDark,
    marginBottom: SPACING.md, marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, ...SHADOWS.sm,
    marginBottom: SPACING.xl,
  },
  faqItem: { padding: SPACING.lg },
  questionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  questionText: { fontSize: FONT_SIZES.base, fontWeight: "600", color: COLORS.textDark, flex: 1, paddingRight: SPACING.md },
  answerRow: { marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  answerText: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, lineHeight: 22 },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.lg },
  
  supportBox: {
    backgroundColor: `${COLORS.primary}10`, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl, alignItems: "center", marginTop: SPACING.md,
  },
  supportIcon: { marginBottom: SPACING.md },
  supportTitle: { fontSize: FONT_SIZES.lg, fontWeight: "700", color: COLORS.primary, marginBottom: SPACING.xs },
  supportSub: { fontSize: FONT_SIZES.sm, color: COLORS.textLight, textAlign: "center", marginBottom: SPACING.lg },
  supportBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md, width: '100%', alignItems: 'center'
  },
  supportBtnText: { color: COLORS.card, fontWeight: "700", fontSize: FONT_SIZES.base },
});

export default FAQScreen;
