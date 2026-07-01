import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import MapView, { Marker } from "react-native-maps";
import authService from "../../services/authService";
import { getErrorMessage } from "../../services/api";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const ComplaintPreviewScreen = ({ route, navigation }) => {
  const { form, ward, selectedType, selectedPri } = route.params;
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const payload = {
        ward_id: form.ward_id,
        complaint_type: form.complaint_type,
        description: form.description,
        priority: form.priority,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        address: form.address,
        citizen_note: form.citizen_note ? form.citizen_note.trim() : undefined,
      };

      const created = await authService.createComplaint(payload);
      
      // Navigate to Success Screen
      navigation.replace("ComplaintSuccess", { complaint: created });
    } catch (err) {
      alert(getErrorMessage(err, "Unable to submit complaint."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} disabled={submitting}>
          <Icon name="arrow-left" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview Complaint</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Type & Priority */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: selectedType?.color + "20" }]}>
                <Icon name={selectedType?.icon} size={24} color={selectedType?.color} />
              </View>
              <Text style={styles.title}>{selectedType?.label}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: selectedPri?.bg }]}>
              <Text style={[styles.priorityText, { color: selectedPri?.color }]}>{form.priority}</Text>
            </View>
          </View>
          <Text style={styles.description}>{form.description}</Text>
        </View>

        {/* Location & Map */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="map-marker" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <Text style={styles.addressText}>{form.address}</Text>
          <Text style={styles.wardText}>Ward: {ward?.label}</Text>

          {form.latitude && form.longitude && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: parseFloat(form.latitude),
                  longitude: parseFloat(form.longitude),
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker coordinate={{ latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) }} />
              </MapView>
            </View>
          )}
        </View>



        {/* Citizen Note */}
        {form.citizen_note ? (
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="note-text-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Additional Note</Text>
            </View>
            <Text style={styles.description}>{form.citizen_note}</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.goBack()} disabled={submitting}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Confirm & Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", alignItems: "center", padding: SPACING.xl,
    backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { marginRight: SPACING.md },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: "700", color: COLORS.textDark },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  card: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.sm,
  },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.md },
  row: { flexDirection: "row", alignItems: "center" },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: SPACING.md },
  title: { fontSize: FONT_SIZES.lg, fontWeight: "700", color: COLORS.textDark },
  priorityBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  priorityText: { fontSize: 12, fontWeight: "700" },
  description: { fontSize: FONT_SIZES.base, color: COLORS.textLight, lineHeight: 22 },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: "700", color: COLORS.textDark, marginLeft: SPACING.sm },
  addressText: { fontSize: FONT_SIZES.base, color: COLORS.textDark, marginTop: SPACING.md },
  wardText: { fontSize: FONT_SIZES.sm, color: COLORS.textGray, marginTop: 4 },
  mapContainer: { height: 150, width: "100%", borderRadius: BORDER_RADIUS.md, overflow: "hidden", marginTop: SPACING.md },
  map: { flex: 1 },
  imageScroll: { marginTop: SPACING.md },
  previewImage: { width: 100, height: 100, borderRadius: BORDER_RADIUS.md, marginRight: SPACING.md },
  
  bottomBar: {
    flexDirection: "row", padding: SPACING.lg, backgroundColor: COLORS.card,
    borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.md,
  },
  editBtn: {
    flex: 1, paddingVertical: 14, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.primary, alignItems: "center",
  },
  editBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: FONT_SIZES.base },
  submitBtn: {
    flex: 2, paddingVertical: 14, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
  },
  submitBtnText: { color: COLORS.card, fontWeight: "700", fontSize: FONT_SIZES.base },
});

export default ComplaintPreviewScreen;
