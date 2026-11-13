import React, { useState } from "react";
import { View } from "react-native";
import { Button, Chip, Field, SheetModal } from "@/mobile/src/components/primitives";
import { useTodayStyles } from "@/mobile/src/components/today/use-today-styles";
import { useReadyAdmin } from "@/mobile/src/store/admin-context";
import type { NewBookingMobileInput } from "@/mobile/src/lib/admin-api";

type Kind = NewBookingMobileInput["kind"];

/** A booking taken by phone or on site. Fields stay strings while typing and are parsed on save. */
export function NewBookingModal({
  visible,
  defaultDate,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  defaultDate: string;
  onClose: () => void;
  onSubmit: (input: NewBookingMobileInput) => Promise<void>;
}) {
  const styles = useTodayStyles();
  const { data } = useReadyAdmin();

  const [kind, setKind] = useState<Kind>("pirtis");
  const [date, setDate] = useState(defaultDate);
  const [startHour, setStartHour] = useState("18");
  const [hours, setHours] = useState("3");
  const [nights, setNights] = useState("1");
  const [guests, setGuests] = useState("6");
  const [total, setTotal] = useState("160");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const firstSaunaId = data.saunas.find((s) => s.active)?.id ?? data.saunas[0]?.id ?? "pirtis-marse";

  const handleSave = async () => {
    if (name.trim().length < 2) return;
    setSaving(true);
    await onSubmit({
      kind,
      saunaId: kind === "pirtis" ? firstSaunaId : undefined,
      date,
      startHour: kind === "pirtis" ? Number(startHour) || 18 : undefined,
      hours: kind === "pirtis" ? Number(hours) || 2 : undefined,
      nights: kind !== "pirtis" ? Number(nights) || 1 : undefined,
      guests: Number(guests) || 2,
      customer: { name: name.trim(), phone: phone.trim(), email: "" },
      extras: {},
      total: Number(total) || 0,
      status: "patvirtinta",
      source: "telefonu",
      note,
    });
    setSaving(false);
  };

  return (
    <SheetModal visible={visible} title="Nauja rezervacija" subtitle="Registracija telefonu arba vietoje" onClose={onClose}>
      <View style={styles.chipRow}>
        <Chip label="Pirtis" active={kind === "pirtis"} onPress={() => setKind("pirtis")} />
        <Chip label="Namelis" active={kind === "namelis"} onPress={() => setKind("namelis")} />
        <Chip label="Kemperis" active={kind === "kemperis"} onPress={() => setKind("kemperis")} />
      </View>

      <Field label="Data (MMMM-MM-DD)" value={date} onChangeText={setDate} />

      {kind === "pirtis" ? (
        <View style={styles.rowBetween}>
          <View style={styles.halfField}>
            <Field label="Pradžios val. (0–23)" value={startHour} onChangeText={setStartHour} keyboardType="number-pad" />
          </View>
          <View style={styles.halfField}>
            <Field label="Valandos" value={hours} onChangeText={setHours} keyboardType="number-pad" />
          </View>
        </View>
      ) : (
        <Field label="Naktų skaičius" value={nights} onChangeText={setNights} keyboardType="number-pad" />
      )}

      <View style={styles.rowBetween}>
        <View style={styles.halfField}>
          <Field label="Svečių skaičius" value={guests} onChangeText={setGuests} keyboardType="number-pad" />
        </View>
        <View style={styles.halfField}>
          <Field label="Suma (€)" value={total} onChangeText={setTotal} keyboardType="decimal-pad" />
        </View>
      </View>

      <Field label="Kliento vardas" placeholder="Vardas Pavardė" value={name} onChangeText={setName} />
      <Field label="Telefonas" placeholder="+3706..." value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="Pastaba" placeholder="Papildoma informacija" value={note} onChangeText={setNote} />

      <Button label={saving ? "Saugoma…" : "Sukurti rezervaciją"} variant="coral" disabled={saving || name.trim().length < 2} onPress={handleSave} />
    </SheetModal>
  );
}
