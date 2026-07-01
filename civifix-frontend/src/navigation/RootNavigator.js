import React, { useContext, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import AuthStack from "./AuthStack";
import AppStack from "./AppStack";
import AdminStack from "./AdminStack";
import { COLORS } from "../constants/theme";

export const RootNavigator = () => {
  const auth = useContext(AuthContext);

  if (!auth) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.primary,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.card} />
      </View>
    );
  }

  const { isLoading, userToken, isSignout } = auth;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.primary,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.card} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userToken && !isSignout ? (
        ["SUPER_ADMIN", "DISTRICT_ADMIN"].includes(auth.user?.role) ? (
          <AdminStack />
        ) : (
          <AppStack />
        )
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;
