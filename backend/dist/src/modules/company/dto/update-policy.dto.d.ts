import { DelayDeductionType } from '@prisma/client';
export declare class UpdatePolicyDto {
    delayDeductionType?: DelayDeductionType;
    absenceMultiplierUnexcused?: number;
    absenceMultiplierExcused?: number;
    overtimeMultiplierNormal?: number;
    overtimeMultiplierHoliday?: number;
    gosiEmployeePercentage?: number;
    gosiCompanyPercentage?: number;
    gosiNumber?: string;
    defaultWeekendDays?: string[];
}
