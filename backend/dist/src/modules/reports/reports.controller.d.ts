import { ReportsService } from './reports.service';
import { QueryMonthDto } from './dto/query-month.dto';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    dashboard(companyId: string, query: QueryDashboardDto): Promise<{
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
            basicSalary: import("@prisma/client/runtime/library").Decimal;
            totalAllowances: import("@prisma/client/runtime/library").Decimal;
            totalDeductions: import("@prisma/client/runtime/library").Decimal;
            loanDeductions: import("@prisma/client/runtime/library").Decimal;
            overtimeBonus: import("@prisma/client/runtime/library").Decimal;
            netSalary: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    attendanceSummary(companyId: string, q: QueryMonthDto): Promise<{
        totalOvertimeHours: import("@prisma/client/runtime/library").Decimal;
        present: number;
        absent: number;
        leave: number;
        totalDelayMinutes: number;
        month: number;
        year: number;
        recordCount: number;
    }>;
    gosi(companyId: string, q: QueryMonthDto): Promise<{
        month: number;
        year: number;
        companyGosiNumber: string | null;
        rates: {
            employeePercentage: import("@prisma/client/runtime/library").Decimal;
            companyPercentage: import("@prisma/client/runtime/library").Decimal;
        };
        employees: {
            employeeId: string;
            name: string;
            gosiNumber: string | null;
            gosiBase: import("@prisma/client/runtime/library").Decimal;
            employeeShare: import("@prisma/client/runtime/library").Decimal;
            companyShare: import("@prisma/client/runtime/library").Decimal;
        }[];
        totals: {
            employeeShare: import("@prisma/client/runtime/library").Decimal;
            companyShare: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
}
