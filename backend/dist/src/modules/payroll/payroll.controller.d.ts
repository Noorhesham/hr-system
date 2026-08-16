import type { Response } from 'express';
import { PayrollService } from './payroll.service';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { QueryPayrollCyclesDto } from './dto/query-payroll-cycles.dto';
import { QueryPayrollSlipsDto } from './dto/query-payroll-slips.dto';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    create(companyId: string, dto: CreatePayrollCycleDto): Promise<{
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
    findAll(companyId: string, query: QueryPayrollCyclesDto): Promise<import("../../common/pagination/page.dto").PageDto<{
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
    listSlips(companyId: string, id: string, query: QueryPayrollSlipsDto): Promise<import("../../common/pagination/page.dto").PageDto<{
        id: string;
        employeeId: string;
        basicSalary: import("@prisma/client/runtime/library").Decimal;
        totalAllowances: import("@prisma/client/runtime/library").Decimal;
        overtimeBonus: import("@prisma/client/runtime/library").Decimal;
        totalDeductions: import("@prisma/client/runtime/library").Decimal;
        loanDeductions: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
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
    findSlip(companyId: string, slipId: string): Promise<{
        id: string;
        employeeId: string;
        basicSalary: import("@prisma/client/runtime/library").Decimal;
        totalAllowances: import("@prisma/client/runtime/library").Decimal;
        overtimeBonus: import("@prisma/client/runtime/library").Decimal;
        totalDeductions: import("@prisma/client/runtime/library").Decimal;
        loanDeductions: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
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
            amount: import("@prisma/client/runtime/library").Decimal;
            dueDate: string;
            status: import("@prisma/client").$Enums.LoanInstallmentStatus;
        }[];
        components: {
            name: string;
            type: import("@prisma/client").$Enums.SalaryComponentType;
            amount: import("@prisma/client/runtime/library").Decimal;
            isPercentage: boolean;
        }[];
        breakdown: {
            componentDeductions: import("@prisma/client/runtime/library").Decimal;
            absenceDeduction: import("@prisma/client/runtime/library").Decimal;
            delayDeduction: import("@prisma/client/runtime/library").Decimal;
            gosiEmployee: import("@prisma/client/runtime/library").Decimal;
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
    review(companyId: string, id: string): Promise<{
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
    exportWps(companyId: string, id: string, res: Response): Promise<void>;
}
