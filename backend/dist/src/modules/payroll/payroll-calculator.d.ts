import { AttendanceStatus, CompanyPolicy, Prisma, SalaryBasis, SalaryComponent } from '@prisma/client';
import { formatYmd } from '../../common/utils/attendance-time.util';
export type AttendanceRow = {
    date: Date;
    status: AttendanceStatus;
    delayMinutes: number;
    overtimeHours: Prisma.Decimal;
    checkIn?: Date | null;
    checkOut?: Date | null;
};
export type SlipCalc = {
    basicSalary: Prisma.Decimal;
    totalAllowances: Prisma.Decimal;
    totalDeductions: Prisma.Decimal;
    loanDeductions: Prisma.Decimal;
    overtimeBonus: Prisma.Decimal;
    netSalary: Prisma.Decimal;
    breakdown: {
        componentDeductions: Prisma.Decimal;
        absenceDeduction: Prisma.Decimal;
        delayDeduction: Prisma.Decimal;
        gosiEmployee: Prisma.Decimal;
    };
};
export declare function calculateEmployeeSlip(input: {
    basicSalary: Prisma.Decimal;
    salaryBasis?: SalaryBasis;
    isGosiRegistered: boolean;
    components: Pick<SalaryComponent, 'type' | 'amount' | 'isPercentage'>[];
    attendance: AttendanceRow[];
    policy: Pick<CompanyPolicy, 'delayDeductionType' | 'absenceMultiplierUnexcused' | 'absenceMultiplierExcused' | 'overtimeMultiplierNormal' | 'overtimeMultiplierHoliday' | 'gosiEmployeePercentage' | 'defaultWeekendDays'>;
    loanInstallmentAmounts: Prisma.Decimal[];
}): SlipCalc;
export declare function monthDateRange(year: number, month: number): {
    from: Date;
    to: Date;
};
export declare function formatMonthLabel(year: number, month: number): string;
export { formatYmd };
