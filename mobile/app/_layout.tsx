/* eslint-disable @typescript-eslint/no-require-imports */
import "@/mobile/src/lib/polyfills";
import React from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LoadingGate, LoginScreen, NoAccessScreen } from "@/mobile/src/components/auth-gate";
import { MobileAdminProvider, useMobileAdmin } from "@/mobile/src/store/admin-context";
import { AppThemeProvider, useAppTheme } from "@/mobile/src/theme/use-app-theme";

function AuthRouter() {
  const { auth } = useMobileAdmin();
  const { mode } = useAppTheme();

  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      {auth.status === "loading" ? (
        <LoadingGate />
      ) : auth.status === "signed_out" ? (
        <LoginScreen />
      ) : auth.status === "no_access" ? (
        <NoAccessScreen email={auth.email} reason={auth.reason} />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Termina-Regular": require("../../app/fonts/Termina-Regular.otf"),
    "Termina-Medium": require("../../app/fonts/Termina-Medium.otf"),
    "Termina-SemiBold": require("../../app/fonts/Termina-SemiBold.otf"),
    "Termina-Bold": require("../../app/fonts/Termina-Bold.otf"),
  });

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        {!fontsLoaded ? (
          <LoadingGate />
        ) : (
          <MobileAdminProvider>
            <AuthRouter />
          </MobileAdminProvider>
        )}
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
