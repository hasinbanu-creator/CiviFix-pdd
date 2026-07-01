import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from "../../constants/theme";
import Screen from "../../components/Screen";
import Button from "../../components/Button";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Welcome to CiviFix",
    description: "Your platform to report and track civic issues directly to your local government.",
  },
  {
    id: "2",
    title: "Report Issues Easily",
    description: "Snap a photo, add location details, and submit your complaint in seconds.",
  },
  {
    id: "3",
    title: "Track Progress",
    description: "Stay updated on the status of your complaints and see real-time progress.",
  }
];

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate("RoleSelection");
    }
  };

  const handleSkip = () => {
    navigation.navigate("RoleSelection");
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.slideContainer}>
        <View style={styles.imageContainer}>
          <Image 
            source={require("../../../assets/icon.png")} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </View>
        <Text style={styles.title}>{slides[currentIndex].title}</Text>
        <Text style={styles.description}>{slides[currentIndex].description}</Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
        
        <View style={styles.actions}>
          <Button 
            title="Skip" 
            variant="text" 
            onPress={handleSkip} 
            style={styles.skipButton} 
            textStyle={{ color: COLORS.textGray }}
          />
          <Button 
            title={currentIndex === slides.length - 1 ? "Get Started" : "Next"} 
            onPress={handleNext} 
            style={styles.nextButton}
          />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: SPACING.xl,
    justifyContent: "space-between",
  },
  slideContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: width * 0.7,
    height: width * 0.7,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xxl,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "700",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  description: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: SPACING.xl,
  },
  footer: {
    paddingBottom: SPACING.xl,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});

export default OnboardingScreen;
