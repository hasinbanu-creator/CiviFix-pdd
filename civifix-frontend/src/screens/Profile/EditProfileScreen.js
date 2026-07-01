import React, { useContext } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import { AuthContext } from "../../context/AuthContext";
import authService from "../../services/authService";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

const EditProfileScreen = ({ navigation }) => {
  const { user, setUser } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || "",
      mobile_number: user?.mobile_number || user?.mobile || "",
      address: user?.address || "",
      district: user?.district || "",
      ward: user?.ward || "",
    },
  });

  const handlePickImage = async () => {
    // Placeholder for image picking if we add expo-image-picker
    alert("Profile picture update is coming soon!");
  };

  const updateProfileMutation = useMutation({
    mutationFn: (data) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      // Invalidate any queries related to user if needed
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      navigation.goBack();
    },
  });

  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Edit Profile</Text>
          <Text style={styles.subtitle}>Update your personal information</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {updateProfileMutation.isError && (
            <View style={styles.errorBox}>
              <Icon name="alert-circle-outline" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>
                {updateProfileMutation.error?.message || "Failed to update profile"}
              </Text>
            </View>
          )}

          {/* Profile Picture */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Icon name="account" size={40} color={COLORS.primary} />
            </View>
            <Button
              title="Change Photo"
              onPress={handlePickImage}
              style={styles.changePhotoBtn}
              textStyle={styles.changePhotoText}
            />
          </View>

          {/* Read Only Email */}
          <TextField
            label="Email Address"
            value={user?.email || ""}
            editable={false}
            containerStyle={styles.inputField}
          />

          <Controller
            control={control}
            name="name"
            rules={{ required: "Name is required", minLength: { value: 2, message: "Name must be at least 2 characters" } }}
            render={({ field: { onChange, value } }) => (
              <TextField
                label="Full Name"
                placeholder="Enter your full name"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
                containerStyle={styles.inputField}
              />
            )}
          />

          <Controller
            control={control}
            name="mobile_number"
            rules={{ 
              required: "Mobile number is required",
              pattern: { value: /^[0-9]{10}$/, message: "Must be a valid 10-digit number" }
            }}
            render={({ field: { onChange, value } }) => (
              <TextField
                label="Mobile Number"
                placeholder="Enter your 10-digit mobile number"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                error={errors.mobile_number?.message}
                containerStyle={styles.inputField}
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            rules={{ required: "Address is required", minLength: { value: 5, message: "Address is too short" } }}
            render={({ field: { onChange, value } }) => (
              <TextField
                label="Address"
                placeholder="Enter your address"
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
                error={errors.address?.message}
                containerStyle={styles.inputField}
              />
            )}
          />

          <Controller
            control={control}
            name="district"
            render={({ field: { onChange, value } }) => (
              <TextField
                label="District"
                placeholder="Enter your district"
                value={value}
                onChangeText={onChange}
                error={errors.district?.message}
                containerStyle={styles.inputField}
              />
            )}
          />

          <Controller
            control={control}
            name="ward"
            render={({ field: { onChange, value } }) => (
              <TextField
                label="Ward"
                placeholder="Enter your ward"
                value={value}
                onChangeText={onChange}
                error={errors.ward?.message}
                containerStyle={styles.inputField}
              />
            )}
          />

          <Button 
            title={updateProfileMutation.isPending ? "Updating..." : "Save Changes"} 
            onPress={handleSubmit(onSubmit)} 
            disabled={updateProfileMutation.isPending}
            style={styles.submitButton}
            loading={updateProfileMutation.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    padding: SPACING.xl,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  inputField: {
    marginBottom: SPACING.lg,
  },
  submitButton: {
    marginTop: SPACING.xl,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  changePhotoBtn: {
    backgroundColor: "transparent",
    paddingVertical: 0,
  },
  changePhotoText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
  },
});

export default EditProfileScreen;
