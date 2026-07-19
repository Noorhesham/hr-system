import { AttendanceStatus } from '@prisma/client';
export declare class UpsertAttendanceDto {
    employeeId: string;
    date: string;
    shiftId?: string;
    checkIn?: string;
    checkOut?: string;
    status?: AttendanceStatus;
    delayMinutes?: number;
    overtimeHours?: number;
}
