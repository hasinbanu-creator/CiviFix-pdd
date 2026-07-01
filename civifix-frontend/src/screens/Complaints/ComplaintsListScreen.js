import React, { useCallback, useEffect, useState, useContext } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  StatusBar,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import authService from "../../services/authService";
import { AuthContext } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";
import ComplaintCard from "./ComplaintCard";

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const PRIMARY       = "#2563EB";
const PRIMARY_LIGHT = "#EFF6FF";
const ERROR         = "#DC2626";
const GRAY_50       = "#F9FAFB";
const GRAY_100      = "#F3F4F6";
const GRAY_200      = "#E5E7EB";
const GRAY_400      = "#9CA3AF";
const GRAY_600      = "#4B5563";
const GRAY_800      = "#1F2937";
const SUCCESS       = "#059669";

// ─── STATUS CONFIG (for filter tabs) ─────────────────────────────────────────
const FILTERS = [
  { key: "ALL",         label: "All",         icon: "format-list-bulleted"     },
  { key: "ACTIVE",      label: "Active",      icon: "progress-wrench"          },
  { key: "RESOLVED",    label: "Resolved",    icon: "check-circle-outline"     },
  { key: "REOPENED",    label: "Reopened",    icon: "folder-open-outline"      },
  { key: "CLOSED",      label: "Closed",      icon: "archive-outline"          },
];

const STATUS_COLOR = {
  PENDING:     "#D97706",
  OPEN:        PRIMARY,
  ASSIGNED:    "#7C3AED",
  IN_PROGRESS: "#0891B2",
  RESOLVED:    SUCCESS,
  CLOSED:      GRAY_400,
  REJECTED:    ERROR,
};

const CATEGORIES = [
  { value: "ALL", label: "All Types" },
  { value: "GARBAGE", label: "Garbage" },
  { value: "ROAD_DAMAGE", label: "Roads" },
  { value: "POTHOLE", label: "Pothole" },
  { value: "STREETLIGHT", label: "Lights" },
  { value: "WATER_SUPPLY", label: "Water" },
  { value: "DRAINAGE", label: "Drainage" },
  { value: "SANITATION", label: "Sanitation" },
  { value: "TREE_CUTTING", label: "Trees" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "OTHER", label: "Other" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const extractComplaints = (payload) => {
  if (Array.isArray(payload))             return payload;
  if (Array.isArray(payload?.data))       return payload.data;
  if (Array.isArray(payload?.complaints)) return payload.complaints;
  return [];
};

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
const EmptyState = ({ onPress }) => (
  <View style={styles.emptyWrap}>
    <View style={styles.emptyIconWrap}>
      <Icon name="clipboard-text-outline" size={40} color={GRAY_400} />
    </View>
    <Text style={styles.emptyTitle}>No complaints yet</Text>
    <Text style={styles.emptySub}>
      Raise your first civic issue and follow its status right here.
    </Text>
    <TouchableOpacity style={styles.emptyBtn} onPress={onPress} activeOpacity={0.85}>
      <Icon name="plus" size={18} color="#fff" />
      <Text style={styles.emptyBtnText}>Raise a Complaint</Text>
    </TouchableOpacity>
  </View>
);

// ─── ERROR STATE ──────────────────────────────────────────────────────────────
const ErrorState = ({ message, onRetry }) => (
  <View style={styles.errorWrap}>
    <View style={styles.errorIconWrap}>
      <Icon name="wifi-off" size={36} color={ERROR} />
    </View>
    <Text style={styles.errorTitle}>Couldn't load complaints</Text>
    <Text style={styles.errorSub}>{message}</Text>
    <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.85}>
      <Icon name="refresh" size={16} color="#fff" />
      <Text style={styles.retryText}>Try again</Text>
    </TouchableOpacity>
  </View>
);

// ─── SUMMARY CHIPS ────────────────────────────────────────────────────────────
const SummaryChips = ({ complaints }) => {
  const counts = complaints.reduce((acc, c) => {
    const s = (c.status || "PENDING").toUpperCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const chips = [
    { label: "Total",       value: complaints.length,        color: PRIMARY  },
    { label: "Active",      value: (counts.OPEN || 0) + (counts.IN_PROGRESS || 0) + (counts.ASSIGNED || 0), color: "#0891B2" },
    { label: "Resolved",    value: counts.RESOLVED || 0,     color: SUCCESS  },
    { label: "Rejected",    value: counts.REJECTED || 0,     color: ERROR    },
  ];

  return (
    <View style={styles.chipsRow}>
      {chips.map((chip) => (
        <View key={chip.label} style={styles.chip}>
          <Text style={[styles.chipValue, { color: chip.color }]}>{chip.value}</Text>
          <Text style={styles.chipLabel}>{chip.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── FILTER TABS ──────────────────────────────────────────────────────────────
const FilterTabs = ({ active, onChange, complaints }) => {
  const counts = complaints.reduce((acc, c) => {
    const s = (c.status || "PENDING").toUpperCase();
    if (["PENDING", "OPEN", "ASSIGNED", "IN_PROGRESS"].includes(s)) acc["ACTIVE"] = (acc["ACTIVE"] || 0) + 1;
    else acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <View>
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item: f }) => {
          const isSel = active === f.key;
          const count = f.key === "ALL" ? complaints.length : (counts[f.key] || 0);
          return (
            <TouchableOpacity
              onPress={() => onChange(f.key)}
              activeOpacity={0.75}
              style={[styles.filterTab, isSel && styles.filterTabActive]}
            >
              <Icon name={f.icon} size={13} color={isSel ? PRIMARY : GRAY_400} />
              <Text style={[styles.filterTabText, isSel && styles.filterTabTextActive]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[styles.filterBadge, isSel && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, isSel && styles.filterBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export const ComplaintsListScreen = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [activeCategory, setActiveCategory] = useState("ALL");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { user } = useContext(AuthContext);

  const loadComplaints = useCallback(async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError("");
      
      let payload;
      if (user?.role === "INSPECTOR") {
        payload = await authService.getWardComplaints({ page: pageNum, limit: 10 });
      } else if (user?.role === "WORKER") {
        payload = await authService.getAssignedComplaints({ page: pageNum, limit: 10 });
      } else {
        payload = await authService.getComplaints({ page: pageNum, limit: 10 });
      }
      
      const newComplaints = extractComplaints(payload);
      if (pageNum === 1) {
        setComplaints(newComplaints);
      } else {
        setComplaints(prev => [...prev, ...newComplaints]);
      }
      setHasMore(newComplaints.length === 10);
      setPage(pageNum);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load complaints"));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadComplaints);
    return unsubscribe;
  }, [loadComplaints, navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadComplaints();
  };

  const filtered = complaints.filter((c) => {
    const s = (c.status || "").toUpperCase();
    let matchesStatus = false;
    if (activeFilter === "ALL") matchesStatus = true;
    else if (activeFilter === "ACTIVE") matchesStatus = ["PENDING", "OPEN", "ASSIGNED", "IN_PROGRESS"].includes(s);
    else matchesStatus = s === activeFilter;

    const matchesCategory = activeCategory === "ALL" || c.complaint_type === activeCategory;
    return matchesStatus && matchesCategory;
  });

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── Header ── */}
      <View style={styles.headerBar}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Complaints</Text>
          <Text style={styles.headerSub}>Track your civic issues</Text>
        </View>
        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => navigation.navigate("SavedDrafts")}
          activeOpacity={0.85}
        >
          <Icon name="file-document-edit-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Loading ── */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading complaints…</Text>
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={loadComplaints} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id || item.complaint_id || String(Math.random())}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasMore && !loadingMore && !loading) {
              loadComplaints(page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={11}
          removeClippedSubviews={true}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={PRIMARY} style={{ margin: 20 }} /> : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
          ListHeaderComponent={
            complaints.length > 0 ? (
              <View>
                {/* Summary chips */}
                <SummaryChips complaints={complaints} />

                {/* Category Filter */}
                <FlatList
                  horizontal
                  data={CATEGORIES}
                  keyExtractor={(c) => c.value}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryList}
                  renderItem={({ item }) => {
                    const isSel = activeCategory === item.value;
                    return (
                      <TouchableOpacity
                        onPress={() => setActiveCategory(item.value)}
                        style={[styles.categoryChip, isSel && styles.categoryChipActive]}
                      >
                        <Text style={[styles.categoryChipText, isSel && styles.categoryChipTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />

                {/* Filter tabs */}
                <FilterTabs
                  active={activeFilter}
                  onChange={setActiveFilter}
                  complaints={complaints}
                />

                {/* Result count */}
                <View style={styles.resultRow}>
                  <Text style={styles.resultText}>
                    {filtered.length} {activeFilter === "ALL" ? "total" : activeFilter.toLowerCase().replace("_", " ")} complaint{filtered.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            complaints.length === 0
              ? <EmptyState onPress={() => navigation.navigate("CreateComplaint")} />
              : (
                <View style={styles.filterEmptyWrap}>
                  <Icon name="filter-off-outline" size={32} color={GRAY_400} />
                  <Text style={styles.filterEmptyText}>
                    No {activeFilter.toLowerCase().replace("_", " ")} complaints
                  </Text>
                  <TouchableOpacity onPress={() => setActiveFilter("ALL")}>
                    <Text style={styles.filterEmptyLink}>Show all</Text>
                  </TouchableOpacity>
                </View>
              )
          }
          renderItem={({ item }) => (
            <ComplaintCard
              complaint={item}
              onPress={() => navigation.navigate("ComplaintDetail", { complaint: item })}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListFooterComponent={<View style={{ height: 32 }} />}
        />
      )}


    </View>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: GRAY_50 },

  /* header */
  headerBar: {
    backgroundColor: PRIMARY,
    flexDirection: "row", alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 52 : 16,
    paddingBottom: 16, paddingHorizontal: 16, gap: 12,
  },
  headerCenter: { flex: 1 },
  headerTitle:  { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  headerSub:    { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 },
  headerAddBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  /* summary chips */
  chipsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, paddingVertical: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  chip:       { flex: 1, alignItems: "center" },
  chipValue:  { fontSize: 20, fontWeight: "900" },
  chipLabel:  { fontSize: 10, color: GRAY_400, fontWeight: "600", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.4 },

  /* Search */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: GRAY_200,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: GRAY_800 },
  
  /* Categories */
  categoryList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: GRAY_200,
  },
  categoryChipActive: { backgroundColor: PRIMARY },
  categoryChipText: { fontSize: 12, fontWeight: "600", color: GRAY_600 },
  categoryChipTextActive: { color: "#fff" },

  /* filter tabs */
  filterList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: GRAY_200,
  },
  filterTabActive:      { backgroundColor: PRIMARY_LIGHT, borderColor: PRIMARY },
  filterTabText:        { fontSize: 12, fontWeight: "600", color: GRAY_400 },
  filterTabTextActive:  { color: PRIMARY, fontWeight: "700" },
  filterBadge: {
    backgroundColor: GRAY_100, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  filterBadgeActive:    { backgroundColor: PRIMARY + "20" },
  filterBadgeText:      { fontSize: 10, fontWeight: "700", color: GRAY_400 },
  filterBadgeTextActive:{ color: PRIMARY },

  /* result row */
  resultRow: { paddingHorizontal: 16, paddingBottom: 8 },
  resultText: { fontSize: 11, color: GRAY_400, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },

  /* list */
  listContent: { paddingHorizontal: 16, paddingTop: 2 },

  /* loading */
  centerState:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:  { color: GRAY_400, fontSize: 14, marginTop: 4 },

  /* empty */
  emptyWrap: {
    alignItems: "center", paddingHorizontal: 32,
    paddingTop: 48, paddingBottom: 32,
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: GRAY_100, alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle:   { fontSize: 18, fontWeight: "800", color: GRAY_800, marginBottom: 8 },
  emptySub:     { fontSize: 13, color: GRAY_400, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: PRIMARY, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  /* filter empty */
  filterEmptyWrap: { alignItems: "center", paddingTop: 40, gap: 8 },
  filterEmptyText: { fontSize: 14, color: GRAY_600, fontWeight: "600" },
  filterEmptyLink: { color: PRIMARY, fontSize: 13, fontWeight: "700", marginTop: 4 },

  /* error */
  errorWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  errorTitle:  { fontSize: 17, fontWeight: "700", color: GRAY_800 },
  errorSub:    { fontSize: 13, color: GRAY_400, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 8, backgroundColor: PRIMARY,
    paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  /* FABs */
  fabContainer: {
    position: "absolute",
    bottom: 24,
    right: 20,
    flexDirection: "row",
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: PRIMARY,
    alignItems: "center", justifyContent: "center",
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
});

export default ComplaintsListScreen;