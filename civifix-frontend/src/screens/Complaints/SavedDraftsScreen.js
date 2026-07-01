import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import Screen from "../../components/Screen";

const SavedDraftsScreen = ({ navigation }) => {
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const draftStr = await AsyncStorage.getItem("complaintDraft");
        if (draftStr) {
          const draftData = JSON.parse(draftStr);
          if (draftData.complaint_type || draftData.ward_id || draftData.description) {
            setDrafts([{ id: "draft_1", title: draftData.complaint_type ? draftData.complaint_type.replace("_", " ") : "Unfinished Draft", type: draftData.complaint_type || "UNKNOWN", data: draftData, date: new Date().toISOString() }]);
          }
        }
      } catch (e) {}
    };
    const unsubscribe = navigation.addListener("focus", fetchDrafts);
    fetchDrafts();
    return unsubscribe;
  }, [navigation]);

  const deleteDraft = async (id) => {
    Alert.alert("Delete Draft", "Are you sure you want to delete this draft?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await AsyncStorage.removeItem("complaintDraft");
          setDrafts([]);
      }},
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.draftCard}>
      <TouchableOpacity 
        style={styles.draftCardTouch} 
        activeOpacity={0.8} 
        onPress={() => navigation.navigate("CreateComplaint", { draft: item.data })}
      >
        <View style={styles.iconContainer}>
          <Icon name="file-document-edit-outline" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.type}>{item.type.replace("_", " ")}</Text>
        </View>
        <Icon name="chevron-right" size={24} color={COLORS.textGray} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteDraft(item.id)} style={styles.deleteBtn}>
        <Icon name="delete-outline" size={22} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Drafts</Text>
      </View>

      <FlatList
        data={drafts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="file-hidden" size={64} color={COLORS.textGray} />
            <Text style={styles.emptyTitle}>No drafts found</Text>
            <Text style={styles.emptySubtitle}>You don't have any saved drafts.</Text>
          </View>
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", alignItems: "center", padding: SPACING.xl,
    backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backButton: { marginRight: SPACING.md },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: "700", color: COLORS.textDark },
  listContainer: { padding: SPACING.md },
  draftCardTouch: {
    flexDirection: "row", alignItems: "center", flex: 1,
  },
  draftCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  deleteBtn: {
    padding: SPACING.sm, marginLeft: SPACING.sm,
  },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: `${COLORS.primary}15`,
    alignItems: "center", justifyContent: "center", marginRight: SPACING.md,
  },
  contentContainer: { flex: 1 },
  title: { fontSize: FONT_SIZES.base, fontWeight: "600", color: COLORS.textDark },
  type: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingTop: 100 },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: "700", color: COLORS.textDark, marginTop: SPACING.lg },
  emptySubtitle: { fontSize: FONT_SIZES.base, color: COLORS.textLight, marginTop: SPACING.sm },
});

export default SavedDraftsScreen;
