import React, { useState, useCallback, useContext } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, TextInput } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import Screen from "../../components/Screen";
import Header from "../../components/Header";
import api, { getErrorMessage } from "../../services/api";
import ENDPOINTS from "../../constants/endpoints";
import { AuthContext } from "../../context/AuthContext";

const TerritoryManagementScreen = ({ navigation }) => {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user: currentUser } = useContext(AuthContext);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const fetchTerritories = async () => {
    try {
      setRefreshing(true);
      // Let's just fetch wards for the district (or all if SuperAdmin)
      const res = await api.get("/wards");
      if (res.data?.success) {
        setWards(res.data.data || []);
      }
    } catch (e) {
      console.warn("Could not fetch wards properly using /wards, fallback to admin/wards", e);
      try {
        const res2 = await api.get("/admin/wards");
        if (res2.data?.success) setWards(res2.data.data || []);
      } catch (err) {
        // Just fail silently for UI demo if no endpoint match
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTerritories();
    }, [])
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon name="home-group" size={24} color={COLORS.primary} style={{marginRight: 10}} />
        <View style={{flex: 1}}>
          <Text style={styles.wardName}>{item.ward_name}</Text>
          {item.zone && <Text style={styles.wardZone}>Zone: {item.zone}</Text>}
        </View>
        <View style={styles.complaintCount}>
          <Text style={styles.countText}>{item.complaint_count || 0}</Text>
          <Text style={styles.countLabel}>Issues</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Screen style={styles.container}>
      <Header title="Territory Management" showBack={false} />
      
      <View style={styles.headerTabs}>
        <View style={[styles.tab, styles.activeTab]}>
          <Text style={styles.activeTabText}>Wards</Text>
        </View>
        {isSuperAdmin && (
          <View style={styles.tab}>
            <Text style={styles.tabText}>Districts</Text>
          </View>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={wards}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchTerritories} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="map-marker-off" size={60} color={COLORS.textGray} />
              <Text style={styles.emptyText}>No territories configured.</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerState: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textLight, fontWeight: 'bold' },
  activeTabText: { color: COLORS.primary, fontWeight: 'bold' },
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  wardName: { fontSize: FONT_SIZES.base, fontWeight: "bold", color: COLORS.textDark },
  wardZone: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  complaintCount: { alignItems: 'center', backgroundColor: `${COLORS.primary}15`, padding: SPACING.sm, borderRadius: BORDER_RADIUS.sm },
  countText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  countLabel: { fontSize: 10, color: COLORS.textLight },
  emptyState: { padding: SPACING.xl, alignItems: "center", marginTop: 50 },
  emptyText: { color: COLORS.textLight, marginTop: SPACING.md }
});

export default TerritoryManagementScreen;
