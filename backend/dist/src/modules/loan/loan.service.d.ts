import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { QueryLoansDto } from './dto/query-loans.dto';
export declare class LoanService {
    private readonly db;
    constructor(db: DatabaseService);
    create(companyId: string, employeeId: string, dto: CreateLoanDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import("@prisma/client").$Enums.LoanStatus;
        totalAmount: Prisma.Decimal;
    }>;
    findAllForEmployee(companyId: string, employeeId: string): Promise<({
        installments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            amount: Prisma.Decimal;
            status: import("@prisma/client").$Enums.LoanInstallmentStatus;
            loanId: string;
            dueDate: Date;
            payrollCycleId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import("@prisma/client").$Enums.LoanStatus;
        totalAmount: Prisma.Decimal;
    })[]>;
    findAll(companyId: string, query: QueryLoansDto): Promise<PageDto<{
        employee: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import("@prisma/client").$Enums.LoanStatus;
        totalAmount: Prisma.Decimal;
    }>>;
    findOne(companyId: string, id: string): Promise<{
        employee: {
            id: string;
            name: string;
        };
        installments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            amount: Prisma.Decimal;
            status: import("@prisma/client").$Enums.LoanInstallmentStatus;
            loanId: string;
            dueDate: Date;
            payrollCycleId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import("@prisma/client").$Enums.LoanStatus;
        totalAmount: Prisma.Decimal;
    }>;
    approve(companyId: string, id: string, dto: ApproveLoanDto): Promise<{
        installments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            amount: Prisma.Decimal;
            status: import("@prisma/client").$Enums.LoanInstallmentStatus;
            loanId: string;
            dueDate: Date;
            payrollCycleId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import("@prisma/client").$Enums.LoanStatus;
        totalAmount: Prisma.Decimal;
    }>;
    remove(companyId: string, id: string): Promise<{
        success: boolean;
    }>;
    private buildInstallmentCents;
    private assertEmployeeInCompany;
    private getOwnedOrThrow;
}
