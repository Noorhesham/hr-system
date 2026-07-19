import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { QueryMonthDto } from './dto/query-month.dto';
export declare class ReportsService {
    private readonly db;
    constructor(db: DatabaseService);
    dashboard(companyId: string): Promise<{
        activeEmployees: number;
        inactiveEmployees: number;
        openLoans: number;
        openPayrollCycles: number;
        pendingLoanInstallments: number;
    }>;
    payrollSummary(companyId: string, q: QueryMonthDto): Promise<{
        cycle: {
            id: string;
            month: number;
            year: number;
            status: import("@prisma/client").$Enums.PayrollCycleStatus;
        };
        employeeCount: number;
        totals: {
            basicSalary: Prisma.Decimal;
            totalAllowances: Prisma.Decimal;
            totalDeductions: Prisma.Decimal;
            loanDeductions: Prisma.Decimal;
            overtimeBonus: Prisma.Decimal;
            netSalary: Prisma.Decimal;
        };
    }>;
    attendanceSummary(companyId: string, q: QueryMonthDto): Promise<{
        totalOvertimeHours: Prisma.Decimal;
        present: number;
        absent: number;
        leave: number;
        totalDelayMinutes: number;
        month: number;
        year: number;
        recordCount: number;
    }>;
    gosiSummary(companyId: string, q: QueryMonthDto): Promise<{
        month: number;
        year: number;
        companyGosiNumber: string | null;
        rates: {
            employeePercentage: Prisma.Decimal;
            companyPercentage: Prisma.Decimal;
        };
        employees: {
            employeeId: string;
            name: string;
            gosiNumber: string | null;
            gosiBase: Prisma.Decimal;
            employeeShare: Prisma.Decimal;
            companyShare: Prisma.Decimal;
        }[];
        totals: {
            employeeShare: Prisma.Decimal;
            companyShare: Prisma.Decimal;
        };
    }>;
}
