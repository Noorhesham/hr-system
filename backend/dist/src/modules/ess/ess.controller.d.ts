import { EssService } from './ess.service';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PageOptionsDto } from '../../common/pagination/page-options.dto';
export declare class EssController {
    private readonly essService;
    constructor(essService: EssService);
    me(actor: AuthenticatedUser): Promise<{
        user: {
            userId: string;
            email: string;
            roleName: string;
            isPortalUser: boolean;
        };
        employee: {
            company: {
                id: string;
                name: string;
            };
            shift: {
                id: string;
                name: string;
                startTime: string;
                endTime: string;
                gracePeriodMinutes: number;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            companyId: string;
            gosiNumber: string | null;
            userId: string | null;
            employmentType: import("@prisma/client").$Enums.EmploymentType;
            salaryBasis: import("@prisma/client").$Enums.SalaryBasis;
            basicSalary: import("@prisma/client/runtime/library").Decimal;
            isGosiRegistered: boolean;
            shiftId: string | null;
            isActive: boolean;
        };
    }>;
    salaryComponents(actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isPercentage: boolean;
        employeeId: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        amount: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    documents(actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        type: import("@prisma/client").$Enums.DocumentType;
        expiryDate: Date | null;
        fileUrl: string | null;
        documentNumber: string | null;
    }[]>;
    attendance(actor: AuthenticatedUser, query: PageOptionsDto): Promise<import("../../common/pagination/page.dto").PageDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shiftId: string | null;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        delayMinutes: number;
        overtimeHours: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
    }>>;
    loans(actor: AuthenticatedUser): Promise<({
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
    payslips(actor: AuthenticatedUser, query: PageOptionsDto): Promise<import("../../common/pagination/page.dto").PageDto<{
        payrollCycle: {
            id: string;
            year: number;
            month: number;
            status: import("@prisma/client").$Enums.PayrollCycleStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        basicSalary: import("@prisma/client/runtime/library").Decimal;
        employeeId: string;
        payrollCycleId: string;
        totalAllowances: import("@prisma/client/runtime/library").Decimal;
        totalDeductions: import("@prisma/client/runtime/library").Decimal;
        loanDeductions: import("@prisma/client/runtime/library").Decimal;
        overtimeBonus: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
    }>>;
    payslip(actor: AuthenticatedUser, id: string): Promise<{
        employee: {
            id: string;
            name: string;
        };
        payrollCycle: {
            id: string;
            year: number;
            month: number;
            status: import("@prisma/client").$Enums.PayrollCycleStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        basicSalary: import("@prisma/client/runtime/library").Decimal;
        employeeId: string;
        payrollCycleId: string;
        totalAllowances: import("@prisma/client/runtime/library").Decimal;
        totalDeductions: import("@prisma/client/runtime/library").Decimal;
        loanDeductions: import("@prisma/client/runtime/library").Decimal;
        overtimeBonus: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
    }>;
}
