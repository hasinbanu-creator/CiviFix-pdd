import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { NetworkProvider } from "./src/context/NetworkContext";
import OfflineBanner from "./src/components/OfflineBanner";
import RootNavigator from "./src/navigation/RootNavigator";
import { getAndroidTopPadding } from "./src/utils/layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, paddingTop: getAndroidTopPadding() }}>
      <SafeAreaProvider>
        <StatusBar backgroundColor="transparent" translucent barStyle="dark-content" />
        <NetworkProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <OfflineBanner />
              <RootNavigator />
            </AuthProvider>
          </QueryClientProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}