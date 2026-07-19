import { DateTime } from 'luxon';
import { Prisma } from '@prisma/client';

/**
 * Time engine for attendance. All conversions are timezone-aware (via luxon) —
 * never server-local Date math, never a hardcoded UTC offset.
 *
 * Key invariants:
 *  - `AttendanceRecord.date` is `@db.Date`; Prisma round-trips it at UTC
 *    midnight, so we extract Y/M/D with getUTC* (never local getters).
 *  - delay/overtime are derived purely from persisted state (idempotent).
 */

export interface ShiftTimes {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  gracePeriodMinutes: number;
}

export interface AttendanceMetrics {
  delayMinutes: number;
  overtimeHours: Prisma.Decimal;
}

const MAX_OT_HOURS = new Prisma.Decimal('9999.99'); // Decimal(6,2) ceiling

/** Y/M/D of a `@db.Date` (UTC-midnight anchored). */
function ymdOf(date: Date): { y: number; m: number; d: number } {
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

/** Format a `@db.Date` as a tz-stable "YYYY-MM-DD" string. */
export function formatYmd(date: Date): string {
  const { y, m, d } = ymdOf(date);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Build an absolute instant from a calendar `date` + wall-clock "HH:mm" in `tz`.
 * `dayOffset = 1` is used for the end of an overnight shift (endTime <= startTime).
 */
export function wallClockToInstant(
  date: Date,
  hhmm: string,
  tz: string,
  dayOffset = 0,
): Date {
  const { y, m, d } = ymdOf(date);
  const [hh, mi] = hhmm.split(':').map(Number);
  return DateTime.fromObject(
    { year: y, month: m, day: d + dayOffset, hour: hh, minute: mi, second: 0, millisecond: 0 },
    { zone: tz },
  ).toJSDate();
}

/** Normalize an instant to its tenant calendar day, stored as a UTC-midnight `@db.Date`. */
export function normalizeToTenantDay(instant: Date, tz: string): Date {
  const local = DateTime.fromJSDate(instant).setZone(tz);
  return new Date(Date.UTC(local.year, local.month - 1, local.day));
}

/**
 * Recompute delay + overtime from persisted state. Pure & idempotent.
 *  - delayMinutes: whole minutes late past (shiftStart + grace); 0 if on time / no checkIn.
 *  - overtimeHours: hours worked past shiftEnd (Decimal, 2dp, half-up); 0 if not checked out.
 *  - no shift -> both 0 (unbounded).
 */
export function computeAttendanceMetrics(
  rec: { date: Date; checkIn: Date | null; checkOut: Date | null },
  shift: ShiftTimes | null,
  tz: string,
): AttendanceMetrics {
  if (!shift) {
    return { delayMinutes: 0, overtimeHours: new Prisma.Decimal(0) };
  }

  const start = wallClockToInstant(rec.date, shift.startTime, tz, 0);
  const crossesMidnight = shift.endTime <= shift.startTime; // zero-padded HH:mm compare
  const end = wallClockToInstant(rec.date, shift.endTime, tz, crossesMidnight ? 1 : 0);

  // delay — needs checkIn only. Integer-ms math; ceil so any part-minute = 1 min.
  let delayMinutes = 0;
  if (rec.checkIn) {
    const lateMs =
      rec.checkIn.getTime() - (start.getTime() + shift.gracePeriodMinutes * 60_000);
    delayMinutes = lateMs > 0 ? Math.ceil(lateMs / 60_000) : 0;
  }

  // overtime — needs checkIn AND checkOut. Time strictly after scheduled end.
  let overtimeHours = new Prisma.Decimal(0);
  if (rec.checkIn && rec.checkOut) {
    const otMs = rec.checkOut.getTime() - end.getTime();
    if (otMs > 0) {
      overtimeHours = new Prisma.Decimal(otMs)
        .dividedBy(3_600_000)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      if (overtimeHours.greaterThan(MAX_OT_HOURS)) {
        overtimeHours = MAX_OT_HOURS;
      }
    }
  }

  return { delayMinutes, overtimeHours };
}

/** Shift wall-clock window for a tenant calendar `date` (handles overnight). */
export function shiftWindowInstants(
  date: Date,
  shift: ShiftTimes,
  tz: string,
): { start: Date; end: Date } {
  const start = wallClockToInstant(date, shift.startTime, tz, 0);
  const crossesMidnight = shift.endTime <= shift.startTime;
  const end = wallClockToInstant(date, shift.endTime, tz, crossesMidnight ? 1 : 0);
  return { start, end };
}

/**
 * Live check-in window: from shift start through shift end (inclusive).
 * Returns null when `at` is inside the window; otherwise a human-readable reason.
 */
export function checkInOutsideShiftReason(
  at: Date,
  date: Date,
  shift: ShiftTimes,
  tz: string,
): string | null {
  const { start, end } = shiftWindowInstants(date, shift, tz);
  const t = at.getTime();
  if (t < start.getTime()) {
    return `Check-in is only allowed from shift start (${shift.startTime}) to end (${shift.endTime}); too early`;
  }
  if (t > end.getTime()) {
    return `Check-in is only allowed from shift start (${shift.startTime}) to end (${shift.endTime}); shift has ended`;
  }
  return null;
}
