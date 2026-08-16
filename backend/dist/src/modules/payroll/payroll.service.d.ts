import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { QueryPayrollCyclesDto } from './dto/query-payroll-cycles.dto';
import { QueryPayrollSlipsDto } from './dto/query-payroll-slips.dto';
export declare class PayrollService {
    private readonly db;
    constructor(db: DatabaseService);
    createCycle(companyId: string, dto: CreatePayrollCycleDto): Promise<{
        totals: {
            totalSalaries: number;
            totalAllowances: number;
            totalBonuses: number;
            totalDeductions: number;
            netSalaries: number;
        };
        _count: {
            payrollSlips: number;
            loanInstallments: number;
        };
        id: string;
        month: number;
        year: number;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    findAll(companyId: string, query: QueryPayrollCyclesDto): Promise<PageDto<{
        _count: {
            payrollSlips: number;
        };
    } & {
        id: string;
        month: number;
        year: number;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>>;
    findOne(companyId: string, id: string): Promise<{
        totals: {
            totalSalaries: number;
            totalAllowances: number;
            totalBonuses: number;
            totalDeductions: number;
            netSalaries: number;
        };
        _count: {
            payrollSlips: number;
            loanInstallments: number;
        };
        id: string;
        month: number;
        year: number;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    listSlips(companyId: string, cycleId: string, query: QueryPayrollSlipsDto): Promise<PageDto<{
        id: string;
        employeeId: string;
        basicSalary: Prisma.Decimal;
        totalAllowances: Prisma.Decimal;
        overtimeBonus: Prisma.Decimal;
        totalDeductions: Prisma.Decimal;
        loanDeductions: Prisma.Decimal;
        netSalary: Prisma.Decimal;
        employee: {
            id: string;
            name: string;
            photoUrl: string | null;
            department: string | null;
            departmentId: string | null;
            email: string | null;
            employeeCode: string;
        };
    }>>;
    findSlip(companyId: string, slipId: string): Promise<{
        id: string;
        employeeId: string;
        basicSalary: Prisma.Decimal;
        totalAllowances: Prisma.Decimal;
        overtimeBonus: Prisma.Decimal;
        totalDeductions: Prisma.Decimal;
        loanDeductions: Prisma.Decimal;
        netSalary: Prisma.Decimal;
        employee: {
            id: string;
            name: string;
            photoUrl: string | null;
            email: string | null;
            employeeCode: string;
            isGosiRegistered: boolean;
        };
        payrollCycle: {
            id: string;
            month: number;
            year: number;
            status: import("@prisma/client").$Enums.PayrollCycleStatus;
        };
        attendance: {
            present: number;
            absent: number;
            leave: number;
            delayMinutes: number;
            overtimeHours: number;
        };
        attendanceDays: {
            date: string;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            delayMinutes: number;
            overtimeHours: number;
        }[];
        overtimeDays: {
            date: string;
            hours: number;
            clockHours: number;
            requestHours: number;
            source: string;
            amount: number;
        }[];
        leaves: {
            id: string;
            fromDate: string;
            toDate: string;
            reason: string | null;
        }[];
        loans: {
            amount: Prisma.Decimal;
            dueDate: string;
            status: import("@prisma/client").$Enums.LoanInstallmentStatus;
        }[];
        components: {
            name: string;
            type: import("@prisma/client").$Enums.SalaryComponentType;
            amount: Prisma.Decimal;
            isPercentage: boolean;
        }[];
        breakdown: {
            componentDeductions: Prisma.Decimal;
            absenceDeduction: Prisma.Decimal;
            delayDeduction: Prisma.Decimal;
            gosiEmployee: Prisma.Decimal;
        } | null;
    }>;
    recalculate(companyId: string, id: string): Promise<{
        totals: {
            totalSalaries: number;
            totalAllowances: number;
            totalBonuses: number;
            totalDeductions: number;
            netSalaries: number;
        };
        _count: {
            payrollSlips: number;
            loanInstallments: number;
        };
        id: string;
        month: number;
        year: number;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    revertToDraft(companyId: string, id: string): Promise<{
        _count: {
            payrollSlips: number;
        };
    } & {
        id: string;
        month: number;
        year: number;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    moveToReview(companyId: string, id: string): Promise<{
        _count: {
            payrollSlips: number;
        };
    } & {
        id: string;
        month: number;
        year: number;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    approve(companyId: string, id: string): Promise<{
        _count: {
            payrollSlips: number;
        };
    } & {
        id: string;
        month: number;
        year: number;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    close(companyId: string, id: string): Promise<{
        _count: {
            payrollSlips: number;
        };
    } & {
        id: string;
        month: number;
        year: number;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
    }>;
    exportWps(companyId: string, id: string): Promise<{
        filename: string;
        contentType: string;
        body: string;
    }>;
    private runCalculation;
    private assertStatus;
    private getOwnedOrThrow;
    private loadApprovedOvertime;
    private loadApprovedOvertimeGrouped;
}
