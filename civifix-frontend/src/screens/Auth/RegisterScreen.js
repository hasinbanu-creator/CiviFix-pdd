import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from "../../constants/theme";
import { API_URL, ENDPOINTS } from "../../constants/endpoints";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const PRIMARY = "#2563EB";
const PRIMARY_LIGHT = "#EFF6FF";
const PRIMARY_MID = "#BFDBFE";
const ERROR = "#DC2626";
const GRAY_50 = "#F9FAFB";
const GRAY_100 = "#F3F4F6";
const GRAY_200 = "#E5E7EB";
const GRAY_400 = "#9CA3AF";
const GRAY_600 = "#4B5563";
const GRAY_800 = "#1F2937";

/* ── API ── */
const API_BASE = API_URL;

import api from "../../services/api";

async function fetchDistricts() {
  const res = await api.get("/admin/districts?active_only=false");
  const data = res.data?.data || [];
  console.log("[Districts] Count:", data.length);
  return data;
}


/* ── DistrictDropdown ── */
function DistrictDropdown({ value, districts, loading, onSelect, error }) {
  const [open, setOpen] = useState(false);
  const selected = districts.find((d) => d._id === value);

  return (
    <>
      <TouchableOpacity
        style={[styles.inputWrap, error && styles.inputError, open && styles.inputFocused]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Icon name="city-variant-outline" size={18} color={value ? PRIMARY : GRAY_400} />
        <Text style={[styles.dropdownText, !selected && styles.dropdownPlaceholder]}>
          {loading ? "Loading districts…" : selected ? selected.name : "Select your district"}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={PRIMARY} />
        ) : (
          <Icon
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={GRAY_400}
          />
        )}
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.dropdownSheet}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>Select District</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Icon name="close" size={20} color={GRAY_600} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={districts}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.dropdownSep} />}
              renderItem={({ item }) => {
                const isSelected = item._id === value;
                return (
                  <TouchableOpacity
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                    onPress={() => {
                      onSelect(item._id);
                      setOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownItemLeft}>
                      <View style={[styles.districtDot, isSelected && styles.districtDotActive]} />
                      <View>
                        <Text style={[styles.dropdownItemName, isSelected && styles.dropdownItemNameActive]}>
                          {item.name}
                        </Text>
                        <Text style={styles.dropdownItemState}>{item.state}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Icon name="check-circle" size={18} color={PRIMARY} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.dropdownEmpty}>
                  <Icon name="map-marker-off-outline" size={32} color={GRAY_400} />
                  <Text style={styles.dropdownEmptyText}>No districts found</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/* ── Field component ── */
function Field({ label, icon, error, children, style }) {
  return (
    <View style={[styles.fieldGroup, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/* ── Main Screen ── */
export const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    email: "",
    address: "",
    district_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(true);
  const [districtsError, setDistrictsError] = useState(false);

  const { signUp, error: authError } = useContext(AuthContext);

  const loadDistricts = () => {
    setDistrictsLoading(true);
    setDistrictsError(false);
    fetchDistricts()
      .then((data) => {
        setDistricts(data);
        setDistrictsError(false);
      })
      .catch((err) => {
        console.error("District fetch error:", err);
        setDistrictsError(true);
      })
      .finally(() => setDistrictsLoading(false));
  };

  useEffect(() => { loadDistricts(); }, []);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.mobile_number.trim()) newErrors.mobile_number = "Mobile number is required";
    else if (!/^\d{10}$/.test(formData.mobile_number.replace(/\D/g, "")))
      newErrors.mobile_number = "Enter a valid 10-digit number";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Enter a valid email";
    if (formData.address.trim().length < 5)
      newErrors.address = "Address must be at least 5 characters";
    if (!formData.district_id) newErrors.district_id = "Please select a district";
    if (!agreedToTerms) newErrors.terms = "You must agree to Terms & Conditions";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    const selected = districts.find((d) => d._id === formData.district_id);
    setLoading(true);
    try {
      await signUp({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile_number: formData.mobile_number.replace(/\D/g, ""),
        address: formData.address.trim(),
        district: formData.district_id,
      });
      navigation.navigate("VerifyRegister", {
        email: formData.email.trim().toLowerCase(),
      });
    } catch (error) {
      console.error("Register error:", error);
    } finally {
      setLoading(false);
    }
  };

  const inputProps = (field, extra = {}) => ({
    style: styles.input,
    value: formData[field],
    onChangeText: (val) => updateField(field, val),
    placeholderTextColor: GRAY_400,
    ...extra,
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── HEADER BAR ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Join CiviFix today</Text>
        </View>
        {/* step indicator */}
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>1 / 2</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── PROGRESS BAR ── */}
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <Text style={styles.sectionHint}>
          Fill in your details to get started. All fields are required.
        </Text>

        {/* ── CARD ── */}
        <View style={styles.card}>

          {/* Personal Info section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Icon name="account-outline" size={16} color={PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>Personal Info</Text>
          </View>

          <Field label="Full Name" error={errors.name}>
            <View style={[styles.inputWrap, errors.name && styles.inputError]}>
              <Icon name="account-outline" size={18} color={formData.name ? PRIMARY : GRAY_400} />
              <TextInput
                {...inputProps("name")}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
            </View>
          </Field>

          <Field label="Mobile Number" error={errors.mobile_number}>
            <View style={[styles.inputWrap, errors.mobile_number && styles.inputError]}>
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>🇮🇳 +91</Text>
              </View>
              <View style={styles.phoneDivider} />
              <TextInput
                {...inputProps("mobile_number")}
                placeholder="10-digit number"
                keyboardType="phone-pad"
                maxLength={10}
                style={[styles.input, { flex: 1 }]}
              />
            </View>
          </Field>

          <Field label="Email Address" error={errors.email}>
            <View style={[styles.inputWrap, errors.email && styles.inputError]}>
              <Icon name="email-outline" size={18} color={formData.email ? PRIMARY : GRAY_400} />
              <TextInput
                {...inputProps("email")}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </Field>

          <View style={styles.sectionDivider} />

          {/* Address section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Icon name="map-marker-outline" size={16} color={PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>Location</Text>
          </View>

          <Field label="Address" error={errors.address}>
            <View style={[styles.inputWrap, styles.inputWrapMulti, errors.address && styles.inputError]}>
              <Icon name="map-marker-outline" size={18} color={formData.address ? PRIMARY : GRAY_400} style={{ marginTop: 3 }} />
              <TextInput
                {...inputProps("address")}
                placeholder="House / Street / Locality"
                multiline
                numberOfLines={3}
                style={[styles.input, styles.inputMulti]}
              />
            </View>
          </Field>

          <Field label="District" error={errors.district_id}>
            <DistrictDropdown
              value={formData.district_id}
              districts={districts}
              loading={districtsLoading}
              onSelect={(id) => updateField("district_id", id)}
              error={errors.district_id}
            />
          </Field>

          <View style={styles.sectionDivider} />

          {/* Terms */}
          <TouchableOpacity
            onPress={() => {
              setAgreedToTerms(!agreedToTerms);
              if (errors.terms) setErrors((p) => ({ ...p, terms: "" }));
            }}
            style={styles.termsRow}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
              {agreedToTerms && <Icon name="check" size={12} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              I agree to the{" "}
              <Text style={styles.termsLink}>Terms & Conditions</Text>
              {" "}and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.terms ? <Text style={[styles.errorText, { marginTop: -8, marginBottom: 12 }]}>{errors.terms}</Text> : null}

          {/* Auth error */}
          {authError ? (
            <View style={styles.authErrorBox}>
              <Icon name="alert-circle-outline" size={16} color={ERROR} />
              <Text style={styles.authErrorText}>{authError}</Text>
            </View>
          ) : null}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.ctaBtnText}>CREATE ACCOUNT</Text>
                <Icon name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign in link */}
        <View style={styles.signinRow}>
          <Text style={styles.signinText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.signinLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: GRAY_50 },

  /* ── HEADER ── */
  headerBar: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 52 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 1,
  },
  stepBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  /* ── PROGRESS ── */
  progressTrack: {
    height: 3,
    backgroundColor: GRAY_200,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    width: "50%",
    height: "100%",
    backgroundColor: PRIMARY,
    borderRadius: 4,
  },

  sectionHint: {
    fontSize: 12,
    color: GRAY_400,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
    lineHeight: 18,
  },

  /* ── CARD ── */
  card: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: PRIMARY_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: GRAY_800,
    letterSpacing: 0.2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: GRAY_100,
    marginVertical: 20,
  },

  /* ── FIELDS ── */
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: GRAY_600,
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: GRAY_200,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: GRAY_50,
    minHeight: 48,
  },
  inputWrapMulti: {
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  inputFocused: { borderColor: PRIMARY, backgroundColor: PRIMARY_LIGHT },
  inputError: { borderColor: ERROR, backgroundColor: "#FEF2F2" },
  input: {
    flex: 1,
    fontSize: 14,
    color: GRAY_800,
    paddingVertical: 12,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  inputMulti: {
    paddingVertical: 4,
    minHeight: 64,
    textAlignVertical: "top",
  },
  errorText: {
    color: ERROR,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },

  /* ── PHONE PREFIX ── */
  phonePrefix: {
    paddingRight: 4,
  },
  phonePrefixText: {
    fontSize: 13,
    color: GRAY_800,
    fontWeight: "600",
  },
  phoneDivider: {
    width: 1,
    height: 20,
    backgroundColor: GRAY_200,
    marginRight: 4,
  },

  /* ── DROPDOWN ── */
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: GRAY_800,
    paddingVertical: 13,
  },
  dropdownPlaceholder: { color: GRAY_400 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  dropdownSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.55,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: GRAY_800,
  },
  dropdownSep: {
    height: 1,
    backgroundColor: GRAY_100,
    marginHorizontal: 16,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  dropdownItemActive: { backgroundColor: PRIMARY_LIGHT },
  dropdownItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  districtDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GRAY_200,
  },
  districtDotActive: { backgroundColor: PRIMARY },
  dropdownItemName: {
    fontSize: 14,
    color: GRAY_800,
    fontWeight: "500",
  },
  dropdownItemNameActive: { color: PRIMARY, fontWeight: "700" },
  dropdownItemState: {
    fontSize: 11,
    color: GRAY_400,
    marginTop: 1,
  },
  dropdownEmpty: {
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
  dropdownEmptyText: {
    color: GRAY_400,
    fontSize: 13,
  },

  /* ── TERMS ── */
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: GRAY_200,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: GRAY_600,
    lineHeight: 20,
  },
  termsLink: {
    color: PRIMARY,
    fontWeight: "700",
  },

  /* ── AUTH ERROR ── */
  authErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  authErrorText: {
    color: ERROR,
    fontSize: 12,
    flex: 1,
  },

  /* ── CTA ── */
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
  },
  ctaBtnDisabled: { opacity: 0.65 },
  ctaBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  /* ── SIGN IN ── */
  signinRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  signinText: { color: GRAY_400, fontSize: 13 },
  signinLink: { color: PRIMARY, fontSize: 13, fontWeight: "800" },

  scroll: { flexGrow: 1 },
});

export default RegisterScreen;