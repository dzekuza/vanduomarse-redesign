import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { X } from "lucide-react-native";
import { BOOKING_STATUS, INQUIRY_STATUS, PAYMENT_STATUS } from "@/lib/admin/labels";
import type { BookingStatus, InquiryStatus, PaymentInfo } from "@/lib/admin/types";
import { COUPON_STATUS_LABEL, type CouponStatus } from "@/lib/coupons";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  small = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "coral" | "outline" | "destructive" | "secondary";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  small?: boolean;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? theme.colors.primary
      : variant === "coral"
        ? theme.colors.rust
        : variant === "destructive"
          ? theme.colors.destructive
          : variant === "secondary"
            ? theme.colors.secondary
            : theme.colors.card;

  const fg =
    variant === "primary"
      ? theme.colors.primaryForeground
      : variant === "coral"
        ? theme.colors.onRust
        : variant === "destructive"
          ? theme.colors.primaryForeground
          : variant === "secondary"
            ? theme.colors.secondaryForeground
            : theme.colors.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg },
        variant === "outline" && styles.buttonOutline,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {icon}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={active ? styles.chipTextActive : styles.chipTextInactive}>{label}</Text>
      {count !== undefined ? (
        <Text style={active ? styles.chipCountActive : styles.chipCountInactive}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dotColor =
    status === "laukia"
      ? theme.colors.statusWarn
      : status === "patvirtinta"
        ? theme.colors.statusOk
        : status === "ivykdyta"
          ? theme.colors.statusDone
          : theme.colors.statusBad;

  return (
    <View style={styles.badge}>
      <View style={[styles.badgeDot, { backgroundColor: dotColor }]} />
      <Text style={styles.badgeText}>{BOOKING_STATUS[status]}</Text>
    </View>
  );
}

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dotColor =
    status === "nauja"
      ? theme.colors.statusPending
      : status === "susisiekta"
        ? theme.colors.statusWarn
        : theme.colors.statusOk;

  return (
    <View style={styles.badge}>
      <View style={[styles.badgeDot, { backgroundColor: dotColor }]} />
      <Text style={styles.badgeText}>{INQUIRY_STATUS[status]}</Text>
    </View>
  );
}

export function CouponStatusBadge({ status }: { status: CouponStatus }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dotColor =
    status === "laukia_apmokejimo"
      ? theme.colors.statusWarn
      : status === "aktyvus"
        ? theme.colors.statusOk
        : status === "panaudotas"
          ? theme.colors.statusDone
          : theme.colors.statusBad;

  return (
    <View style={styles.badge}>
      <View style={[styles.badgeDot, { backgroundColor: dotColor }]} />
      <Text style={styles.badgeText}>{COUPON_STATUS_LABEL[status]}</Text>
    </View>
  );
}

export function PaymentStatusBadge({ payment }: { payment?: PaymentInfo }) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  if (!payment) return null;

  const dotColor =
    payment.needsReview
      ? theme.colors.statusWarn
      : payment.status === "apmoketa"
        ? theme.colors.statusOk
        : payment.status === "laukia"
          ? theme.colors.statusWarn
          : theme.colors.statusDone;

  return (
    <View style={styles.badge}>
      <View style={[styles.badgeDot, { backgroundColor: dotColor }]} />
      <Text style={styles.badgeText}>
        {payment.needsReview ? "Patikrinti Stripe" : PAYMENT_STATUS[payment.status]}
      </Text>
    </View>
  );
}

export function Field({
  label,
  error,
  ...inputProps
}: TextInputProps & {
  label: string;
  error?: string;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.mutedForeground}
        style={styles.input}
        {...inputProps}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function SheetModal({
  visible,
  title,
  subtitle,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { height } = useWindowDimensions();

  // The backdrop fades in place and only the sheet slides. A `Modal` with animationType="slide" moves everything inside
  // it, backdrop included, so the Modal itself is not animated: it stays mounted while the sheet animates out.
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  return (
    <Modal visible={mounted} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.modalBackdrop, { opacity: progress }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Uždaryti" onPress={onClose} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY }] }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalTitle}>{title}</Text>
              {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Uždaryti"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <X size={20} color={theme.colors.foreground} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function EmptyState({
  title,
  message,
  subtitle,
  icon,
}: {
  title?: string;
  message?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.emptyWrap}>
      {icon ? <View style={styles.emptyIcon}>{icon}</View> : null}
      <Text style={styles.emptyTitle}>{title ?? message ?? ""}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, spacing, type, radii } = theme;
  return StyleSheet.create({
    button: {
      minHeight: spacing.touch,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radii.none,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    buttonSmall: {
      minHeight: spacing.touch,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    buttonOutline: {
      borderWidth: spacing.hairline,
      borderColor: colors.border,
    },
    buttonText: {
      ...type.smBold,
    },
    disabled: {
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.82,
    },
    chip: {
      minHeight: spacing.touch,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: spacing.hairline,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipInactive: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    chipTextActive: {
      ...type.xsBold,
      color: colors.primaryForeground,
    },
    chipTextInactive: {
      ...type.xsBold,
      color: colors.foreground,
    },
    chipCountActive: {
      ...type.xs,
      color: colors.primaryForeground,
    },
    chipCountInactive: {
      ...type.xs,
      color: colors.mutedForeground,
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: spacing.hairline,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      backgroundColor: colors.muted,
      borderWidth: spacing.hairline,
      borderColor: colors.border,
    },
    badgeDot: {
      width: spacing.sm,
      height: spacing.sm,
      borderRadius: radii.pill,
    },
    badgeText: {
      ...type.xsBold,
      color: colors.foreground,
    },
    fieldWrap: {
      gap: spacing.xs,
    },
    fieldLabel: {
      ...type.xsBold,
      color: colors.foreground,
    },
    input: {
      ...type.input,
      minHeight: spacing.touch,
      backgroundColor: colors.card,
      borderWidth: spacing.hairline,
      borderColor: colors.input,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.foreground,
    },
    fieldError: {
      ...type.xs,
      color: colors.rustInk,
    },
    modalRoot: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalBackdrop: {
      backgroundColor: colors.backdrop,
    },
    modalSheet: {
      backgroundColor: colors.background,
      borderTopWidth: spacing.thick,
      borderTopColor: colors.rust,
      maxHeight: "90%",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: spacing.hairline,
      borderBottomColor: colors.border,
    },
    modalHeaderCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    modalTitle: {
      ...type.item,
      color: colors.foreground,
    },
    modalSubtitle: {
      ...type.xs,
      color: colors.mutedForeground,
    },
    closeBtn: {
      width: spacing.touch,
      height: spacing.touch,
      alignItems: "center",
      justifyContent: "center",
    },
    modalBody: {
      paddingHorizontal: spacing.lg,
    },
    modalBodyContent: {
      paddingVertical: spacing.lg,
      gap: spacing.lg,
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.section,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    emptyIcon: {
      width: spacing.avatarMd,
      height: spacing.avatarMd,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
    },
    emptyTitle: {
      ...type.smBold,
      color: colors.foreground,
      textAlign: "center",
    },
    emptySubtitle: {
      ...type.xs,
      color: colors.mutedForeground,
      textAlign: "center",
    },
  });
}
