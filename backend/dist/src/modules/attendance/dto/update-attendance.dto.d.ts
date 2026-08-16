import { AttendanceStatus } from '@prisma/client';
export declare class UpdateAttendanceDto {
    shiftId?: string;
    checkIn?: string | null;
    checkOut?: string | null;
    status?: AttendanceStatus;
    delayMinutes?: number;
    overtimeHours?: number;
}
