export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** "YYYY-MM-DD" + optional "HH:MM" (local) → ISO string. Date-only tasks sit at 09:00 local. */
export function toIso(date: string, time: string): string {
  return new Date(`${date}T${time || "09:00"}`).toISOString();
}

export function fromIso(iso: string | null, hasTime: boolean) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { date: dayKey(d), time: hasTime ? hm : "" };
}
