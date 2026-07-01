import React, { useState, useCallback, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import Screen from "../../components/Screen";
import Header from "../../components/Header";
import api, { getErrorMessage } from "../../services/api";
import ENDPOINTS from "../../constants/endpoints";
import { AuthContext } from "../../context/AuthContext";

const SystemSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    allow_new_registrations: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useContext(AuthContext);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const fetchSettings = async () => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await api.get(ENDPOINTS.ADMIN_APP_SETTINGS);
      if (res.data?.success) {
        setSettings(res.data.data || {
          maintenance_mode: false,
          allow_new_registrations: true
        });
      }
    } catch (e) {
      console.warn("Failed to fetch settings", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [isSuperAdmin])
  );

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put(ENDPOINTS.ADMIN_APP_SETTINGS, settings);
      if (res.data?.success) {
        Alert.alert("Success", "Settings saved successfully.");
      }
    } catch (e) {
      Alert.alert("Error", getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <Screen style={styles.container}>
        <Header title="System Settings" showBack={false} />
        <View style={styles.centerState}>
          <Icon name="lock-outline" size={60} color={COLORS.textGray} />
          <Text style={styles.emptyText}>Only Super Admins can modify settings.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <Header title="System Settings" showBack={false} />
      
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <Text style={styles.sectionTitle}>Application State</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Icon name="alert-circle-outline" size={24} color={COLORS.error} style={{marginRight: 10}} />
              <View style={{flex: 1}}>
                <Text style={styles.settingTitle}>Maintenance Mode</Text>
                <Text style={styles.settingSub}>Disables access for all non-admin users.</Text>
              </View>
              <Switch 
                value={settings.maintenance_mode}
                onValueChange={() => handleToggle('maintenance_mode')}
                trackColor={{ false: "#767577", true: `${COLORS.error}80` }}
                thumbColor={settings.maintenance_mode ? COLORS.error : "#f4f3f4"}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Icon name="account-plus-outline" size={24} color={COLORS.primary} style={{marginRight: 10}} />
              <View style={{flex: 1}}>
                <Text style={styles.settingTitle}>Allow Registrations</Text>
                <Text style={styles.settingSub}>Permits new citizens to register accounts.</Text>
              </View>
              <Switch 
                value={settings.allow_new_registrations}
                onValueChange={() => handleToggle('allow_new_registrations')}
                trackColor={{ false: "#767577", true: `${COLORS.success}80` }}
                thumbColor={settings.allow_new_registrations ? COLORS.success : "#f4f3f4"}
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, {marginTop: SPACING.xl}]}>SLA Configuration</Text>

          <TouchableOpacity style={styles.linkCard} onPress={() => Alert.alert("SLA Config", "This opens a modal to define SLA rules for specific categories.")}>
            <Icon name="clock-fast" size={24} color={COLORS.info} style={{marginRight: 10}} />
            <Text style={styles.linkText}>Manage Resolution SLAs</Text>
            <Icon name="chevron-right" size={24} color={COLORS.textLight} />
          </TouchableOpacity>

        </ScrollView>
      )}

      {isSuperAdmin && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Settings</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerState: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.xl },
  scrollContent: { padding: SPACING.lg, paddingBottom: 100 },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: "700", color: COLORS.textDark, marginBottom: SPACING.md },
  settingCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm
  },
  settingHeader: { flexDirection: "row", alignItems: "center" },
  settingTitle: { fontSize: FONT_SIZES.base, fontWeight: "bold", color: COLORS.textDark },
  settingSub: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm
  },
  linkText: { flex: 1, fontSize: FONT_SIZES.base, fontWeight: "bold", color: COLORS.textDark },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center'
  },
  saveBtnText: { color: '#fff', fontSize: FONT_SIZES.md, fontWeight: 'bold' },
  emptyText: { color: COLORS.textLight, marginTop: SPACING.md, textAlign: 'center' }
});

export default SystemSettingsScreen;
