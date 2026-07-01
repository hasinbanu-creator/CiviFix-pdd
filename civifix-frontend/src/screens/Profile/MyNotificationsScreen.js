import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import Screen from "../../components/Screen";
import authService from "../../services/authService";
import { formatDistanceToNow } from "date-fns";

const MyNotificationsScreen = ({ navigation }) => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => authService.getNotifications({ page: 1, limit: 50 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => authService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => authService.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = data?.data?.notifications || [];

  const handleNotificationPress = (notification) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification._id);
    }
    // Navigate based on type if needed, e.g., to complaint detail
    if (notification.complaint_id) {
      navigation.navigate("Complaints", { 
        screen: "ComplaintDetail", 
        params: { complaint: { complaint_id: notification.complaint_id } } 
      });
    }
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
        activeOpacity={0.8}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.iconContainer}>
          <Icon name="bell-outline" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, !item.is_read && styles.unreadText]}>{item.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.time}>
            {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : "Recently"}
          </Text>
        </View>
        {!item.is_read && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {notifications.some(n => !n.is_read) && (
          <TouchableOpacity 
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Failed to load notifications</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="bell-sleep-outline" size={64} color={COLORS.textGray} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySubtitle}>You're all caught up!</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.xl,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  markAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
  listContainer: {
    padding: SPACING.md,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  unreadCard: {
    backgroundColor: "#F0F9FF",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  unreadText: {
    fontWeight: "800",
  },
  message: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  time: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: SPACING.xs,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.textDark,
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    color: COLORS.card,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxl,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
});

export default MyNotificationsScreen;
