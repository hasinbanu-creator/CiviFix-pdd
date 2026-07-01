import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  ScrollView,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import authService, { getErrorMessage } from "../../services/authService";
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from "../../constants/theme";

const WardListScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadWards);
    return unsubscribe;
  }, [navigation]);

  const loadWards = async () => {
    try {
      setError("");
      let wardsData = [];
      if (user?.role === "INSPECTOR") {
        const res = await authService.getInspectorWard();
        const wardInfo = res?.ward_info ?? res?.data;
        if (wardInfo) wardsData = Array.isArray(wardInfo) ? wardInfo : [wardInfo];
      } else {
        const res = await authService.getWards({ page: 1, limit: 100 });
        wardsData = res?.wards ?? res?.data ?? [];
      }
      setWards(Array.isArray(wardsData) ? wardsData : []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load wards"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadWards();
  }, []);

  const filteredWards = wards.filter((ward) => {
    const query = searchQuery.toLowerCase();
    const name = (ward.ward_name || "").toLowerCase();
    const number = (ward.ward_number || "").toLowerCase();
    return name.includes(query) || number.includes(query);
  });

  const onWardPress = (ward) => {
    navigation.navigate("WardDetail", { ward });
  };

  // ─── COMPONENTS ─────────────────────────────────────────────────────────────

  const HeaderBar = () => (
    <View
      style={{
        backgroundColor: COLORS.primary,
        paddingTop: Platform.OS === "ios" ? insets.top : 16,
        paddingBottom: 16,
        paddingHorizontal: SPACING.lg,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: "700", color: "white" }}>
          Wards
        </Text>
      </View>
    </View>
  );

  const SearchBar = () => (
    <View
      style={{
        backgroundColor: COLORS.background,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#F3F4F6",
          borderRadius: 8,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <Icon name="magnify" size={20} color={COLORS.textLight} />
        <TextInput
          placeholder="Search wards..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{
            flex: 1,
            marginLeft: SPACING.sm,
            fontSize: FONT_SIZES.sm,
            color: COLORS.textDark,
          }}
          placeholderTextColor={COLORS.textLight}
        />
      </View>
    </View>
  );

  const WardStats = () => (
    <View style={{ backgroundColor: COLORS.background, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md }}>
      <View
        style={{
          flexDirection: "row",
          gap: SPACING.sm,
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "#DBEAFE",
            borderRadius: 8,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
          }}
        >
          <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: "700", color: COLORS.primary }}>
            Total: {wards.length}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "#D1FAE5",
            borderRadius: 8,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
          }}
        >
          <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: "700", color: "#059669" }}>
            Active: {wards.filter((w) => w.is_active).length}
          </Text>
        </View>
      </View>
    </View>
  );

  const WardCard = ({ ward }) => (
    <TouchableOpacity
      onPress={() => onWardPress(ward)}
      style={{
        backgroundColor: "white",
        borderRadius: 12,
        marginHorizontal: SPACING.lg,
        marginVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        ...SHADOWS.md,
        borderLeftWidth: 4,
        borderLeftColor: ward.inspector_id ? COLORS.primary : "#F3F4F6",
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
        <View
          style={{
            backgroundColor: ward.is_active ? "#D1FAE5" : "#FEE2E2",
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: "700", color: ward.is_active ? "#059669" : "#DC2626" }}>
            {ward.is_active ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: SPACING.md, flexDirection: "row", gap: SPACING.lg }}>
        <View>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textLight }}>Complaints</Text>
          <Text style={{ fontSize: FONT_SIZES.md, fontWeight: "700", color: COLORS.primary, marginTop: 4 }}>
            {ward.complaint_count || 0}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textLight }}>Active</Text>
          <Text style={{ fontSize: FONT_SIZES.md, fontWeight: "700", color: "#D97706", marginTop: 4 }}>
            {ward.active_complaints || 0}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textLight }}>Resolved</Text>
          <Text style={{ fontSize: FONT_SIZES.md, fontWeight: "700", color: "#059669", marginTop: 4 }}>
            {ward.closed_complaints || 0}
          </Text>
        </View>
      </View>

      {ward.inspector_id && (
        <View
          style={{
            marginTop: SPACING.md,
            paddingTop: SPACING.md,
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Icon name="account" size={16} color={COLORS.primary} />
          <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginLeft: SPACING.sm }}>
            Inspector Assigned
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: SPACING.lg }}>
      <Icon name="map-outline" size={64} color={COLORS.textLight} style={{ marginBottom: SPACING.lg }} />
      <Text style={{ fontSize: FONT_SIZES.md, fontWeight: "700", color: COLORS.textDark, marginBottom: SPACING.sm }}>
        No Wards Found
      </Text>
      <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textLight, textAlign: "center" }}>
        {searchQuery ? "No wards match your search" : "No wards available in this district"}
      </Text>
    </View>
  );

  const ErrorState = () => (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: SPACING.lg }}>
      <Icon name="alert-circle" size={64} color="#DC2626" style={{ marginBottom: SPACING.lg }} />
      <Text style={{ fontSize: FONT_SIZES.md, fontWeight: "700", color: COLORS.textDark, marginBottom: SPACING.sm }}>
        Error Loading Wards
      </Text>
      <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textLight, textAlign: "center", marginBottom: SPACING.lg }}>
        {error}
      </Text>
      <TouchableOpacity
        onPress={loadWards}
        style={{
          backgroundColor: COLORS.primary,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700", fontSize: FONT_SIZES.sm }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const LoadingState = () => (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ marginTop: SPACING.lg, color: COLORS.textLight, fontSize: FONT_SIZES.sm }}>
        Loading wards...
      </Text>
    </View>
  );

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <HeaderBar />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState />
      ) : (
        <>
          <SearchBar />
          <FlatList
            data={filteredWards}
            keyExtractor={(item) => item._id || item.ward_id || Math.random().toString()}
            renderItem={({ item }) => <WardCard ward={item} />}
            ListHeaderComponent={<WardStats />}
            ListEmptyComponent={<EmptyState />}
            ListFooterComponent={<View style={{ height: SPACING.lg }} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            contentContainerStyle={filteredWards.length === 0 && !loading ? { flex: 1 } : undefined}
          />
        </>
      )}
    </View>
  );
};

export default WardListScreen;
