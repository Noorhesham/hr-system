import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PageDto } from '../../common/pagination/page.dto';
import { PageOptionsDto } from '../../common/pagination/page-options.dto';
export declare class EssService {
    private readonly db;
    constructor(db: DatabaseService);
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
            basicSalary: Prisma.Decimal;
            isGosiRegistered: boolean;
            shiftId: string | null;
            isActive: boolean;
        };
    }>;
    mySalaryComponents(actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isPercentage: boolean;
        employeeId: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        amount: Prisma.Decimal;
    }[]>;
    myDocuments(actor: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        type: import("@prisma/client").$Enums.DocumentType;
        expiryDate: Date | null;
        fileUrl: string | null;
        documentNumber: string | null;
    }[]>;
    myAttendance(actor: AuthenticatedUser, query: PageOptionsDto): Promise<PageDto<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shiftId: string | null;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        delayMinutes: number;
        overtimeHours: Prisma.Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
    }>>;
    myLoans(actor: AuthenticatedUser): Promise<({
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
    myPayslips(actor: AuthenticatedUser, query: PageOptionsDto): Promise<PageDto<{
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
        basicSalary: Prisma.Decimal;
        employeeId: string;
        payrollCycleId: string;
        totalAllowances: Prisma.Decimal;
        totalDeductions: Prisma.Decimal;
        loanDeductions: Prisma.Decimal;
        overtimeBonus: Prisma.Decimal;
        netSalary: Prisma.Decimal;
    }>>;
    myPayslip(actor: AuthenticatedUser, slipId: string): Promise<{
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
        basicSalary: Prisma.Decimal;
        employeeId: string;
        payrollCycleId: string;
        totalAllowances: Prisma.Decimal;
        totalDeductions: Prisma.Decimal;
        loanDeductions: Prisma.Decimal;
        overtimeBonus: Prisma.Decimal;
        netSalary: Prisma.Decimal;
    }>;
    private requireEmployeeId;
}
