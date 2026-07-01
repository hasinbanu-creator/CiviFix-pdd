import React, { useState, useCallback, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import Screen from "../../components/Screen";
import Header from "../../components/Header";
import api from "../../services/api";
import ENDPOINTS from "../../constants/endpoints";
import { AuthContext } from "../../context/AuthContext";

const StatCard = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.8} disabled={!onPress}>
    <View style={styles.statContent}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
    <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
      <Icon name={icon} size={28} color={color} />
    </View>
  </TouchableOpacity>
);

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useContext(AuthContext);
  
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const fetchStats = async () => {
    try {
      // Use different endpoints depending on role
      const endpoint = isSuperAdmin ? ENDPOINTS.GET_SUPER_ADMIN_DASHBOARD : ENDPOINTS.GET_DISTRICT_ADMIN_DASHBOARD;
      const res = await api.get(endpoint);
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [isSuperAdmin])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <Screen style={styles.container}>
      <Header title={`${isSuperAdmin ? 'Global' : 'District'} Dashboard`} showBack={false} />
      
      {loading && !stats ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Complaints" 
              value={stats?.total_complaints || 0} 
              icon="file-document-multiple" 
              color={COLORS.primary} 
              onPress={() => navigation.navigate("ComplaintMonitoring")}
            />
            {isSuperAdmin && (
              <StatCard 
                title="Districts" 
                value={stats?.total_districts || 0} 
                icon="map-marker-multiple" 
                color={COLORS.info} 
                onPress={() => navigation.navigate("TerritoryManagement")}
              />
            )}
            <StatCard 
              title="Inspectors" 
              value={stats?.total_inspectors || 0} 
              icon="account-tie" 
              color={COLORS.success} 
              onPress={() => navigation.navigate("UserManagement")}
            />
            <StatCard 
              title={isSuperAdmin ? "Wards" : "Workers"} 
              value={isSuperAdmin ? (stats?.total_wards || 0) : (stats?.total_workers || 0)} 
              icon={isSuperAdmin ? "home-group" : "account-hard-hat"} 
              color={COLORS.warning} 
            />
          </View>

          {stats?.high_priority_count > 0 && (
            <TouchableOpacity 
              style={styles.alertBanner} 
              onPress={() => navigation.navigate("ComplaintMonitoring")}
              activeOpacity={0.85}
            >
              <Icon name="alert-circle" size={24} color="#fff" />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{stats.high_priority_count} SLA Breaches</Text>
                <Text style={styles.alertSub}>Require immediate attention</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          
          {/* We can add quick actions for Admin here */}
          <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("ComplaintMonitoring")}>
             <Icon name="clipboard-check" size={24} color={COLORS.primary} style={styles.actionIcon} />
             <View style={{flex: 1}}>
                <Text style={styles.actionTitle}>Assign Complaints</Text>
                <Text style={styles.actionSub}>View pending complaints and assign inspectors</Text>
             </View>
             <Icon name="chevron-right" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("UserManagement")}>
             <Icon name="account-plus" size={24} color={COLORS.success} style={styles.actionIcon} />
             <View style={{flex: 1}}>
                <Text style={styles.actionTitle}>Manage Users</Text>
                <Text style={styles.actionSub}>Add or suspend users and update roles</Text>
             </View>
             <Icon name="chevron-right" size={24} color={COLORS.textLight} />
          </TouchableOpacity>

        </ScrollView>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerState: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: "700", color: COLORS.textDark, marginBottom: SPACING.md },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: {
    width: "48%", backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md, borderLeftWidth: 4, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", ...SHADOWS.sm
  },
  statContent: { flex: 1 },
  statTitle: { fontSize: 13, color: COLORS.textLight, fontWeight: "500" },
  statValue: { fontSize: 24, fontWeight: "bold", marginTop: SPACING.xs },
  statIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  alertBanner: {
    flexDirection: "row", backgroundColor: COLORS.error, padding: SPACING.md, borderRadius: BORDER_RADIUS.md,
    alignItems: "center", marginTop: SPACING.sm, ...SHADOWS.sm
  },
  alertContent: { flex: 1, marginLeft: SPACING.md },
  alertTitle: { color: "#fff", fontWeight: "bold", fontSize: FONT_SIZES.base },
  alertSub: { color: "#fff", opacity: 0.8, fontSize: 13 },
  actionCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    alignItems: "center",
    ...SHADOWS.sm
  },
  actionIcon: {
    marginRight: SPACING.md,
    backgroundColor: `${COLORS.background}`,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md
  },
  actionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 2
  },
  actionSub: {
    fontSize: 12,
    color: COLORS.textLight
  }
});

export default AdminDashboardScreen;
