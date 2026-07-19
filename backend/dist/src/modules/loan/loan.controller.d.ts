import { LoanService } from './loan.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { QueryLoansDto } from './dto/query-loans.dto';
export declare class LoanController {
    private readonly loanService;
    constructor(loanService: LoanService);
    create(companyId: string, employeeId: string, dto: CreateLoanDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import("@prisma/client").$Enums.LoanStatus;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAllForEmployee(companyId: string, employeeId: string): Promise<({
        installments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
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
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    findAll(companyId: string, query: QueryLoansDto): Promise<import("../../common/pagination/page.dto").PageDto<{
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
        totalAmount: import("@prisma/client/runtime/library").Decimal;
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
            amount: import("@prisma/client/runtime/library").Decimal;
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
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    approve(companyId: string, id: string, dto: ApproveLoanDto): Promise<{
        installments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
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
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(companyId: string, id: string): Promise<{
        success: boolean;
    }>;
}
