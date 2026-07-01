import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";
import Screen from "../../components/Screen";

const SplashScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      // Navigate to Onboarding after splash completes
      setTimeout(() => {
        // Typically check if onboarding was seen, but for now navigate to Onboarding
        navigation.replace("Onboarding");
      }, 1500);
    });
  }, []);

  return (
    <Screen style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>CiviFix</Text>
        </View>
        <Text style={styles.tagline}>Empowering Civic Action</Text>
      </Animated.View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  logoText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  tagline: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.card,
    fontWeight: "500",
    letterSpacing: 1,
  },
});

export default SplashScreen;
