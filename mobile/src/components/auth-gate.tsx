import React, { useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Field } from "@/mobile/src/components/primitives";
import { supabase } from "@/mobile/src/lib/supabase";
import { useMobileAdmin } from "@/mobile/src/store/admin-context";
import { useAppTheme, type AppTheme } from "@/mobile/src/theme/use-app-theme";

const signInSchema = z.object({
  email: z.string().trim().email("Įveskite teisingą el. pašto adresą."),
  password: z.string().min(6, "Slaptažodis turi būti bent 6 simbolių."),
});

type SignInValues = z.infer<typeof signInSchema>;

export function LoginScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInValues) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    });
    setSubmitting(false);
    if (error) {
      setError("root", { message: "Neteisingas el. paštas arba slaptažodis." });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>VANDUO MARSE · VALDYMAS</Text>
          <Text style={styles.title}>DARBUOTOJŲ PRISIJUNGIMAS</Text>
          <Text style={styles.subtitle}>
            Prisijunkite su savo „Vanduo Marse“ darbuotojo paskyra.
          </Text>
        </View>

        <Card>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="El. paštas"
                placeholder="vardas@vanduomarse.lt"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Slaptažodis"
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          {errors.root?.message ? (
            <Text style={styles.rootError}>{errors.root.message}</Text>
          ) : null}

          <Button
            label={submitting ? "Jungiama…" : "Prisijungti"}
            variant="coral"
            disabled={submitting}
            onPress={handleSubmit(onSubmit)}
          />
        </Card>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function NoAccessScreen({
  email,
  reason,
}: {
  email: string;
  reason: "not_staff" | "inactive" | "no_pages";
}) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { signOut, refresh } = useMobileAdmin();

  const message =
    reason === "inactive"
      ? "Ši darbuotojo paskyra išjungta. Kreipkitės į parko savininką."
      : reason === "no_pages"
        ? "Jūsų rolei dar nepriskirtos jokios valdymo skiltys."
        : "Šis el. paštas nėra įtrauktas į darbuotojų sąrašą.";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Card>
          <Text style={styles.kicker}>PRIEIGA APRIBOTA</Text>
          <Text style={styles.title}>NETURITE PRIEIGOS</Text>
          <Text style={styles.subtitle}>{message}</Text>
          {email ? <Text style={styles.emailText}>Paskyra: {email}</Text> : null}
          <View style={styles.actions}>
            <Button label="Tikrinti dar kartą" variant="outline" onPress={refresh} />
            <Button label="Atsijungti" variant="coral" onPress={signOut} />
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

export function LoadingGate() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.rust} />
        <Text style={styles.loadingText}>Kraunami duomenys…</Text>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, spacing, type } = theme;
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
      gap: spacing.xl,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
    },
    header: {
      gap: spacing.xs,
    },
    kicker: {
      ...type.micro,
      color: colors.rust,
      textTransform: "uppercase",
    },
    title: {
      ...type.heading,
      color: colors.foreground,
      textTransform: "uppercase",
    },
    subtitle: {
      ...type.sm,
      color: colors.mutedForeground,
    },
    emailText: {
      ...type.xsBold,
      color: colors.foreground,
    },
    rootError: {
      ...type.xsBold,
      color: colors.rustInk,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    loadingText: {
      ...type.sm,
      color: colors.mutedForeground,
    },
  });
}
