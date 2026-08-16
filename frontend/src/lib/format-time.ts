/** 12-hour clock with AM/PM, e.g. "04:00 PM". Accepts ISO datetime or "HH:mm". */
export function formatTime12h(
  value: string | Date | null | undefined,
): string {
  if (value == null || value === "") return "—"
  const parts = parseHoursMinutes(value)
  if (!parts) return "—"
  const { hours, minutes } = parts
  const ampm = hours >= 12 ? "PM" : "AM"
  const h12 = hours % 12 || 12
  return `${String(h12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`
}

function parseHoursMinutes(
  value: string | Date,
): { hours: number; minutes: number } | null {
  if (typeof value === "string") {
    const hm = /^(\d{1,2}):(\d{2})/.exec(value.trim())
    if (hm && !value.includes("T") && !value.includes(" ")) {
      const hours = Number(hm[1])
      const minutes = Number(hm[2])
      if (hours > 23 || minutes > 59) return null
      return { hours, minutes }
    }
  }
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return { hours: d.getHours(), minutes: d.getMinutes() }
}
