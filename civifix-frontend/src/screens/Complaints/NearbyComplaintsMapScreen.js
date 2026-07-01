import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, ActivityIndicator } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import authService from "../../services/authService";
import { getErrorMessage } from "../../services/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const NearbyComplaintsMapScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Default to a central location if permission denied
          setLocation({
            latitude: 13.0827,
            longitude: 80.2707,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
          loadComplaints();
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });

        loadComplaints();
      } catch (error) {
        // Fallback
        setLocation({
          latitude: 13.0827,
          longitude: 80.2707,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        loadComplaints();
      }
    })();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const res = await authService.getComplaints({ limit: 100 });
      const data = res.data || res.complaints || res || [];
      // Filter only those with coordinates
      const mapped = (Array.isArray(data) ? data : []).filter(c => c.latitude && c.longitude);
      setComplaints(mapped);
    } catch (err) {
      console.warn("Error loading complaints for map:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "resolved": return COLORS.success;
      case "in_progress": return "#0891B2";
      case "open": return COLORS.primary;
      case "rejected": return COLORS.error;
      default: return "#D97706"; // pending
    }
  };

  return (
    <View style={styles.container}>
      {/* Header overlaid on map */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Nearby Issues</Text>
      </View>

      {loading && !location ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Locating...</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={location}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {complaints.map(complaint => (
            <Marker
              key={complaint._id || complaint.complaint_id}
              coordinate={{
                latitude: parseFloat(complaint.latitude),
                longitude: parseFloat(complaint.longitude)
              }}
              pinColor={getMarkerColor(complaint.status)}
            >
              <Callout onPress={() => navigation.navigate("ComplaintDetail", { complaint })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{complaint.complaint_type || "Issue"}</Text>
                  <Text style={styles.calloutStatus}>{(complaint.status || "Pending").toUpperCase()}</Text>
                  <Text style={styles.calloutLink}>Tap to view details</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Floating Action Button for Map Reload */}
      <TouchableOpacity style={styles.fab} onPress={loadComplaints} disabled={loading}>
        <Icon name="refresh" size={24} color={COLORS.card} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    zIndex: 10,
    ...SHADOWS.md,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textGray,
  },
  callout: {
    width: 150,
    padding: SPACING.xs,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: FONT_SIZES.sm,
    marginBottom: 4,
  },
  calloutStatus: {
    fontSize: 10,
    color: COLORS.primary,
    marginBottom: 4,
  },
  calloutLink: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
});

export default NearbyComplaintsMapScreen;
