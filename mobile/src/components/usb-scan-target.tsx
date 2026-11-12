import React, { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { useIsFocused } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Keyboard, ScanLine } from "lucide-react-native";
import { Button, Field } from "@/mobile/src/components/primitives";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

/**
 * Connected USB IC/RFID bracelet scanner for iOS (`mobile/`).
 *
 * Mirrors `lib/card-scanner.ts` (Grabby TagWatcherService):
 * - A plugged-in USB-C / Lightning IC reader acts as a hardware HID keyboard wedge,
 *   emitting the bracelet UID as a rapid burst of characters ending in Enter (or a
 *   500 ms idle pause).
 * - Maps Lithuanian number-row letters (`ąčęėįšųū„“`) back to `1234567890` so scanning
 *   works even when the iPhone/iPad hardware keyboard layout is set to Lithuanian.
 * - Uses `showSoftInputOnFocus={false}` so iOS never opens the on-screen virtual keyboard
 *   while listening to the USB scanner, plus an optional manual entry toggle for testing
 *   or typing a bracelet number by hand.
 * - The hidden input exists ONLY while the scanner is active: enabled AND its screen is the one showing. Tab screens
 *   stay mounted after a visit, so an always-present hidden input kept focus (with the soft keyboard suppressed) and
 *   the real inputs on other screens did not open the keyboard.
 */

const LT_NUMBER_ROW: Record<string, string> = {
  ą: "1",
  Ą: "1",
  č: "2",
  Č: "2",
  ę: "3",
  Ę: "3",
  ė: "4",
  Ė: "4",
  į: "5",
  Į: "5",
  š: "6",
  Š: "6",
  ų: "7",
  Ų: "7",
  ū: "8",
  Ū: "8",
  "„": "9",
  "“": "0",
  "”": "0",
};

export function normalizeScannedCard(raw: string): string {
  const withoutPercent = raw.startsWith("%") ? raw.slice(1) : raw;
  let digits = "";
  for (const ch of withoutPercent) {
    if (ch >= "0" && ch <= "9") {
      digits += ch;
    } else if (LT_NUMBER_ROW[ch]) {
      digits += LT_NUMBER_ROW[ch];
    }
  }
  return digits;
}

export function UsbScanTarget({
  enabled,
  title,
  subtitle,
  onScan,
}: {
  enabled: boolean;
  title: string;
  subtitle?: string;
  onScan: (cardNumber: string) => void;
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hiddenInputRef = useRef<ComponentRef<typeof TextInput> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferRef = useRef("");
  const [bufferPreview, setBufferPreview] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const focused = useIsFocused();
  const active = enabled && focused;

  const clearIdle = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const commitScan = useCallback(
    (raw: string, terminator: "enter" | "idle") => {
      clearIdle();
      bufferRef.current = "";
      setBufferPreview("");
      const normalized = normalizeScannedCard(raw);
      if (terminator === "idle" && normalized.length < 6) return;
      if (normalized.length < 6) return;
      onScan(normalized);
    },
    [clearIdle, onScan],
  );

  useEffect(() => {
    if (active && !manualMode) {
      const id = setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [active, manualMode]);

  useEffect(() => () => clearIdle(), [clearIdle]);

  const handleHiddenChange = (text: string) => {
    if (!active) return;
    bufferRef.current = text;
    setBufferPreview(normalizeScannedCard(text));
    clearIdle();

    if (text.includes("\n") || text.includes("\r")) {
      commitScan(text, "enter");
      return;
    }

    idleTimerRef.current = setTimeout(() => {
      if (bufferRef.current.length > 0) {
        commitScan(bufferRef.current, "idle");
      }
    }, 500);
  };

  const handleManualSubmit = () => {
    const normalized = normalizeScannedCard(manualValue);
    if (normalized.length >= 6) {
      setManualValue("");
      onScan(normalized);
    }
  };

  return (
    <View style={styles.wrap}>
      {!manualMode ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title}
          onPress={() => hiddenInputRef.current?.focus()}
          style={styles.scanArea}
        >
          {active ? (
            <TextInput
              ref={hiddenInputRef}
              value={bufferRef.current}
              onChangeText={handleHiddenChange}
              onSubmitEditing={() => commitScan(bufferRef.current, "enter")}
              showSoftInputOnFocus={false}
              caretHidden
              autoCapitalize="none"
              autoCorrect={false}
              blurOnSubmit={false}
              style={styles.hiddenInput}
            />
          ) : null}
          <View style={[styles.circle, { backgroundColor: active ? theme.colors.primary : theme.colors.muted }]}>
            <ScanLine
              size={64}
              color={active ? theme.colors.primaryForeground : theme.colors.mutedForeground}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {bufferPreview ? (
            <Text style={styles.preview}>Nuskaitoma: {bufferPreview}…</Text>
          ) : (
            <Text style={styles.usbHint}>USB skaitytuvas aktyvus · priglauskite apyrankę</Text>
          )}
        </Pressable>
      ) : (
        <View style={styles.manualBox}>
          <Field
            label="Apyrankės numeris (6–32 skaitmenys)"
            placeholder="Pvz. 0012345678"
            value={manualValue}
            onChangeText={setManualValue}
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={handleManualSubmit}
          />
          <Button
            label="Patvirtinti apyrankę"
            variant="coral"
            disabled={normalizeScannedCard(manualValue).length < 6}
            onPress={handleManualSubmit}
          />
        </View>
      )}

      <Button
        label={manualMode ? "Grįžti į USB skaitytuvą" : "Įvesti numerį rankiniu būdu"}
        variant="outline"
        small
        icon={<Keyboard size={16} color={theme.colors.foreground} />}
        onPress={() => setManualMode((m) => !m)}
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, spacing, type, radii } = theme;
  return StyleSheet.create({
    wrap: {
      gap: spacing.md,
      alignItems: "center",
      paddingVertical: spacing.md,
    },
    scanArea: {
      width: "100%",
      alignItems: "center",
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    hiddenInput: {
      position: "absolute",
      width: spacing.hairline,
      height: spacing.hairline,
      opacity: 0,
    },
    circle: {
      width: spacing.scanCircle,
      height: spacing.scanCircle,
      borderRadius: radii.pill,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs,
    },
    title: {
      ...type.item,
      color: colors.foreground,
      textAlign: "center",
    },
    subtitle: {
      ...type.xs,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    usbHint: {
      ...type.micro,
      color: colors.lakeSoft,
      textTransform: "uppercase",
      textAlign: "center",
      marginTop: spacing.xxs,
    },
    preview: {
      ...type.xsBold,
      color: colors.rust,
      textAlign: "center",
    },
    manualBox: {
      width: "100%",
      gap: spacing.md,
    },
  });
}
