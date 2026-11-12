import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Field } from "@/mobile/src/components/primitives";
import { supabase } from "@/mobile/src/lib/supabase";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

const CODE_LENGTH = 8;
const RESEND_SECONDS = 60;

/**
 * E-mail code sign-in: ask for the address, then for the 8-digit code. It never creates an account
 * (`shouldCreateUser: false`) and answers the same for any address. A non-staff address that verifies a
 * code lands on the "no access" screen, like a password sign-in would.
 */
export function CodeLoginForm() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const send = async () => {
    const address = (sentTo ?? email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setError("Įveskite teisingą el. pašto adresą.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: sendError } = await supabase.auth.signInWithOtp({ email: address, options: { shouldCreateUser: false } });
    setBusy(false);
    if (sendError && /rate|too many|seconds/i.test(sendError.message)) {
      setError("Kodas jau išsiųstas. Palaukite minutę ir bandykite dar kartą.");
      return;
    }
    setSentTo(address);
    setCode("");
    setWait(RESEND_SECONDS);
  };

  const confirm = async () => {
    if (!sentTo || code.length < CODE_LENGTH) return;
    setBusy(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: sentTo, token: code, type: "email" });
    setBusy(false);
    if (verifyError) setError("Neteisingas arba pasibaigęs kodas.");
  };

  if (!sentTo) {
    return (
      <View style={styles.wrap}>
        <Field
          label="El. paštas"
          placeholder="vardas@vanduomarse.lt"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          error={error ?? undefined}
        />
        <Button label={busy ? "Siunčiama…" : "Gauti kodą"} variant="coral" disabled={busy} onPress={send} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Jei šis el. paštas turi prieigą, išsiuntėme {CODE_LENGTH} skaitmenų kodą adresu {sentTo}.
      </Text>
      <Field
        label="Kodas iš laiško"
        placeholder="12345678"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        value={code}
        onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
        error={error ?? undefined}
      />
      <Button label={busy ? "Tikrinama…" : "Prisijungti"} variant="coral" disabled={busy || code.length < CODE_LENGTH} onPress={confirm} />
      <Button label={wait > 0 ? `Siųsti kodą dar kartą po ${wait} s` : "Siųsti kodą dar kartą"} variant="outline" disabled={busy || wait > 0} onPress={send} />
      <Button
        label="Naudoti kitą el. paštą"
        variant="outline"
        disabled={busy}
        onPress={() => {
          setSentTo(null);
          setCode("");
          setError(null);
        }}
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, spacing, type } = theme;
  return StyleSheet.create({
    wrap: { gap: spacing.md },
    hint: { ...type.sm, color: colors.mutedForeground },
  });
}
