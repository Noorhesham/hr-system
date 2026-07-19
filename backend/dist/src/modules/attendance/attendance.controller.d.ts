import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    checkIn(actor: AuthenticatedUser, companyId: string, dto: CheckInDto): Promise<{
        id: string;
        employeeId: string;
        shiftId: string | null;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        delayMinutes: number;
        overtimeHours: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        updatedAt: Date;
    } & {
        date: string;
    }>;
    checkOut(actor: AuthenticatedUser, companyId: string, dto: CheckOutDto): Promise<{
        id: string;
        employeeId: string;
        shiftId: string | null;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        delayMinutes: number;
        overtimeHours: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        updatedAt: Date;
    } & {
        date: string;
    }>;
    upsert(companyId: string, dto: UpsertAttendanceDto): Promise<{
        id: string;
        employeeId: string;
        shiftId: string | null;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        delayMinutes: number;
        overtimeHours: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        updatedAt: Date;
    } & {
        date: string;
    }>;
    bulk(companyId: string, dto: BulkAttendanceDto): Promise<{
        total: number;
        succeeded: number;
        failed: number;
        results: {
            index: number;
            employeeId: string;
            date?: string;
            status: "OK" | "ERROR";
            code?: string;
            message?: string;
        }[];
    }>;
    findAll(actor: AuthenticatedUser, companyId: string, query: QueryAttendanceDto): Promise<import("../../common/pagination/page.dto").PageDto<{
        employee: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string;
        shiftId: string | null;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        delayMinutes: number;
        overtimeHours: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        updatedAt: Date;
    } & {
        date: string;
    }>>;
    findOne(actor: AuthenticatedUser, companyId: string, id: string): Promise<{
        employee: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string;
        shiftId: string | null;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        delayMinutes: number;
        overtimeHours: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        updatedAt: Date;
    } & {
        date: string;
    }>;
    update(companyId: string, id: string, dto: UpdateAttendanceDto): Promise<{
        id: string;
        employeeId: string;
        shiftId: string | null;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        delayMinutes: number;
        overtimeHours: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        updatedAt: Date;
    } & {
        date: string;
    }>;
}
