import React, { createContext, useEffect, useCallback, useState } from "react";
import { DeviceEventEmitter, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "../services/authService";
import { getErrorMessage } from "../services/api";
import notificationService from "../services/notificationService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case "RESTORE_TOKEN":
          return {
            ...prevState,
            userToken: action.payload,
            isLoading: false,
            isSignout: false,
          };
        case "SIGN_IN":
          return {
            ...prevState,
            isSignout: false,
            userToken: action.payload,
          };
        case "SIGN_OUT":
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
          };
        case "SET_USER":
          return {
            ...prevState,
            user: action.payload,
          };
        case "SET_ERROR":
          return {
            ...prevState,
            error: action.payload,
          };
        default:
          return prevState;
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
      user: null,
      error: null,
    }
  );

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const user = await authService.getProfile();
          dispatch({ type: "SET_USER", payload: user });
          dispatch({ type: "RESTORE_TOKEN", payload: token });
        } else {
          dispatch({ type: "RESTORE_TOKEN", payload: null });
        }
      } catch (error) {
        console.error("Auth restoration failed:", error);
        dispatch({ type: "RESTORE_TOKEN", payload: null });
      }
    };
    bootstrapAsync();

    const sessionSub = DeviceEventEmitter.addListener('SESSION_EXPIRED', () => {
      Alert.alert("Session Expired", "Please log in again.");
      dispatch({ type: "SIGN_OUT" });
    });

    return () => {
      sessionSub.remove();
    };
  }, []);

  const authContext = {
    signIn: useCallback(async (email) => {
      try {
        dispatch({ type: "SET_ERROR", payload: null });
        const response = await authService.login(email);
        return response;
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: getErrorMessage(error) });
        throw error;
      }
    }, []),

    signUp: useCallback(async (userData) => {
      try {
        dispatch({ type: "SET_ERROR", payload: null });
        const response = await authService.register(userData);
        return response;
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: getErrorMessage(error) });
        throw error;
      }
    }, []),

    verifyLogin: useCallback(async (email, otp) => {
      try {
        dispatch({ type: "SET_ERROR", payload: null });
        const response = await authService.verifyLogin(email, otp);
        const user = await authService.getProfile();
        
        dispatch({ type: "SET_USER", payload: user });
        dispatch({ type: "SIGN_IN", payload: response.access_token });
        
        // Push notification hook
        notificationService.registerForPushNotificationsAsync().then(token => {
          notificationService.syncTokenWithServer(token);
        });

        return response;
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: getErrorMessage(error) });
        throw error;
      }
    }, []),

    verifyRegister: useCallback(async (email, otp) => {
      try {
        dispatch({ type: "SET_ERROR", payload: null });
        const response = await authService.verifyRegister(email, otp);
        const user = await authService.getProfile();
        dispatch({ type: "SET_USER", payload: user });
        dispatch({ type: "SIGN_IN", payload: response.access_token });
        return response;
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: getErrorMessage(error) });
        throw error;
      }
    }, []),

    signOut: useCallback(async () => {
      try {
        await authService.logout();
      } catch (error) {
        console.error("Logout error:", error);
      }
      dispatch({ type: "SIGN_OUT" });
    }, []),

  };

  return (
    <AuthContext.Provider value={{ ...state, ...authContext }}>
      {children}
    </AuthContext.Provider>
  );
};
