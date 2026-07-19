import { ShiftService } from './shift.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftsDto } from './dto/query-shifts.dto';
export declare class ShiftController {
    private readonly shiftService;
    constructor(shiftService: ShiftService);
    create(companyId: string, dto: CreateShiftDto): import("@prisma/client").Prisma.Prisma__ShiftClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
        startTime: string;
        endTime: string;
        gracePeriodMinutes: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(companyId: string, query: QueryShiftsDto): Promise<import("../../common/pagination/page.dto").PageDto<{
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
