import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { QueryPayrollCyclesDto } from './dto/query-payroll-cycles.dto';
export declare class PayrollService {
    private readonly db;
    constructor(db: DatabaseService);
    createCycle(companyId: string, dto: CreatePayrollCycleDto): Promise<{
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
            basicSalary: Prisma.Decimal;
            payrollCycleId: string;
            totalAllowances: Prisma.Decimal;
            totalDeductions: Prisma.Decimal;
            loanDeductions: Prisma.Decimal;
            overtimeBonus: Prisma.Decimal;
            netSalary: Prisma.Decimal;
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
    findAll(companyId: string, query: QueryPayrollCyclesDto): Promise<PageDto<{
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
            basicSalary: Prisma.Decimal;
            payrollCycleId: string;
            totalAllowances: Prisma.Decimal;
            totalDeductions: Prisma.Decimal;
            loanDeductions: Prisma.Decimal;
            overtimeBonus: Prisma.Decimal;
            netSalary: Prisma.Decimal;
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
        basicSalary: Prisma.Decimal;
        payrollCycleId: string;
        totalAllowances: Prisma.Decimal;
        totalDeductions: Prisma.Decimal;
        loanDeductions: Prisma.Decimal;
        overtimeBonus: Prisma.Decimal;
        netSalary: Prisma.Decimal;
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
            basicSalary: Prisma.Decimal;
            payrollCycleId: string;
            totalAllowances: Prisma.Decimal;
            totalDeductions: Prisma.Decimal;
            loanDeductions: Prisma.Decimal;
            overtimeBonus: Prisma.Decimal;
            netSalary: Prisma.Decimal;
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
    moveToReview(companyId: string, id: string): Promise<{
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
            basicSalary: Prisma.Decimal;
            payrollCycleId: string;
            totalAllowances: Prisma.Decimal;
            totalDeductions: Prisma.Decimal;
            loanDeductions: Prisma.Decimal;
            overtimeBonus: Prisma.Decimal;
            netSalary: Prisma.Decimal;
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
    exportWps(companyId: string, id: string): Promise<{
        filename: string;
        contentType: string;
        body: string;
    }>;
    private runCalculation;
    private assertStatus;
    private getOwnedOrThrow;
}
