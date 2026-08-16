import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { QueryMonthDto } from './dto/query-month.dto';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
export declare class ReportsService {
    private readonly db;
    constructor(db: DatabaseService);
    dashboard(companyId: string, query?: QueryDashboardDto): Promise<{
        period: {
            from: string;
            to: string;
            fromMonth: number;
            fromYear: number;
            toMonth: number;
            toYear: number;
            fromLabel: string;
            toLabel: string;
        };
        totalEmployees: number;
        employeesDeltaMonth: number;
        attendanceRate: number;
        attendanceRateDeltaWeek: number;
        currentCyclePayroll: number;
        payrollDeltaPct: number;
        currentCycleLabel: string | null;
        previousCycleLabel: string | null;
        pendingLeaveRequests: number;
        pendingLeaveRequestsDelta: number;
        openLoans: number;
        pendingLoanInstallments: number;
        employeesByDepartment: {
            department: string;
            count: number;
        }[];
        salarySummary: {
            month: number;
            year: number;
            label: string;
            gross: number;
            net: number;
        }[];
        attendanceToday: {
            total: number;
            checkedIn: number;
            onTime: number;
            late: number;
            absent: number;
            onTimeRate: number;
        };
        recentLeaveRequests: {
            id: string;
            employeeName: string;
            position: string | null;
            status: import("@prisma/client").$Enums.LeaveStatus;
            fromDate: string;
            toDate: string;
        }[];
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
