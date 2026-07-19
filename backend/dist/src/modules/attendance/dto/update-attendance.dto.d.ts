import { AttendanceStatus } from '@prisma/client';
export declare class UpdateAttendanceDto {
    shiftId?: string;
    checkIn?: string;
    checkOut?: string;
    status?: AttendanceStatus;
    delayMinutes?: number;
    overtimeHours?: number;
}
