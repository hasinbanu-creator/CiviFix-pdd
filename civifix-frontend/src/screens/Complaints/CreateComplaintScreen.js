import React, { useState, useEffect, useContext, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Image } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, SHADOWS } from "../../constants/theme";
import authService from "../../services/authService";
import { AuthContext } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const PRIMARY       = "#2563EB";
const PRIMARY_DARK  = "#1D4ED8";
const PRIMARY_LIGHT = "#EFF6FF";
const ERROR         = "#DC2626";
const GRAY_50       = "#F9FAFB";
const GRAY_100      = "#F3F4F6";
const GRAY_200      = "#E5E7EB";
const GRAY_400      = "#9CA3AF";
const GRAY_600      = "#4B5563";
const GRAY_800      = "#1F2937";

const DEFAULT_DISTRICT_ID = "6a156a1258884d22663b2a06";

const COMPLAINT_TYPES = [
  { value: "GARBAGE",      label: "Garbage / Waste",      icon: "trash-can-outline",   color: "#0891B2" },
  { value: "ROAD_DAMAGE",  label: "Road Damage",          icon: "road-variant",         color: "#DC2626" },
  { value: "POTHOLE",      label: "Pothole",              icon: "road-variant",         color: "#DC2626" },
  { value: "STREETLIGHT",  label: "Street Light",         icon: "lightbulb-on-outline", color: "#D97706" },
  { value: "WATER_SUPPLY", label: "Water Supply",         icon: "water-outline",        color: "#0052CC" },
  { value: "DRAINAGE",     label: "Drainage Issue",       icon: "pipe-disconnected",    color: "#0891B2" },
  { value: "SANITATION",   label: "Sanitation",           icon: "broom",                color: "#059669" },
  { value: "TREE_CUTTING", label: "Tree / Fallen Branch", icon: "tree-outline",         color: "#059669" },
  { value: "CONSTRUCTION", label: "Construction Block",   icon: "hammer-wrench",        color: "#D97706" },
  { value: "OTHER",        label: "Other Issue",          icon: "alert-circle-outline", color: "#6B7280" },
];

const PRIORITIES = [
  { value: "LOW",    label: "Low",    color: "#059669", bg: "#D1FAE5", icon: "arrow-down-circle-outline" },
  { value: "MEDIUM", label: "Medium", color: "#D97706", bg: "#FEF3C7", icon: "minus-circle-outline"      },
  { value: "HIGH",   label: "High",   color: "#DC2626", bg: "#FFE4E6", icon: "arrow-up-circle-outline"   },
];

// ─── REUSABLE FIELD ───────────────────────────────────────────────────────────
// Single consistent input pattern used everywhere — icon + TextInput, no nesting tricks
const Field = ({ label, icon, error, children, style }) => (
  <View style={[styles.fieldGroup, style]}>
    {label && <Text style={styles.fieldLabel}>{label}</Text>}
    {children}
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const InputField = ({
  label, icon, placeholder, value, onChangeText,
  multiline, numberOfLines, keyboardType, error, editable = true, rightElement, style,
}) => (
  <Field label={label} error={error} style={style}>
    <View style={[
      styles.inputWrap,
      multiline && styles.inputWrapMulti,
      error      && styles.inputError,
      !editable  && styles.inputDisabled,
    ]}>
      <Icon
        name={icon}
        size={16}
        color={value ? PRIMARY : GRAY_400}
        style={multiline ? { marginTop: SPACING.xs } : undefined}
      />
      <TextInput
        style={[styles.textInput, multiline && styles.textInputMulti]}
        placeholder={placeholder}
        placeholderTextColor={GRAY_400}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        editable={editable}
        textAlignVertical={multiline ? "top" : "center"}
        autoCorrect={false}
      />
      {rightElement}
    </View>
  </Field>
);

// ─── SUCCESS MODAL ────────────────────────────────────────────────────────────
const SuccessModal = ({ visible, complaint, onView, onDone }) => {
  const scaleAnim   = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 220,             useNativeDriver: true }),
      ]).start(() => {
        Animated.spring(checkAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }).start();
      });
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      checkAnim.setValue(0);
    }
  }, [visible]);

  const complaintId = complaint?.complaint_id || complaint?._id || "—";

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[ss.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[ss.sheet, { transform: [{ scale: scaleAnim }] }]}>

          <View style={ss.checkCircleOuter}>
            <View style={ss.checkCircleInner}>
              <Animated.View style={{ transform: [{ scale: checkAnim }] }}>
                <Icon name="check-bold" size={38} color="#fff" />
              </Animated.View>
            </View>
            <View style={ss.pulseRing} />
          </View>

          <Text style={ss.successTitle}>Complaint Submitted!</Text>
          <Text style={ss.successSub}>
            Your complaint has been registered. Our team will review and resolve it within{" "}
            <Text style={ss.successHighlight}>48 hours</Text>.
          </Text>

          <View style={ss.idPill}>
            <Icon name="identifier" size={14} color={PRIMARY} />
            <Text style={ss.idText}>{complaintId}</Text>
          </View>

          <View style={ss.timelineStrip}>
            {[
              { icon: "check-circle",           label: "Submitted",   color: "#059669", done: true  },
              { icon: "account-search-outline", label: "Review",      color: PRIMARY,   done: false },
              { icon: "progress-wrench",        label: "In Progress", color: "#D97706", done: false },
              { icon: "flag-checkered",         label: "Resolved",    color: "#059669", done: false },
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <View style={ss.timelineStep}>
                  <View style={[ss.timelineDot, step.done ? { backgroundColor: step.color } : ss.timelineDotInactive]}>
                    <Icon name={step.icon} size={13} color={step.done ? "#fff" : GRAY_400} />
                  </View>
                  <Text style={[ss.timelineLabel, step.done && { color: step.color, fontWeight: "700" }]}>
                    {step.label}
                  </Text>
                </View>
                {i < arr.length - 1 && (
                  <View style={[ss.timelineConnector, step.done && { backgroundColor: step.color }]} />
                )}
              </React.Fragment>
            ))}
          </View>

          <View style={ss.timeBadge}>
            <Icon name="clock-fast" size={16} color="#D97706" />
            <Text style={ss.timeBadgeText}>
              Expected resolution within <Text style={{ fontWeight: "800" }}>48 hours</Text>
            </Text>
          </View>

          <View style={ss.actionRow}>
            <TouchableOpacity style={ss.btnSecondary} onPress={onDone} activeOpacity={0.8}>
              <Text style={ss.btnSecondaryText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ss.btnPrimary} onPress={onView} activeOpacity={0.85}>
              <Icon name="eye-outline" size={16} color="#fff" />
              <Text style={ss.btnPrimaryText}>View Complaint</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── DROPDOWN ─────────────────────────────────────────────────────────────────
const Dropdown = ({ label, placeholder, value, items, onSelect, error, renderItem, keyExtractor, loading: dropLoading }) => {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => (i.value ?? i._id ?? i) === value);

  return (
    <Field label={label} error={error}>
      <TouchableOpacity
        onPress={() => !dropLoading && setOpen(true)}
        activeOpacity={0.78}
        style={[styles.inputWrap, error && styles.inputError, open && styles.inputFocused]}
      >
        {dropLoading ? (
          <ActivityIndicator size="small" color={PRIMARY} />
        ) : selected?.icon ? (
          <View style={[styles.dropIconWrap, { backgroundColor: (selected.color || PRIMARY) + "18" }]}>
            <Icon name={selected.icon} size={15} color={selected.color ?? PRIMARY} />
          </View>
        ) : (
          <View style={styles.dropIconWrap}>
            <Icon name="format-list-bulleted" size={15} color={GRAY_400} />
          </View>
        )}
        <Text style={[styles.textInput, !selected && { color: GRAY_400 }]}>
          {dropLoading
            ? "Loading…"
            : selected ? (selected.label ?? selected.ward_name) : placeholder}
        </Text>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={18} color={GRAY_400} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.dropSheet}>
            <View style={styles.dropHandle} />
            <Text style={styles.dropSheetTitle}>{label}</Text>
            <FlatList
              data={items}
              keyExtractor={keyExtractor ?? ((item, i) => item._id ?? item.value ?? String(i))}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.dropSep} />}
              renderItem={({ item }) => {
                const isSel = (item.value ?? item._id ?? item) === value;
                return renderItem
                  ? renderItem({ item, isSelected: isSel, onSelect: (v) => { onSelect(v); setOpen(false); } })
                  : (
                    <TouchableOpacity
                      onPress={() => { onSelect(item.value ?? item._id ?? item); setOpen(false); }}
                      style={[styles.dropItem, isSel && styles.dropItemActive]}
                    >
                      {item.icon && (
                        <View style={[styles.dropItemIcon, { backgroundColor: (item.color || PRIMARY) + "15" }]}>
                          <Icon name={item.icon} size={17} color={item.color ?? PRIMARY} />
                        </View>
                      )}
                      <Text style={[styles.dropItemText, isSel && styles.dropItemTextActive]}>
                        {item.label ?? item.ward_name ?? item}
                      </Text>
                      {isSel && <Icon name="check-circle" size={18} color={PRIMARY} />}
                    </TouchableOpacity>
                  );
              }}
              ListEmptyComponent={
                <View style={styles.dropEmpty}>
                  <Icon name="database-off-outline" size={28} color={GRAY_400} />
                  <Text style={styles.dropEmptyText}>No options available</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </Field>
  );
};

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconWrap}>
      <Icon name={icon} size={16} color={PRIMARY} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
    </View>
  </View>
);

const FormCard = ({ children }) => <View style={styles.card}>{children}</View>;

// ─── PRIORITY SELECTOR ────────────────────────────────────────────────────────
const PrioritySelector = ({ value, onChange }) => (
  <Field label="Priority">
    <View style={styles.priorityRow}>
      {PRIORITIES.map((p) => {
        const sel = value === p.value;
        return (
          <TouchableOpacity
            key={p.value}
            onPress={() => onChange(p.value)}
            activeOpacity={0.78}
            style={[styles.priorityBtn, sel && { backgroundColor: p.bg, borderColor: p.color }]}
          >
            <Icon name={p.icon} size={16} color={sel ? p.color : GRAY_400} />
            <Text style={[styles.priorityLabel, sel && { color: p.color }]}>{p.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </Field>
);

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export const CreateComplaintScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  const initialDraft = route.params?.draft;

  const [form, setForm] = useState({
    ward_id: "", complaint_type: "", description: "",
    latitude: "", longitude: "", address: "", citizen_note: "", priority: "MEDIUM",
  });
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);
  const [serverError, setServerError]   = useState("");
  const [wards, setWards]               = useState([]);
  const [wardsLoading, setWardsLoading] = useState(true);
  const [gpsLoading, setGpsLoading]     = useState(false);
  const [successData, setSuccessData]   = useState(null);

  // Draft loading
  useEffect(() => {
    if (initialDraft) {
      setForm(initialDraft);
      return;
    }
    const loadDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem("complaintDraft");
        if (draft) {
          setForm(JSON.parse(draft));
        }
      } catch (e) {}
    };
    loadDraft();
  }, []);

  // Draft saving
  useEffect(() => {
    const saveDraft = setTimeout(() => {
      AsyncStorage.setItem("complaintDraft", JSON.stringify(form));
    }, 1000);
    return () => clearTimeout(saveDraft);
  }, [form]);

  useEffect(() => { fetchWards(); }, []);

  const fetchWards = async () => {
    setWardsLoading(true);
    try {
      const districtId = user?.district_id ?? user?.district ?? DEFAULT_DISTRICT_ID;
      const res = await authService.getWardsByDistrict(districtId, { page: 1, is_active: true });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setWards(list);
    } catch { setWards([]); }
    finally { setWardsLoading(false); }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ── GPS — no manual fallback ──
  const handleGetLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Denied",
          "Please enable location access in Settings → Privacy → Location Services to use this feature.",
          [{ text: "OK" }]
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      updateField("latitude",  String(latitude.toFixed(6)));
      updateField("longitude", String(longitude.toFixed(6)));
      // Reverse geocode → autofill address
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (place) {
          const parts = [place.name, place.street, place.district, place.city, place.region].filter(Boolean);
          updateField("address", parts.join(", "));
        }
      } catch { /* optional */ }
    } catch {
      Alert.alert("Location Error", "Could not get your location. Please try again.");
    } finally {
      setGpsLoading(false);
    }
  };

  const validate = () => {
    const next = {};
    if (!form.ward_id)                          next.ward_id        = "Please select a ward";
    if (!form.complaint_type)                   next.complaint_type = "Please select a complaint type";
    if (form.description.trim().length < 10)    next.description    = "Description must be at least 10 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    navigation.navigate("ComplaintPreview", {
      form,
      ward: wardItems.find((w) => w.value === form.ward_id),
      selectedType,
      selectedPri,
    });
  };

  const wardItems = wards.map((w) => ({
    ...w, value: w._id ?? w.ward_id,
    label: w.label ?? w.ward_name ?? w.name ?? w._id,
  }));
  const selectedType = COMPLAINT_TYPES.find((t) => t.value === form.complaint_type);
  const selectedPri  = PRIORITIES.find((p) => p.value === form.priority);

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>

        {/* ── Header ── */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Raise a Complaint</Text>
            <Text style={styles.headerSub}>Help us fix your community</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <Icon name="clipboard-plus-outline" size={20} color="#fff" />
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Section 1: What's the issue ── */}
          <FormCard>
            <SectionHeader icon="alert-circle-outline" title="What's the issue?" subtitle="Type, description and priority" />

            <Dropdown
              label="Complaint Type"
              placeholder="Select a category"
              value={form.complaint_type}
              items={COMPLAINT_TYPES}
              onSelect={(v) => updateField("complaint_type", v)}
              error={errors.complaint_type}
            />

            <InputField
              label="Description"
              icon="text-box-outline"
              placeholder="Describe the issue clearly (min 10 characters)"
              value={form.description}
              onChangeText={(v) => updateField("description", v)}
              multiline
              numberOfLines={4}
              error={errors.description}
            />

            <PrioritySelector value={form.priority} onChange={(v) => updateField("priority", v)} />
          </FormCard>

          {/* ── Section 2: Where is it ── */}
          <FormCard>
            <SectionHeader icon="map-marker-radius" title="Where is it?" subtitle="Ward, address & GPS location" />

            <Dropdown
              label="Ward"
              placeholder={wardsLoading ? "Loading wards…" : "Select your ward"}
              value={form.ward_id}
              items={wardItems}
              loading={wardsLoading}
              onSelect={(v) => updateField("ward_id", v)}
              error={errors.ward_id}
              keyExtractor={(item) => item._id ?? item.ward_id ?? item.value}
              renderItem={({ item, isSelected, onSelect }) => (
                <TouchableOpacity
                  onPress={() => onSelect(item.value)}
                  style={[styles.dropItem, isSelected && styles.dropItemActive]}
                >
                  <View style={[styles.dropItemIcon, { backgroundColor: PRIMARY + "12" }]}>
                    <Icon name="map-marker-outline" size={16} color={PRIMARY} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dropItemText, isSelected && styles.dropItemTextActive]}>{item.label}</Text>
                    {item.zone && <Text style={styles.dropItemSub}>{item.zone}</Text>}
                  </View>
                  {isSelected && <Icon name="check-circle" size={17} color={PRIMARY} />}
                </TouchableOpacity>
              )}
            />

            {/* GPS button */}
            <TouchableOpacity
              style={[styles.gpsBtn, gpsLoading && styles.gpsBtnLoading]}
              onPress={handleGetLocation}
              disabled={gpsLoading}
              activeOpacity={0.8}
            >
              {gpsLoading
                ? <ActivityIndicator size="small" color={PRIMARY} />
                : <Icon name="crosshairs-gps" size={18} color={PRIMARY} />
              }
              <Text style={styles.gpsBtnText}>
                {gpsLoading ? "Getting location…" : "Use my current location"}
              </Text>
            </TouchableOpacity>

            {/* GPS filled pill — shows coords, tap × to clear */}
            {(form.latitude || form.longitude) && (
              <View style={styles.gpsFilled}>
                <Icon name="map-marker-check-outline" size={16} color="#059669" />
                <Text style={styles.gpsFilledText} numberOfLines={1}>
                  {form.latitude}, {form.longitude}
                </Text>
                <TouchableOpacity onPress={() => {
                  updateField("latitude", "");
                  updateField("longitude", "");
                }}>
                  <Icon name="close-circle-outline" size={18} color={GRAY_400} />
                </TouchableOpacity>
              </View>
            )}

            {/* Address — autofilled by GPS, still editable */}
            <InputField
              label="Address / Landmark"
              icon="home-map-marker"
              placeholder="e.g. Near post office, Main Road"
              value={form.address}
              onChangeText={(v) => updateField("address", v)}
            />
          </FormCard>

          {/* ── Section 3: Additional info ── */}
          <FormCard>
            <SectionHeader icon="note-text-outline" title="Additional info" subtitle="Optional — any extra context" />
            <InputField
              label="Citizen Note"
              icon="note-edit-outline"
              placeholder="Anything else we should know?"
              value={form.citizen_note}
              onChangeText={(v) => updateField("citizen_note", v)}
              multiline
              numberOfLines={3}
            />
          </FormCard>

          {/* ── Summary preview ── */}
          {(form.complaint_type || form.ward_id) && (
            <View style={styles.summaryCard}>
              {selectedType && (
                <View style={[styles.summaryIconWrap, { backgroundColor: selectedType.color + "18" }]}>
                  <Icon name={selectedType.icon} size={20} color={selectedType.color} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryReadyLabel}>Ready to submit</Text>
                <Text style={styles.summaryTitle} numberOfLines={1}>
                  {selectedType?.label ?? "—"}
                  {form.ward_id ? `  ·  ${wardItems.find((w) => w.value === form.ward_id)?.label ?? "Ward"}` : ""}
                </Text>
              </View>
              {selectedPri && (
                <View style={[styles.summaryPriBadge, { backgroundColor: selectedPri.bg }]}>
                  <Text style={[styles.summaryPriText, { color: selectedPri.color }]}>{form.priority}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Server error ── */}
          {!!serverError && (
            <View style={styles.serverErrorBox}>
              <Icon name="alert-circle-outline" size={18} color={ERROR} />
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          )}

          {/* ── Submit ── */}
          <TouchableOpacity
            onPress={submit} disabled={loading}
            activeOpacity={0.85} style={styles.submitWrap}
          >
            <LinearGradient
              colors={[PRIMARY, PRIMARY_DARK]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              <Text style={styles.submitText}>Preview & Submit</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={!!successData}
        complaint={successData}
        onView={() => { setSuccessData(null); navigation.replace("ComplaintDetail", { complaint: successData }); }}
        onDone={() => { setSuccessData(null); navigation.goBack(); }}
      />
    </View>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: GRAY_50 },

  headerBar: {
    backgroundColor: PRIMARY, flexDirection: "row", alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 52 : SPACING.lg,
    paddingBottom: SPACING.lg, paddingHorizontal: SPACING.lg, gap: SPACING.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle:  { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  headerSub:    { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },

  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },

  card: {
    backgroundColor: "#fff", borderRadius: 18, padding: SPACING.lg, marginBottom: SPACING.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.md, marginBottom: SPACING.lg },
  sectionIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center",
  },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: GRAY_800 },
  sectionSub:   { fontSize: 11, color: GRAY_400, marginTop: 1 },

  // ── The one input pattern used everywhere ──
  fieldGroup: { marginBottom: SPACING.lg },
  fieldLabel: {
    fontSize: 11, fontWeight: "700", color: GRAY_600,
    letterSpacing: 0.6, marginBottom: SPACING.sm, textTransform: "uppercase",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: GRAY_200,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,       // uniform vertical padding — no minHeight tricks
    gap: SPACING.md,
    backgroundColor: GRAY_50,
  },
  inputWrapMulti: {
    alignItems: "flex-start",  // icon top-aligns with text
    paddingVertical: SPACING.md,
  },
  inputFocused:  { borderColor: PRIMARY, backgroundColor: PRIMARY_LIGHT },
  inputError:    { borderColor: ERROR,   backgroundColor: "#FEF2F2"     },
  inputDisabled: { opacity: 0.55, backgroundColor: GRAY_100             },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: GRAY_800,
    padding: 0,             // remove default TextInput padding — spacing comes from inputWrap
    margin: 0,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  textInputMulti: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: { color: ERROR, fontSize: 11, marginTop: SPACING.xs, marginLeft: 2 },

  // ── Dropdown ──
  dropIconWrap: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: GRAY_100, alignItems: "center", justifyContent: "center",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  dropSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.6,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  dropHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: GRAY_200, alignSelf: "center", marginVertical: SPACING.md,
  },
  dropSheetTitle: {
    fontSize: 15, fontWeight: "800", color: GRAY_800,
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm,
  },
  dropSep:           { height: 1, backgroundColor: GRAY_100, marginHorizontal: SPACING.lg },
  dropItem:          { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.md },
  dropItemActive:    { backgroundColor: PRIMARY_LIGHT },
  dropItemIcon:      { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  dropItemText:      { flex: 1, fontSize: 14, color: GRAY_800, fontWeight: "500" },
  dropItemTextActive:{ color: PRIMARY, fontWeight: "700" },
  dropItemSub:       { fontSize: 11, color: GRAY_400, marginTop: SPACING.xs },
  dropEmpty:         { alignItems: "center", padding: SPACING.xxl, gap: SPACING.sm },
  dropEmptyText:     { color: GRAY_400, fontSize: 13 },

  // ── Priority ──
  priorityRow: { flexDirection: "row", gap: SPACING.md },
  priorityBtn: {
    flex: 1, borderRadius: 12, paddingVertical: SPACING.md,
    alignItems: "center", justifyContent: "center", gap: SPACING.xs,
    backgroundColor: GRAY_50, borderWidth: 1.5, borderColor: GRAY_200,
  },
  priorityLabel: { fontSize: 12, fontWeight: "700", color: GRAY_400 },

  // ── GPS ──
  gpsBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm,
    borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 12,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    backgroundColor: PRIMARY_LIGHT, marginBottom: SPACING.md,
  },
  gpsBtnLoading: { opacity: 0.7 },
  gpsBtnText:    { color: PRIMARY, fontSize: 13, fontWeight: "700" },
  gpsFilled: {
    flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    backgroundColor: "#ECFDF5", borderRadius: 10,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    borderWidth: 1, borderColor: "#A7F3D0", marginBottom: SPACING.md,
  },
  gpsFilledText: { flex: 1, color: "#065F46", fontSize: 12, fontWeight: "600" },

  // ── Media ──
  uploadBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm,
    borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 12, borderStyle: "dashed",
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    backgroundColor: PRIMARY_LIGHT, marginBottom: SPACING.md,
  },
  uploadBtnText: { color: PRIMARY, fontSize: 13, fontWeight: "700" },
  imageScroll: { flexDirection: "row", marginTop: SPACING.sm },
  imagePreviewWrap: { marginRight: SPACING.md, position: "relative" },
  imagePreview: { width: 80, height: 80, borderRadius: 8 },
  removeImageBtn: {
    position: "absolute", top: -8, right: -8, width: 24, height: 24,
    borderRadius: 12, backgroundColor: ERROR, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },

  // ── Summary ──
  summaryCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: PRIMARY_LIGHT, borderRadius: 14,
    borderWidth: 1, borderColor: "#BFDBFE",
    padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.md,
  },
  summaryIconWrap:   { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  summaryReadyLabel: { fontSize: 10, color: GRAY_400, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  summaryTitle:      { fontSize: 13, color: GRAY_800, fontWeight: "700", marginTop: SPACING.xs },
  summaryPriBadge:   { borderRadius: 20, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  summaryPriText:    { fontSize: 11, fontWeight: "800" },

  // ── Server error ──
  serverErrorBox: {
    flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    backgroundColor: "#FEF2F2", borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md,
  },
  serverErrorText: { color: ERROR, fontSize: 12, flex: 1, fontWeight: "600" },

  // ── Submit ──
  submitWrap: { borderRadius: 14, overflow: "hidden" },
  submitBtn:  { paddingVertical: SPACING.lg, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: SPACING.sm },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },
});

// ─── SUCCESS MODAL STYLES ─────────────────────────────────────────────────────
const ss = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: SPACING.xl,
  },
  sheet: {
    backgroundColor: "#fff", borderRadius: 28, padding: SPACING.xxl,
    width: "100%", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 12,
  },
  checkCircleOuter:   { marginBottom: SPACING.xl, alignItems: "center", justifyContent: "center" },
  checkCircleInner:   { width: 80, height: 80, borderRadius: 40, backgroundColor: "#059669", alignItems: "center", justifyContent: "center", zIndex: 2 },
  pulseRing:          { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "#059669", opacity: 0.15 },
  successTitle:       { fontSize: 22, fontWeight: "900", color: GRAY_800, marginBottom: SPACING.sm, letterSpacing: -0.4, textAlign: "center" },
  successSub:         { fontSize: 14, color: GRAY_600, textAlign: "center", lineHeight: 22, marginBottom: SPACING.lg },
  successHighlight:   { color: PRIMARY, fontWeight: "800" },
  idPill:             { flexDirection: "row", alignItems: "center", gap: SPACING.sm, backgroundColor: PRIMARY_LIGHT, borderRadius: 20, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderWidth: 1, borderColor: "#BFDBFE", marginBottom: SPACING.xl },
  idText:             { color: PRIMARY, fontSize: 12, fontWeight: "700" },
  timelineStrip:      { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: SPACING.lg },
  timelineStep:       { alignItems: "center", gap: SPACING.xs },
  timelineDot:        { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  timelineDotInactive:{ backgroundColor: GRAY_100 },
  timelineLabel:      { fontSize: 9, color: GRAY_400, fontWeight: "600", textAlign: "center" },
  timelineConnector:  { flex: 1, height: 2, backgroundColor: GRAY_200, marginBottom: SPACING.lg },
  timeBadge:          { flexDirection: "row", alignItems: "center", gap: SPACING.sm, backgroundColor: "#FFFBEB", borderRadius: 12, paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderWidth: 1, borderColor: "#FDE68A", width: "100%", marginBottom: SPACING.xl },
  timeBadgeText:      { color: "#92400E", fontSize: 13 },
  actionRow:          { flexDirection: "row", gap: SPACING.md, width: "100%" },
  btnSecondary:       { flex: 1, paddingVertical: SPACING.md, borderRadius: 12, borderWidth: 1.5, borderColor: GRAY_200, alignItems: "center", justifyContent: "center" },
  btnSecondaryText:   { color: GRAY_600, fontSize: 14, fontWeight: "700" },
  btnPrimary:         { flex: 2, paddingVertical: SPACING.md, borderRadius: 12, backgroundColor: PRIMARY, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.xs },
  btnPrimaryText:     { color: "#fff", fontSize: 14, fontWeight: "800" },
});

export default CreateComplaintScreen;