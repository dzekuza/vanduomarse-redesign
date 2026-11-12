import React from "react";
import { Tabs } from "expo-router";
import { Calendar, Gift, Inbox, LayoutGrid, ScanLine } from "lucide-react-native";
import { hasAnyPermission, hasPermission } from "@/lib/admin/permissions";
import { useReadyAdmin } from "@/mobile/src/store/admin-context";
import { useAppTheme } from "@/mobile/src/theme/use-app-theme";

export default function TabsLayout() {
  const theme = useAppTheme();
  const { access, data } = useReadyAdmin();

  const canToday = hasAnyPermission(access, [
    "apzvalga",
    "rezervacijos",
    "uzimtumas",
    "keturraciai",
    "renginiai",
  ]);
  const canScan = hasAnyPermission(access, ["instruktorius", "apyrankes"]);
  const canInquiries = hasPermission(access, "uzklausos");
  const canCoupons = hasPermission(access, "kuponai");

  const pendingTodayCount =
    data.bookings.filter((b) => b.status === "laukia").length +
    data.quadRentals.filter((r) => r.status === "laukia").length +
    data.tourTickets.filter((t) => t.status === "laukia").length +
    data.eventTickets.filter((t) => t.status === "laukia").length;

  const newInquiriesCount = data.inquiries.filter((q) => q.status === "nauja").length;
  const pendingCouponsCount = data.coupons.filter((c) => c.status === "laukia_apmokejimo").length;
  const activeWaterCount = data.riderSessions.filter((s) => s.endedAt === null).length;

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.sidebar,
        },
        headerTitleStyle: {
          fontFamily: theme.fonts.bold,
          fontSize: 14,
          color: theme.colors.sidebarForeground,
        },
        headerTintColor: theme.colors.sidebarForeground,
        tabBarStyle: {
          backgroundColor: theme.colors.sidebar,
          borderTopColor: theme.colors.sidebarBorder,
          borderTopWidth: theme.spacing.hairline,
          minHeight: theme.spacing.tabBar,
          paddingTop: theme.spacing.xxs,
        },
        tabBarActiveTintColor: theme.colors.sidebarPrimary,
        tabBarInactiveTintColor: theme.colors.sidebarForeground,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.bold,
          fontSize: 10,
        },
        tabBarBadgeStyle: {
          backgroundColor: theme.colors.sidebarPrimary,
          color: theme.colors.sidebarPrimaryForeground,
          fontFamily: theme.fonts.bold,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Šiandien",
          headerTitle: "ŠIANDIEN · KALENDORIUS",
          href: canToday ? undefined : null,
          tabBarBadge: pendingTodayCount > 0 ? pendingTodayCount : undefined,
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Skenavimas",
          headerTitle: "VANDENLENTĖS · SKENAVIMAS",
          href: canScan ? undefined : null,
          tabBarBadge: activeWaterCount > 0 ? activeWaterCount : undefined,
          tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inquiries"
        options={{
          title: "Užklausos",
          headerTitle: "ŠVENČIŲ UŽKLAUSOS",
          href: canInquiries ? undefined : null,
          tabBarBadge: newInquiriesCount > 0 ? newInquiriesCount : undefined,
          tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="coupons"
        options={{
          title: "Kuponai",
          headerTitle: "DOVANŲ KUPONAI",
          href: canCoupons ? undefined : null,
          tabBarBadge: pendingCouponsCount > 0 ? pendingCouponsCount : undefined,
          tabBarIcon: ({ color, size }) => <Gift color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Daugiau",
          headerTitle: "KLIENTAI · APŽVALGA · PASKYRA",
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
