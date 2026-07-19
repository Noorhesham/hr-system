import { DatabaseService } from '../../database/database.service';
import { UpdatePolicyDto } from './dto/update-policy.dto';
export declare class CompanyService {
    private readonly db;
    constructor(db: DatabaseService);
    getPolicy(companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        delayDeductionType: import("@prisma/client").$Enums.DelayDeductionType;
        absenceMultiplierUnexcused: import("@prisma/client/runtime/library").Decimal;
        absenceMultiplierExcused: import("@prisma/client/runtime/library").Decimal;
        overtimeMultiplierNormal: import("@prisma/client/runtime/library").Decimal;
        overtimeMultiplierHoliday: import("@prisma/client/runtime/library").Decimal;
        gosiEmployeePercentage: import("@prisma/client/runtime/library").Decimal;
        gosiCompanyPercentage: import("@prisma/client/runtime/library").Decimal;
        gosiNumber: string | null;
        defaultWeekendDays: string[];
    }>;
    updatePolicy(companyId: string, dto: UpdatePolicyDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        delayDeductionType: import("@prisma/client").$Enums.DelayDeductionType;
        absenceMultiplierUnexcused: import("@prisma/client/runtime/library").Decimal;
        absenceMultiplierExcused: import("@prisma/client/runtime/library").Decimal;
        overtimeMultiplierNormal: import("@prisma/client/runtime/library").Decimal;
        overtimeMultiplierHoliday: import("@prisma/client/runtime/library").Decimal;
        gosiEmployeePercentage: import("@prisma/client/runtime/library").Decimal;
        gosiCompanyPercentage: import("@prisma/client/runtime/library").Decimal;
        gosiNumber: string | null;
        defaultWeekendDays: string[];
    }>;
}
