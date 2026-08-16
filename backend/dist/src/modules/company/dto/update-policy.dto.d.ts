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
    currency?: string;
    payrollCycle?: string;
    payrollPayoutDay?: number;
    directBankTransfer?: boolean;
    medicalInsuranceProvider?: string;
    medicalInsuranceTier?: string;
    gosiAutoEnroll?: boolean;
    benefitHousingAllowance?: boolean;
    benefitTransportAllowance?: boolean;
    benefitAnnualTickets?: boolean;
    benefitHousingAllowanceAmount?: number;
    benefitHousingAllowanceIsPercentage?: boolean;
    benefitTransportAllowanceAmount?: number;
    benefitAnnualTicketsAmount?: number;
}
