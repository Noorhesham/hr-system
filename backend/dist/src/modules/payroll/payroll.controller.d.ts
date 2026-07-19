import type { Response } from 'express';
import { PayrollService } from './payroll.service';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { QueryPayrollCyclesDto } from './dto/query-payroll-cycles.dto';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    create(companyId: string, dto: CreatePayrollCycleDto): Promise<{
        payrollSlips: ({
            employee: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            employeeId: string;
            createdAt: Date;
            updatedAt: Date;
            basicSalary: import("@prisma/client/runtime/library").Decimal;
            payrollCycleId: string;
            totalAllowances: import("@prisma/client/runtime/library").Decimal;
            totalDeductions: import("@prisma/client/runtime/library").Decimal;
            loanDeductions: import("@prisma/client/runtime/library").Decimal;
            overtimeBonus: import("@prisma/client/runtime/library").Decimal;
            netSalary: import("@prisma/client/runtime/library").Decimal;
        })[];
        _count: {
            payrollSlips: number;
            loanInstallments: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        month: number;
        year: number;
    }>;
    findAll(companyId: string, query: QueryPayrollCyclesDto): Promise<import("../../common/pagination/page.dto").PageDto<{
        _count: {
            payrollSlips: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        month: number;
        year: number;
    }>>;
    findOne(companyId: string, id: string): Promise<{
        payrollSlips: ({
            employee: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            employeeId: string;
            createdAt: Date;
            updatedAt: Date;
            basicSalary: import("@prisma/client/runtime/library").Decimal;
            payrollCycleId: string;
            totalAllowances: import("@prisma/client/runtime/library").Decimal;
            totalDeductions: import("@prisma/client/runtime/library").Decimal;
            loanDeductions: import("@prisma/client/runtime/library").Decimal;
            overtimeBonus: import("@prisma/client/runtime/library").Decimal;
            netSalary: import("@prisma/client/runtime/library").Decimal;
        })[];
        _count: {
            payrollSlips: number;
            loanInstallments: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        month: number;
        year: number;
    }>;
    findSlip(companyId: string, slipId: string): Promise<{
        employee: {
            id: string;
            name: string;
            isGosiRegistered: boolean;
        };
        payrollCycle: {
            id: string;
            status: import("@prisma/client").$Enums.PayrollCycleStatus;
            month: number;
            year: number;
        };
    } & {
        id: string;
        employeeId: string;
        createdAt: Date;
        updatedAt: Date;
        basicSalary: import("@prisma/client/runtime/library").Decimal;
        payrollCycleId: string;
        totalAllowances: import("@prisma/client/runtime/library").Decimal;
        totalDeductions: import("@prisma/client/runtime/library").Decimal;
        loanDeductions: import("@prisma/client/runtime/library").Decimal;
        overtimeBonus: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
    }>;
    recalculate(companyId: string, id: string): Promise<{
        payrollSlips: ({
            employee: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            employeeId: string;
            createdAt: Date;
            updatedAt: Date;
            basicSalary: import("@prisma/client/runtime/library").Decimal;
            payrollCycleId: string;
            totalAllowances: import("@prisma/client/runtime/library").Decimal;
            totalDeductions: import("@prisma/client/runtime/library").Decimal;
            loanDeductions: import("@prisma/client/runtime/library").Decimal;
            overtimeBonus: import("@prisma/client/runtime/library").Decimal;
            netSalary: import("@prisma/client/runtime/library").Decimal;
        })[];
        _count: {
            payrollSlips: number;
            loanInstallments: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        month: number;
        year: number;
    }>;
    review(companyId: string, id: string): Promise<{
        _count: {
            payrollSlips: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        month: number;
        year: number;
    }>;
    approve(companyId: string, id: string): Promise<{
        payrollSlips: ({
            employee: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            employeeId: string;
            createdAt: Date;
            updatedAt: Date;
            basicSalary: import("@prisma/client/runtime/library").Decimal;
            payrollCycleId: string;
            totalAllowances: import("@prisma/client/runtime/library").Decimal;
            totalDeductions: import("@prisma/client/runtime/library").Decimal;
            loanDeductions: import("@prisma/client/runtime/library").Decimal;
            overtimeBonus: import("@prisma/client/runtime/library").Decimal;
            netSalary: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        month: number;
        year: number;
    }>;
    close(companyId: string, id: string): Promise<{
        _count: {
            payrollSlips: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PayrollCycleStatus;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        month: number;
        year: number;
    }>;
    exportWps(companyId: string, id: string, res: Response): Promise<void>;
}
