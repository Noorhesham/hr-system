import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftsDto } from './dto/query-shifts.dto';
export declare class ShiftService {
    private readonly db;
    constructor(db: DatabaseService);
    create(companyId: string, dto: CreateShiftDto): Prisma.Prisma__ShiftClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        startTime: string;
        endTime: string;
        gracePeriodMinutes: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findAll(companyId: string, query: QueryShiftsDto): Promise<PageDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        startTime: string;
        endTime: string;
        gracePeriodMinutes: number;
    }>>;
    findOne(companyId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        startTime: string;
        endTime: string;
        gracePeriodMinutes: number;
    }>;
    update(companyId: string, id: string, dto: UpdateShiftDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        startTime: string;
        endTime: string;
        gracePeriodMinutes: number;
    }>;
    remove(companyId: string, id: string): Promise<{
        success: boolean;
    }>;
}
