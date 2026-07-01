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

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const { user: currentUser } = useContext(AuthContext);

  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const res = await api.get(ENDPOINTS.ADMIN_USERS);
      if (res.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch (e) {
      Alert.alert("Error", getErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const endpoint = currentStatus === 'SUSPENDED' 
        ? ENDPOINTS.ADMIN_ACTIVATE_USER(userId) 
        : ENDPOINTS.ADMIN_SUSPEND_USER(userId);
        
      const res = await api.patch(endpoint);
      if (res.data?.success) {
        Alert.alert("Success", "User status updated");
        fetchUsers();
      }
    } catch (e) {
      Alert.alert("Error", getErrorMessage(e));
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(search.toLowerCase())) || 
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: item.role === 'INSPECTOR' ? `${COLORS.primary}20` : `${COLORS.info}20` }]}>
          <Text style={[styles.badgeText, { color: item.role === 'INSPECTOR' ? COLORS.primary : COLORS.info }]}>
            {item.role}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.statusWrap}>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'SUSPENDED' ? COLORS.error : COLORS.success }]} />
          <Text style={styles.statusText}>{item.status || 'ACTIVE'}</Text>
        </View>
        
        {item._id !== currentUser._id && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: item.status === 'SUSPENDED' ? COLORS.success : COLORS.error }]}
              onPress={() => toggleUserStatus(item._id, item.status)}
            >
              <Text style={styles.actionBtnText}>{item.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Screen style={styles.container}>
      <Header title="User Management" showBack={false} />
      
      <View style={styles.searchBar}>
        <Icon name="magnify" size={20} color={COLORS.textLight} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchUsers} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="account-search-outline" size={60} color={COLORS.textGray} />
              <Text style={styles.emptyText}>No users found.</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    margin: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    height: 48,
    ...SHADOWS.sm
  },
  searchInput: { flex: 1, marginLeft: SPACING.sm, color: COLORS.textDark },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACING.md },
  userName: { fontSize: FONT_SIZES.base, fontWeight: "bold", color: COLORS.textDark },
  userEmail: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  statusWrap: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  actions: { flexDirection: 'row' },
  actionBtn: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: BORDER_RADIUS.sm },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyState: { padding: SPACING.xl, alignItems: "center", marginTop: 50 },
  emptyText: { color: COLORS.textLight, marginTop: SPACING.md }
});

export default UserManagementScreen;
