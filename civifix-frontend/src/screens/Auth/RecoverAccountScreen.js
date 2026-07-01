import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../constants/theme";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import authService from "../../services/authService";

const RecoverAccountScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRecoverAccount = async () => {
    if (!email) {
      setError("Please enter your registered email address");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Use existing login endpoint which sends an OTP
      await authService.login(email);
      setSuccessMessage("An OTP has been sent to your email.");
      
      setTimeout(() => {
        navigation.navigate("VerifyLogin", { email });
      }, 2000);
    } catch (err) {
      setError(err?.message || "Failed to initiate account recovery.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Recover Account</Text>
          <Text style={styles.subtitle}>
            Enter your registered email address to receive a secure login OTP.
          </Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
          
          <TextField
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button 
            title="Send OTP" 
            onPress={handleRecoverAccount} 
            loading={isLoading}
            style={styles.submitButton}
          />
          
          <Button 
            title="Back to Login" 
            variant="text" 
            onPress={() => navigation.navigate("Login")} 
            textStyle={{ color: COLORS.textGray }}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: "center",
  },
  header: {
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textLight,
    lineHeight: 24,
  },
  form: {
    gap: SPACING.lg,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  successText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
});

export default RecoverAccountScreen;
