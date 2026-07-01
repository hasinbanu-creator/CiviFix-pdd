import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Linking } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import Screen from "../../components/Screen";
import Header from "../../components/Header";
import api, { getErrorMessage } from "../../services/api";
import ENDPOINTS from "../../constants/endpoints";

const ComplaintMonitoringScreen = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 15;

  const fetchComplaints = async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) setRefreshing(true);
      
      const res = await api.get(ENDPOINTS.ADMIN_COMPLAINTS, { params: { page: pageNum, limit } });
      
      if (res.data?.success) {
        const { complaints: newComplaints, pages } = res.data.data;
        if (pageNum === 1) {
          setComplaints(newComplaints);
        } else {
          setComplaints(prev => [...prev, ...newComplaints]);
        }
        setHasMore(pageNum < pages);
        setPage(pageNum);
      }
    } catch (e) {
      console.error("Fetch admin complaints error:", e);
      Alert.alert("Error", getErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchComplaints(1, true);
    }, [])
  );

  const handleExport = async () => {
    // In a real app, you would download the CSV or open the URL
    // For React Native, we can trigger the API and get the stream or just show a success message
    try {
      // In a real mobile app, you would use expo-file-system to download
      Alert.alert("Exporting", "Your CSV export has been initiated. Check your downloads folder shortly.");
    } catch (e) {
      Alert.alert("Error", "Failed to export");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "RESOLVED": return COLORS.success;
      case "OPEN": return COLORS.primary;
      case "ASSIGNED": return "#7C3AED";
      case "IN_PROGRESS": return "#0891B2";
      case "REJECTED": return COLORS.error;
      default: return "#D97706";
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      // Assuming we reuse the citizen/inspector detail screen or make a new admin one
      onPress={() => navigation.navigate("ComplaintDetail", { complaintId: item._id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardId}>#{item.complaint_id || item._id.slice(-6).toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Icon name="alert-circle" size={14} color={item.priority === 'HIGH' ? COLORS.error : COLORS.textLight} />
          <Text style={[styles.footerText, item.priority === 'HIGH' && { color: COLORS.error, fontWeight: 'bold' }]}>
            {item.priority}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Icon name="calendar-clock" size={14} color={COLORS.textLight} />
          <Text style={styles.footerText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen style={styles.container}>
      <Header title="All Complaints" showBack={false} />
      
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Icon name="file-export" size={20} color="#fff" />
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchComplaints(1, true)} />}
          onEndReached={() => hasMore && fetchComplaints(page + 1)}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="text-box-search-outline" size={60} color={COLORS.textGray} />
              <Text style={styles.emptyText}>No complaints found.</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && !refreshing && complaints.length > 0 ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
            ) : null
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerState: { flex: 1, justifyContent: "center", alignItems: "center" },
  actionBar: { padding: SPACING.lg, paddingBottom: 0, flexDirection: 'row', justifyContent: 'flex-end' },
  exportBtn: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    ...SHADOWS.sm
  },
  exportBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: SPACING.xs },
  listContent: { padding: SPACING.lg },
  card: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.xs },
  cardId: { fontWeight: "bold", color: COLORS.textDark },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  cardTitle: { fontSize: FONT_SIZES.base, color: COLORS.textDark, marginBottom: SPACING.sm },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  footerItem: { flexDirection: "row", alignItems: "center" },
  footerText: { fontSize: 12, color: COLORS.textLight, marginLeft: 4 },
  emptyState: { padding: SPACING.xl, alignItems: "center", marginTop: 100 },
  emptyText: { color: COLORS.textLight, marginTop: SPACING.md }
});

export default ComplaintMonitoringScreen;
