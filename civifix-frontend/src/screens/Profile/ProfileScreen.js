import React, { useState, useContext, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { Card, GradientBackground } from "../../components";
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, SHADOWS } from "../../constants/theme";
import authService from "../../services/authService";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const ROLE_META = {
  SUPER_ADMIN:    { label: "Super Admin",     color: COLORS.primary, bg: "#DBEAFE", gradient: ["#0052CC", "#172B4D"] },
  DISTRICT_ADMIN: { label: "District Admin",  color: "#7C3AED",      bg: "#EDE9FE", gradient: ["#5B21B6", "#2D1B69"] },
  INSPECTOR:      { label: "Inspector",       color: "#0891B2",      bg: "#CFFAFE", gradient: ["#0E7490", "#164E63"] },
  WORKER:         { label: "Worker",          color: "#059669",      bg: "#D1FAE5", gradient: ["#065F46", "#022C22"] },
  CITIZEN:        { label: "Citizen",         color: "#D97706",      bg: "#FEF3C7", gradient: ["#0052CC", "#172B4D"] },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const Pill = ({ label, color, bg }) => (
  <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, alignSelf: "flex-start" }}>
    <Text style={{ color, fontSize: 10, fontWeight: "800" }}>{label}</Text>
  </View>
);

const InfoRow = ({ icon, value, color }) => {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: SPACING.sm }}>
      <Icon name={icon} size={13} color="rgba(255,255,255,0.7)" style={{ marginRight: SPACING.sm }} />
      <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: FONT_SIZES.xs, flex: 1 }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const StatBadge = ({ value, label }) => (
  <View style={{ alignItems: "center", paddingHorizontal: SPACING.md }}>
    <Text style={{ color: "#fff", fontSize: FONT_SIZES.lg, fontWeight: "900" }}>{value ?? "—"}</Text>
    <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 9.5, fontWeight: "600", marginTop: SPACING.xs }}>{label}</Text>
  </View>
);

const StatDivider = () => (
  <View style={{ width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" }} />
);

const SectionLabel = ({ children }) => (
  <Text style={{
    fontSize: 11, fontWeight: "800", color: COLORS.textLight,
    letterSpacing: 0.8, textTransform: "uppercase",
    marginBottom: SPACING.sm, marginTop: SPACING.xl,
    paddingHorizontal: 2,
  }}>
    {children}
  </Text>
);

const MenuItem = ({ icon, title, subtitle, color, onPress, danger, rightBadge, loading: itemLoading }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.72}
    disabled={itemLoading}
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.card,
      borderRadius: 12,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderWidth: danger ? 1 : 0,
      borderColor: danger ? `${COLORS.error}40` : "transparent",
      ...SHADOWS.md,
    }}
  >
    <View style={{
      width: 38, height: 38, borderRadius: 11,
      backgroundColor: danger ? `${COLORS.error}12` : `${color}12`,
      alignItems: "center", justifyContent: "center",
      marginRight: SPACING.md,
    }}>
      {itemLoading
        ? <ActivityIndicator size="small" color={color} />
        : <Icon name={icon} size={20} color={danger ? COLORS.error : color} />
      }
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{
        fontSize: FONT_SIZES.sm, fontWeight: "700",
        color: danger ? COLORS.error : COLORS.textDark,
      }}>
        {title}
      </Text>
      {!!subtitle && (
        <Text style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>{subtitle}</Text>
      )}
    </View>
    {rightBadge
      ? <View style={{ backgroundColor: `${color}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ color, fontSize: 10, fontWeight: "800" }}>{rightBadge}</Text>
        </View>
      : <Icon name="chevron-right" size={16} color={COLORS.textLight} />
    }
  </TouchableOpacity>
);

const WardInfoCard = ({ ward, onPress, wardLoading }) => {
  if (!ward) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      disabled={wardLoading}
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        ...SHADOWS.md,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.md, fontWeight: "700", color: COLORS.textDark }}>
            {ward.ward_name}
          </Text>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginTop: 4 }}>
            Ward #{ward.ward_number}
          </Text>
        </View>
        <Icon name="map-marker" size={20} color={COLORS.primary} />
      </View>

      {ward.description && (
        <Text
          numberOfLines={2}
          style={{
            fontSize: FONT_SIZES.xs,
            color: COLORS.textLight,
            marginTop: SPACING.md,
          }}
        >
          {ward.description}
        </Text>
      )}

      <View style={{ marginTop: SPACING.md, flexDirection: "row", gap: SPACING.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textLight }}>Complaints</Text>
          <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: "700", color: COLORS.primary, marginTop: 4 }}>
            {ward.complaint_count || 0}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textLight }}>Active</Text>
          <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: "700", color: "#D97706", marginTop: 4 }}>
            {ward.active_complaints || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── ROLE-BASED MENU BUILDER ─────────────────────────────────────────────────

const buildMenuSections = ({ role, navigation, meData }) => {
  const base = {
    account: [
      {
        id: "personal",
        title: "Personal Information",
        subtitle: "Edit name, phone, address",
        icon: "account",
        color: COLORS.primary,
        onPress: () => navigation.navigate("EditProfile"),
      },
      {
        id: "notifications",
        title: "My Notifications",
        subtitle: "View your latest alerts",
        icon: "bell",
        color: "#D97706",
        onPress: () => navigation.navigate("MyNotifications"),
      },
      {
        id: "settings",
        title: "Notification Settings",
        subtitle: "Manage your alert preferences",
        icon: "cog",
        color: COLORS.primary,
        onPress: () => navigation.navigate("NotificationPreferences"),
      },
    ],
    support: [
      {
        id: "help",
        title: "Help & FAQs",
        subtitle: "Frequently asked questions",
        icon: "help-circle",
        color: "#0891B2",
        onPress: () => navigation.navigate("FAQ"),
      },
      {
        id: "contact",
        title: "Contact Support",
        subtitle: "Get in touch with us",
        icon: "email",
        color: COLORS.primary,
        onPress: () => navigation.navigate("ContactSupport"),
      },
      {
        id: "about",
        title: "About CiviFix",
        subtitle: "Version, licenses",
        icon: "information",
        color: COLORS.textGray,
        onPress: () => {},
      },
    ],
  };

  // Role-specific sections
  const roleSection = [];

  if (role === "SUPER_ADMIN") {
    roleSection.push(
      { id: "districts", title: "Manage Districts",   subtitle: "View & create districts",     icon: "domain",                color: COLORS.primary, onPress: () => navigation.navigate("Districts")     },
      { id: "inspectors",title: "Manage Inspectors",  subtitle: "Assign & configure inspectors",icon: "account-tie",           color: "#0891B2",      onPress: () => navigation.navigate("InspectorsList") },
      { id: "workers",   title: "Manage Workers",     subtitle: "All workers across districts", icon: "account-hard-hat",      color: "#059669",      onPress: () => navigation.navigate("WorkersList")   },
      { id: "reports",   title: "Reports & Analytics",subtitle: "Platform-wide statistics",     icon: "chart-bar",             color: "#7C3AED",      onPress: () => navigation.navigate("Reports")       },
    );
  }

  if (role === "DISTRICT_ADMIN") {
    roleSection.push(
      { id: "inspectors",title: "My Inspectors",      subtitle: `District: ${meData?.district ?? "—"}`, icon: "account-tie",      color: "#0891B2",  onPress: () => navigation.navigate("InspectorsList") },
      { id: "workers",   title: "My Workers",         subtitle: "Workers in your district",              icon: "account-hard-hat", color: "#059669",  onPress: () => navigation.navigate("WorkersList")   },
      { id: "wards",     title: "Ward Management",    subtitle: "View and manage wards",                 icon: "map-marker-radius",color: COLORS.primary, onPress: () => navigation.navigate("Wards", { screen: "WardList" }) },
      { id: "complaints",title: "All Complaints",     subtitle: "District complaint board",              icon: "clipboard-list",   color: "#D97706",  onPress: () => navigation.getParent()?.navigate("Complaints") },
    );
  }

  if (role === "INSPECTOR") {
    // Inspector now uses the main AppStack tabs for Wards and Complaints.
    // The Profile screen only needs standard account and support items.
  }

  if (role === "WORKER") {
    roleSection.push(
      { id: "assigned",  title: "My Assignments",    subtitle: "Active tasks",            icon: "clipboard-check-outline", color: COLORS.primary, onPress: () => navigation.getParent()?.navigate("Complaints") },
      { id: "history",   title: "Work History",      subtitle: "Completed tasks",         icon: "history",                 color: "#059669",      onPress: () => navigation.navigate("WorkHistory") },
    );
  }

  if (role === "CITIZEN") {
    roleSection.push(
      { id: "complaints",title: "My Complaints",     subtitle: "Track your submissions",  icon: "clipboard-list",  color: COLORS.primary, onPress: () => navigation.getParent()?.navigate("Complaints") },
    );
  }

  return { roleSection, ...base };
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export const ProfileScreen = ({ navigation }) => {
  const { user, signOut } = useContext(AuthContext);
  const [meData, setMeData]   = useState(null);
  const [wardData, setWardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [meLoading, setMeLoading] = useState(true);
  const [wardLoading, setWardLoading] = useState(false);

  useEffect(() => { loadMe(); }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadWardData);
    return unsubscribe;
  }, [navigation, user?.role]);

  const loadMe = async () => {
    try {
      const res = await authService.getMe?.();
      setMeData(res?.data ?? null);
    } catch (e) { console.error("getMe failed:", e); }
    finally { setMeLoading(false); }
  };

  const loadWardData = async () => {
    if (user?.role !== "INSPECTOR" && user?.role !== "DISTRICT_ADMIN") return;

    try {
      setWardLoading(true);
      if (user?.role === "INSPECTOR") {
        const res = await authService.getInspectorWard?.();
        setWardData(res?.ward_info ?? res?.data ?? null);
      }
    } catch (e) {
      console.warn("Ward data fetch failed:", e);
      setWardData(null);
    } finally {
      setWardLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            await signOut();
            setLoading(false);
          },
        },
      ]
    );
  };

  // Derived values
  const displayName  = user?.name  || meData?.email?.split("@")[0] || "Welcome Back!";
  const displayEmail = meData?.email ?? user?.email ?? "";
  const displayPhone = user?.mobile_number ?? user?.mobile ?? "";
  const role         = meData?.role ?? user?.role ?? "CITIZEN"
  const district     = meData?.district ?? user?.district ?? "";
  const roleMeta     = ROLE_META[role] ?? ROLE_META.CITIZEN;

  // Stats row in header — role-dependent
  const headerStats =
    role === "SUPER_ADMIN"    ? [{ value: "—", label: "Districts" }, { value: "—", label: "Complaints" }, { value: "—", label: "Workers" }] :
    role === "DISTRICT_ADMIN" ? [{ value: "—", label: "Inspectors" }, { value: "—", label: "Workers" }, { value: "—", label: "Complaints" }] :
    role === "INSPECTOR"      ? [{ value: "—", label: "Open" }, { value: "—", label: "In Progress" }, { value: "—", label: "Resolved" }] :
    role === "WORKER"         ? [{ value: "—", label: "Assigned" }, { value: "—", label: "Active" }, { value: "—", label: "Done" }] :
    /* CITIZEN */               [{ value: "—", label: "Submitted" }, { value: "—", label: "Active" }, { value: "—", label: "Resolved" }];

  const { roleSection, account, support } = buildMenuSections({ role, navigation, meData });

  const roleSectionTitle = {
    SUPER_ADMIN:    "Administration",
    DISTRICT_ADMIN: "District Management",
    INSPECTOR:      "Inspector Tools",
    WORKER:         "My Work",
    CITIZEN:        "My Activity",
  }[role] ?? "My Activity";

  return (
    <View style={{ flex: 1, backgroundColor: "#F0F4F8" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Hero header card ── */}
        <LinearGradient
          colors={roleMeta.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 56,
            paddingHorizontal: SPACING.lg,
            paddingBottom: 28,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        >
          {/* Top row: back + title */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: SPACING.xl }}>
            <TouchableOpacity
              onPress={() => navigation.goBack?.()}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center", justifyContent: "center", marginRight: SPACING.md,
              }}
            >
              <Icon name="arrow-left" size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: "#fff", fontSize: FONT_SIZES.md, fontWeight: "800", flex: 1 }}>Profile</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("EditProfile")}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="pencil-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar + info */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: SPACING.xl }}>
            <View style={{
              width: 68, height: 68, borderRadius: 34,
              backgroundColor: "rgba(255,255,255,0.22)",
              alignItems: "center", justifyContent: "center",
              marginRight: SPACING.lg,
              borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
            }}>
              {meLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900" }}>{initials(displayName)}</Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: FONT_SIZES.xl, fontWeight: "900", marginBottom: 2 }}
                numberOfLines={1}>
                {displayName}
              </Text>
              <InfoRow icon="email-outline"     value={displayEmail} />
              <InfoRow icon="phone-outline"     value={displayPhone || undefined} />
              <InfoRow icon="map-marker-outline" value={district || undefined} />
              <View style={{ marginTop: 8 }}>
                <Pill label={roleMeta.label} color={roleMeta.color} bg="rgba(255,255,255,0.22)" />
              </View>
            </View>
          </View>

          {/* Stats strip */}
          <View style={{
            flexDirection: "row", alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: 12, paddingVertical: SPACING.md,
            justifyContent: "center",
          }}>
            {headerStats.map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <StatDivider />}
                <StatBadge value={s.value} label={s.label} />
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        {/* ── Content ── */}
        <View style={{ paddingHorizontal: SPACING.lg }}>



          {/* Role section */}
          {roleSection.length > 0 && (
            <>
              <SectionLabel>{roleSectionTitle}</SectionLabel>
              {roleSection.map((item) => <MenuItem key={item.id} {...item} />)}
            </>
          )}

          {/* Account section */}
          <SectionLabel>Account</SectionLabel>
          {account.map((item) => <MenuItem key={item.id} {...item} />)}

          {/* Support section */}
          <SectionLabel>Support</SectionLabel>
          {support.map((item) => <MenuItem key={item.id} {...item} />)}

          {/* Logout */}
          <SectionLabel>Session</SectionLabel>
          <MenuItem
            id="logout"
            title="Logout"
            subtitle="You'll need to sign in again"
            icon="logout"
            color={COLORS.error}
            danger
            loading={loading}
            onPress={handleLogout}
          />

          {/* Footer */}
          <View style={{ alignItems: "center", marginTop: SPACING.xxl, paddingBottom: SPACING.md }}>
            <Text style={{ color: COLORS.textLight, fontSize: FONT_SIZES.xs, fontWeight: "700" }}>
              CiviFix v1.0.0
            </Text>
            <Text style={{ color: COLORS.textLight, fontSize: FONT_SIZES.xs, marginTop: 4, opacity: 0.7 }}>
              © 2025 CiviFix. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;