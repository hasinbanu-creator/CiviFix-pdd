import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
  TextInput,
  Image,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import authService from "../../services/authService";
import { getErrorMessage } from "../../services/api";
import { SPACING } from "../../constants/theme";

import { API_URL } from "../../constants/endpoints";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ── Design tokens ── */
const PRIMARY       = "#2563EB";
const PRIMARY_LIGHT = "#EFF6FF";
const GRAY_50       = "#F9FAFB";
const GRAY_100      = "#F3F4F6";
const GRAY_200      = "#E5E7EB";
const GRAY_400      = "#9CA3AF";
const GRAY_500      = "#6B7280";
const GRAY_600      = "#4B5563";
const GRAY_800      = "#1F2937";
const ERROR         = "#DC2626";

/* ── Status config ── */
const STATUS_CONFIG = {
  pending:     { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "clock-outline",           label: "Pending"     },
  open:        { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "folder-open-outline",     label: "Open"        },
  assigned:    { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: "account-hard-hat-outline", label: "Assigned"   },
  in_progress: { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", icon: "progress-wrench",         label: "In Progress" },
  resolved:    { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: "check-circle-outline",    label: "Resolved"    },
  closed:      { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", icon: "archive-outline",         label: "Closed"      },
  rejected:    { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "close-circle-outline",    label: "Rejected"    },
};

const PRIORITY_CONFIG = {
  low:      { color: "#059669", bg: "#ECFDF5", icon: "arrow-down-circle-outline" },
  medium:   { color: "#D97706", bg: "#FFFBEB", icon: "minus-circle-outline"      },
  high:     { color: "#DC2626", bg: "#FEF2F2", icon: "arrow-up-circle-outline"   },
  critical: { color: "#7C2D12", bg: "#FFF7ED", icon: "alert-circle-outline"      },
};

function getStatus(key) {
  return STATUS_CONFIG[(key || "").toLowerCase()] || STATUS_CONFIG.pending;
}
function getPriority(key) {
  return PRIORITY_CONFIG[(key || "").toLowerCase()] || PRIORITY_CONFIG.medium;
}

/* ── Helpers ── */
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    "  " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function humaniseType(type) {
  return (type || "Complaint").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Sub-components ── */
function StatusBadge({ status }) {
  const cfg = getStatus(status);
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Icon name={cfg.icon} size={13} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function PriorityBadge({ priority }) {
  const cfg = getPriority(priority);
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: "transparent" }]}>
      <Icon name={cfg.icon} size={13} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>
        {(priority || "Medium").replace(/\b\w/g, (c) => c.toUpperCase())}
      </Text>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Icon name={icon} size={15} color={PRIMARY} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function NoteCard({ icon, label, value, color }) {
  if (!value) return null;
  return (
    <View style={[styles.noteCard, { borderLeftColor: color }]}>
      <View style={styles.noteHeader}>
        <Icon name={icon} size={14} color={color} />
        <Text style={[styles.noteLabel, { color }]}>{label}</Text>
      </View>
      <Text style={styles.noteValue}>{value}</Text>
    </View>
  );
}

function SectionTitle({ title, icon }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.sectionIconWrap}>
        <Icon name={icon} size={14} color={PRIMARY} />
      </View>
      <Text style={styles.sectionTitleText}>{title}</Text>
    </View>
  );
}

function HistoryItem({ item, complaint, isLast }) {
  const isPositive = !["rejected", "closed"].includes((item.new_status || "").toLowerCase());
  const dotColor = isPositive ? "#059669" : "#DC2626";
  return (
    <View style={styles.historyItem}>
      {/* timeline line */}
      <View style={styles.timelineCol}>
        <View style={[styles.timelineDot, { backgroundColor: dotColor }]}>
          <Icon
            name={isPositive ? "check" : "close"}
            size={10}
            color="#fff"
          />
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      {/* content */}
      <View style={styles.historyContent}>
        <Text style={styles.historyAction}>{item.action || "Status updated"}</Text>
        {(item.old_status || item.new_status) && (
          <View style={styles.historyStatusRow}>
            {item.old_status && (
              <StatusBadge status={item.old_status} />
            )}
            {item.old_status && item.new_status && (
              <Icon name="arrow-right" size={12} color={GRAY_400} style={{ marginHorizontal: 4 }} />
            )}
            {item.new_status && (
              <StatusBadge status={item.new_status} />
            )}
          </View>
        )}
        {item.remarks ? (
          <Text style={styles.historyRemarks}>{item.remarks}</Text>
        ) : null}
        {item.new_status && (item.new_status.toUpperCase() === "RESOLVED" || item.new_status.toUpperCase() === "CLOSED") && complaint?.proof_images?.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {complaint.proof_images.map((img, idx) => (
              <Image key={idx} source={{ uri: img.startsWith("http") ? img : `${API_URL}${img}` }} style={{ width: 80, height: 80, borderRadius: 8, marginRight: 8 }} />
            ))}
          </ScrollView>
        )}
        {item.created_at && (
          <Text style={styles.historyTime}>{formatDate(item.created_at)}</Text>
        )}
      </View>
    </View>
  );
}

/* ── Main Screen ── */
export const ComplaintDetailScreen = ({ route, navigation }) => {
  const initialComplaint = route.params?.complaint;
  const [complaint, setComplaint] = useState(initialComplaint);
  const [loading, setLoading]     = useState(Boolean(initialComplaint?._id));
  const [error, setError]         = useState("");
  
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const complaintId = initialComplaint?._id || initialComplaint?.complaint_id;

  useEffect(() => {
    const load = async () => {
      if (!complaintId) { setLoading(false); return; }
      try {
        setError("");
        const data = await authService.getComplaint(complaintId);
        setComplaint(data);
      } catch (err) {
        setError(getErrorMessage(err, "Unable to load complaint details"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [complaintId]);

  const handleSubmitFeedback = async () => {
    if (rating === 0) return alert("Please select a rating");
    try {
      setSubmitting(true);
      await authService.submitFeedback(complaintId, { rating, feedback });
      alert("Feedback submitted successfully!");
      // Reload complaint
      const data = await authService.getComplaint(complaintId);
      setComplaint(data);
    } catch (err) {
      alert(getErrorMessage(err, "Failed to submit feedback"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) return alert("Please provide a reason to reopen");
    try {
      setSubmitting(true);
      await authService.reopenComplaint(complaintId, reopenReason);
      alert("Complaint reopened successfully!");
      // Reload complaint
      const data = await authService.getComplaint(complaintId);
      setComplaint(data);
    } catch (err) {
      alert(getErrorMessage(err, "Failed to reopen complaint"));
    } finally {
      setSubmitting(false);
    }
  };

  const statusCfg = getStatus(complaint?.status);

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── HEADER ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Complaint Details</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {complaint?.complaint_id || complaint?._id || "Loading…"}
          </Text>
        </View>
        {complaint && (
          <View style={[styles.headerStatusDot, { backgroundColor: statusCfg.color }]} />
        )}
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.centerStateText}>Loading details…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <View style={styles.errorIconWrap}>
            <Icon name="alert-circle-outline" size={40} color={ERROR} />
          </View>
          <Text style={styles.errorTitle}>Couldn't load complaint</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.navigate("ComplaintsHome")}>
            <Text style={styles.retryText}>Back to Complaints</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── HERO STATUS CARD ── */}
          <View style={[styles.heroCard, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
            <View style={styles.heroTop}>
              <View style={[styles.heroIconWrap, { backgroundColor: statusCfg.color + "18" }]}>
                <Icon name="clipboard-alert-outline" size={28} color={statusCfg.color} />
              </View>
              <View style={styles.heroMeta}>
                <Text style={styles.heroType}>{humaniseType(complaint?.complaint_type)}</Text>
                <Text style={styles.heroId}>#{complaint?.complaint_id || complaint?._id}</Text>
              </View>
            </View>
            <View style={styles.heroBottom}>
              <StatusBadge status={complaint?.status} />
              <PriorityBadge priority={complaint?.priority} />
              {complaint?.created_at && (
                <Text style={styles.heroDate}>{formatDate(complaint.created_at)}</Text>
              )}
            </View>
          </View>

          {/* ── DETAILS CARD ── */}
          <View style={styles.card}>
            <SectionTitle title="Complaint Info" icon="information-outline" />

            <InfoRow icon="text-box-outline"      label="Description" value={complaint?.description} />
            <InfoRow icon="map-marker-outline"    label="Address"     value={complaint?.address} />
            <InfoRow icon="crosshairs-gps"        label="Coordinates"
              value={complaint?.latitude && complaint?.longitude
                ? `${complaint.latitude}, ${complaint.longitude}` : null} />

            {/* Notes section */}
            {(complaint?.citizen_note || complaint?.worker_note ||
              complaint?.inspector_note || complaint?.rejection_reason) && (
              <>
                <View style={styles.cardDivider} />
                <SectionTitle title="Notes" icon="note-text-outline" />
                <NoteCard icon="account-outline"      label="Citizen Note"     value={complaint?.citizen_note}     color="#2563EB" />
                <NoteCard icon="account-hard-hat"     label="Worker Note"      value={complaint?.worker_note}      color="#7C3AED" />
                <NoteCard icon="shield-account"       label="Inspector Note"   value={complaint?.inspector_note}   color="#0891B2" />
                <NoteCard icon="close-circle-outline" label="Rejection Reason" value={complaint?.rejection_reason} color="#DC2626" />
              </>
            )}
          </View>

          {/* ── FEEDBACK & RATING (If CLOSED/RESOLVED) ── */}
          {complaint && ["closed", "resolved"].includes(complaint.status?.toLowerCase()) && !complaint.rating && (
            <View style={styles.card}>
              <SectionTitle title="Feedback & Rating" icon="star-outline" />
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Icon name={rating >= star ? "star" : "star-outline"} size={32} color={rating >= star ? "#F59E0B" : GRAY_400} />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Share your experience (optional)"
                placeholderTextColor={GRAY_400}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={styles.actionBtn} onPress={handleSubmitFeedback} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnText}>Submit Feedback</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── ALREADY RATED ── */}
          {complaint?.rating && (
            <View style={styles.card}>
              <SectionTitle title="Your Feedback" icon="star-check-outline" />
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon key={star} name={complaint.rating >= star ? "star" : "star-outline"} size={24} color={complaint.rating >= star ? "#F59E0B" : GRAY_400} />
                ))}
              </View>
              {complaint.feedback && <Text style={styles.feedbackText}>{complaint.feedback}</Text>}
            </View>
          )}

          {/* ── REOPEN COMPLAINT (If CLOSED/RESOLVED) ── */}
          {complaint && ["closed", "resolved"].includes(complaint.status?.toLowerCase()) && (
            <View style={styles.card}>
              <SectionTitle title="Issue not fixed?" icon="refresh" />
              <TextInput
                style={styles.textInput}
                placeholder="Explain why this needs to be reopened..."
                placeholderTextColor={GRAY_400}
                value={reopenReason}
                onChangeText={setReopenReason}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: ERROR }]} onPress={handleReopen} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnText}>Reopen Complaint</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── HISTORY ── */}
          <View style={styles.card}>
            <SectionTitle title="Activity Timeline" icon="timeline-clock-outline" />

            {complaint?.history?.length ? (
              <View style={styles.historyList}>
                {complaint.history.map((item, idx) => (
                  <HistoryItem
                    key={item._id || idx}
                    item={item}
                    complaint={complaint}
                    isLast={idx === complaint.history.length - 1}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyHistory}>
                <Icon name="timeline-outline" size={32} color={GRAY_400} />
                <Text style={styles.emptyHistoryText}>No activity yet</Text>
                <Text style={styles.emptyHistorySub}>Updates will appear here as your complaint progresses.</Text>
              </View>
            )}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: GRAY_50 },

  /* ── HEADER ── */
  headerBar: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 52 : SPACING.lg,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  headerSub:   { color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: SPACING.xs },
  headerStatusDot: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.5)",
  },

  /* ── STATES ── */
  centerState: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.xxl, gap: SPACING.md,
  },
  centerStateText: { color: GRAY_400, fontSize: 14, marginTop: SPACING.sm },
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  errorTitle: { fontSize: 17, fontWeight: "700", color: GRAY_800 },
  errorSub:   { fontSize: 13, color: GRAY_400, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    marginTop: SPACING.sm, backgroundColor: PRIMARY,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: 12,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },

  /* ── HERO CARD ── */
  heroCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroTop: {
    flexDirection: "row", alignItems: "center", gap: SPACING.md, marginBottom: SPACING.md,
  },
  heroIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  heroMeta: { flex: 1 },
  heroType: { fontSize: 16, fontWeight: "800", color: GRAY_800, letterSpacing: -0.2 },
  heroId:   { fontSize: 12, color: GRAY_400, marginTop: SPACING.xs, fontWeight: "500" },
  heroBottom: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: SPACING.sm,
  },
  heroDate: { fontSize: 11, color: GRAY_400, marginLeft: "auto" },

  /* ── BADGES ── */
  badge: {
    flexDirection: "row", alignItems: "center", gap: SPACING.xs,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    borderRadius: 20, borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  /* ── CARD ── */
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardDivider: { height: 1, backgroundColor: GRAY_100, marginVertical: SPACING.lg },

  /* ── SECTION TITLE ── */
  sectionTitle: {
    flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.lg,
  },
  sectionIconWrap: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center",
  },
  sectionTitleText: { fontSize: 13, fontWeight: "700", color: GRAY_800, letterSpacing: 0.1 },

  /* ── INFO ROW ── */
  infoRow: {
    flexDirection: "row", alignItems: "flex-start", gap: SPACING.md, marginBottom: SPACING.md,
  },
  infoIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: GRAY_100, alignItems: "center", justifyContent: "center",
    marginTop: SPACING.xs, flexShrink: 0,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: {
    fontSize: 10, fontWeight: "700", color: GRAY_400,
    letterSpacing: 0.6, textTransform: "uppercase",
  },
  infoValue: { fontSize: 14, color: GRAY_800, marginTop: SPACING.xs, lineHeight: 20 },

  /* ── NOTE CARD ── */
  noteCard: {
    borderLeftWidth: 3,
    backgroundColor: GRAY_50,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, marginBottom: SPACING.xs },
  noteLabel:  { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  noteValue:  { fontSize: 13, color: GRAY_600, lineHeight: 19 },

  /* ── HISTORY TIMELINE ── */
  historyList: { paddingTop: SPACING.xs },
  historyItem: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.xs },
  timelineCol: { alignItems: "center", width: 24 },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    zIndex: 1,
  },
  timelineLine: {
    flex: 1, width: 2, backgroundColor: GRAY_100, marginTop: SPACING.xs, marginBottom: -SPACING.xs,
  },
  historyContent: {
    flex: 1, paddingBottom: SPACING.lg,
  },
  historyAction: { fontSize: 14, fontWeight: "700", color: GRAY_800, marginBottom: SPACING.xs },
  historyStatusRow: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: SPACING.xs, marginBottom: SPACING.xs,
  },
  historyRemarks: { fontSize: 13, color: GRAY_600, lineHeight: 18, marginBottom: SPACING.xs },
  historyTime:    { fontSize: 11, color: GRAY_400 },

  /* ── EMPTY HISTORY ── */
  emptyHistory: {
    alignItems: "center", paddingVertical: SPACING.xl, gap: SPACING.xs,
  },
  emptyHistoryText: { fontSize: 14, fontWeight: "700", color: GRAY_600, marginTop: SPACING.xs },
  emptyHistorySub:  { fontSize: 12, color: GRAY_400, textAlign: "center", lineHeight: 18 },

  /* ── ACTIONS (FEEDBACK/REOPEN) ── */
  ratingRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },
  textInput: {
    backgroundColor: GRAY_50, borderWidth: 1, borderColor: GRAY_200,
    borderRadius: 12, padding: SPACING.md, fontSize: 14, color: GRAY_800,
    marginBottom: SPACING.md, textAlignVertical: "top",
  },
  actionBtn: {
    backgroundColor: PRIMARY, paddingVertical: 14, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  feedbackText: { fontSize: 14, color: GRAY_600, marginTop: SPACING.sm },
});

export default ComplaintDetailScreen;