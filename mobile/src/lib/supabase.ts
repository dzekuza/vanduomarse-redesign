import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Supabase client for the React Native mobile admin app.
 *
 * Reads EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (falling back
 * to NEXT_PUBLIC_* when shared via `.env.local` in local development).
 */

export const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const siteBaseUrl =
  (process.env.EXPO_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );

export const supabase = createClient<Database>(
  supabaseUrl || "https://mwngljhcvqkvncwbmgeo.supabase.co",
  supabaseAnonKey || "missing-anon-key",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Keep the auth token fresh while the app is in the foreground on iOS.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
