import { Prisma } from '@prisma/client';
export interface ShiftTimes {
    startTime: string;
    endTime: string;
    gracePeriodMinutes: number;
}
export interface AttendanceMetrics {
    delayMinutes: number;
    overtimeHours: Prisma.Decimal;
}
export declare function formatYmd(date: Date): string;
export declare function wallClockToInstant(date: Date, hhmm: string, tz: string, dayOffset?: number): Date;
export declare function normalizeToTenantDay(instant: Date, tz: string): Date;
export declare function computeAttendanceMetrics(rec: {
    date: Date;
    checkIn: Date | null;
    checkOut: Date | null;
}, shift: ShiftTimes | null, tz: string): AttendanceMetrics;
export declare function shiftWindowInstants(date: Date, shift: ShiftTimes, tz: string): {
    start: Date;
    end: Date;
};
export declare function checkInOutsideShiftReason(at: Date, date: Date, shift: ShiftTimes, tz: string): string | null;
