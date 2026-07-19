import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
export declare class AttendanceService {
    private readonly db;
    constructor(db: DatabaseService);
    checkIn(actor: AuthenticatedUser, companyId: string, dto: CheckInDto): Promise<{
        id: string;
        employeeId: string;
        shiftId: string | null;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        delayMinutes: number;
        overtimeHours: Prisma.Decimal;
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
        overtimeHours: Prisma.Decimal;
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
        overtimeHours: Prisma.Decimal;
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
        overtimeHours: Prisma.Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        updatedAt: Date;
    } & {
        date: string;
    }>;
    findAll(actor: AuthenticatedUser, companyId: string, query: QueryAttendanceDto): Promise<PageDto<{
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
        overtimeHours: Prisma.Decimal;
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
        overtimeHours: Prisma.Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        createdAt: Date;
        updatedAt: Date;
    } & {
        date: string;
    }>;
    bulkUpsert(companyId: string, dto: BulkAttendanceDto): Promise<{
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
    private resolveMetrics;
    private assertStatusConsistency;
    private assertEmployeeInCompany;
    private loadShift;
    private resolvePunchTarget;
    private requireShiftId;
    private resolveShiftId;
    private getOwnedOrThrow;
    private serialize;
}
