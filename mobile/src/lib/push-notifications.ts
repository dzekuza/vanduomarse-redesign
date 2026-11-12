/* eslint-disable @typescript-eslint/no-require-imports */
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import type { NotificationTopic } from "@/lib/notification-topics";
import { supabase } from "./supabase";

type NotificationsModule = typeof import("expo-notifications");

// Remote push does not exist on web or in Expo Go (SDK 53+), and merely importing expo-notifications there logs
// warnings. The module is therefore loaded lazily, and only in a development or store build on a native platform.
const isPushSupported =
  Platform.OS !== "web" && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let notificationsModule: NotificationsModule | null | undefined;

function getNotifications(): NotificationsModule | null {
  if (!isPushSupported) return null;
  if (notificationsModule === undefined) {
    notificationsModule = require("expo-notifications") as NotificationsModule;
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
  return notificationsModule;
}

export interface StaffPushRegistration {
  token: string;
  topics: NotificationTopic[];
  active: boolean;
}

export async function getDeviceExpoPushToken(): Promise<string | null> {
  const Notifications = getNotifications();
  if (!Notifications || !Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenRes = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return tokenRes.data;
  } catch {
    return null;
  }
}

export async function loadMyPushRegistration(userId: string): Promise<StaffPushRegistration | null> {
  const { data, error } = await supabase
    .from("staff_push_tokens")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    token: data.expo_push_token,
    topics: (data.topics as NotificationTopic[]) ?? ["visi"],
    active: data.active,
  };
}

export async function saveMyPushRegistration(
  userId: string,
  topics: NotificationTopic[],
  active: boolean,
): Promise<{ ok: true; token: string } | { ok: false; message: string }> {
  const token = await getDeviceExpoPushToken();
  if (!token) {
    return {
      ok: false,
      message: "Push pranešimai veikia tik tikrame iPhone / iPad įrenginyje (development arba produkcinėje programoje, ne Expo Go) su suteiktu leidimu.",
    };
  }

  const deviceName = Device.modelName ?? "iPhone";
  const { error } = await supabase.from("staff_push_tokens").upsert(
    {
      user_id: userId,
      expo_push_token: token,
      device_name: deviceName,
      topics: topics.length ? topics : ["visi"],
      active,
    },
    { onConflict: "expo_push_token" },
  );

  if (error) {
    return { ok: false, message: "Nepavyko išsaugoti pranešimų nustatymų." };
  }
  return { ok: true, token };
}
