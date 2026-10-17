export const ROOM_TYPES = [
  { id: "namelis", label: "Namelis", note: "2-4 asmenys", pricePerNight: 65 },
  { id: "kemperis", label: "Kemperio aikštelė", note: "su elektra", pricePerNight: 25 },
] as const;

export type RoomTypeId = (typeof ROOM_TYPES)[number]["id"];

export function roomPrice(id: RoomTypeId): number {
  return ROOM_TYPES.find((r) => r.id === id)!.pricePerNight;
}

export function cabinReference(dateK: string, roomId: string, nights: number): string {
  const s = `${dateK}${roomId}${nights}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) >>> 0;
  const code = (h % 9000) + 1000;
  return `MM-${code}`;
}
