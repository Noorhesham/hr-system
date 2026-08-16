"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatYmd = formatYmd;
exports.parseDateOnly = parseDateOnly;
exports.inclusiveDayCount = inclusiveDayCount;
exports.wallClockToInstant = wallClockToInstant;
exports.normalizeToTenantDay = normalizeToTenantDay;
exports.computeAttendanceMetrics = computeAttendanceMetrics;
exports.shiftWindowInstants = shiftWindowInstants;
exports.checkInOutsideShiftReason = checkInOutsideShiftReason;
const luxon_1 = require("luxon");
const client_1 = require("@prisma/client");
const MAX_OT_HOURS = new client_1.Prisma.Decimal('9999.99');
function ymdOf(date) {
    return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}
function formatYmd(date) {
    const { y, m, d } = ymdOf(date);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function parseDateOnly(ymd) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd.trim());
    if (!m) {
        throw new Error(`Invalid date-only string: ${ymd}`);
    }
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}
function inclusiveDayCount(from, to) {
    const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
    const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
    return Math.max(1, Math.round((b - a) / (24 * 60 * 60 * 1000)) + 1);
}
function wallClockToInstant(date, hhmm, tz, dayOffset = 0) {
    const { y, m, d } = ymdOf(date);
    const [hh, mi] = hhmm.split(':').map(Number);
    return luxon_1.DateTime.fromObject({ year: y, month: m, day: d + dayOffset, hour: hh, minute: mi, second: 0, millisecond: 0 }, { zone: tz }).toJSDate();
}
function normalizeToTenantDay(instant, tz) {
    const local = luxon_1.DateTime.fromJSDate(instant).setZone(tz);
    return new Date(Date.UTC(local.year, local.month - 1, local.day));
}
function computeAttendanceMetrics(rec, shift, tz) {
    if (!shift) {
        return { delayMinutes: 0, overtimeHours: new client_1.Prisma.Decimal(0) };
    }
    const start = wallClockToInstant(rec.date, shift.startTime, tz, 0);
    const crossesMidnight = shift.endTime <= shift.startTime;
    const end = wallClockToInstant(rec.date, shift.endTime, tz, crossesMidnight ? 1 : 0);
    let delayMinutes = 0;
    if (rec.checkIn) {
        const lateMs = rec.checkIn.getTime() - (start.getTime() + shift.gracePeriodMinutes * 60_000);
        delayMinutes = lateMs > 0 ? Math.ceil(lateMs / 60_000) : 0;
    }
    let overtimeHours = new client_1.Prisma.Decimal(0);
    if (rec.checkIn && rec.checkOut) {
        const otMs = rec.checkOut.getTime() - end.getTime();
        if (otMs > 0) {
            overtimeHours = new client_1.Prisma.Decimal(otMs)
                .dividedBy(3_600_000)
                .toDecimalPlaces(2, client_1.Prisma.Decimal.ROUND_HALF_UP);
            if (overtimeHours.greaterThan(MAX_OT_HOURS)) {
                overtimeHours = MAX_OT_HOURS;
            }
        }
    }
    return { delayMinutes, overtimeHours };
}
function shiftWindowInstants(date, shift, tz) {
    const start = wallClockToInstant(date, shift.startTime, tz, 0);
    const crossesMidnight = shift.endTime <= shift.startTime;
    const end = wallClockToInstant(date, shift.endTime, tz, crossesMidnight ? 1 : 0);
    return { start, end };
}
function checkInOutsideShiftReason(at, date, shift, tz) {
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
//# sourceMappingURL=attendance-time.util.js.map