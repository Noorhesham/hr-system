/** Under 1 hour → minutes; otherwise hours + leftover minutes. */
export function formatMinutesDuration(
  minutes: number | string | null | undefined,
): string {
  const m = Math.round(Number(minutes) || 0)
  if (m <= 0) return "—"
  if (m < 60) return `${m} د`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h} س ${rem} د` : `${h} س`
}

export function formatHoursDuration(
  hours: number | string | null | undefined,
): string {
  const h = Number(hours) || 0
  if (h <= 0) return "—"
  return formatMinutesDuration(Math.round(h * 60))
}
