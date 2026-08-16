import { EssService } from './ess.service';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PageOptionsDto } from '../../common/pagination/page-options.dto';
import { CreateLoanDto } from '../loan/dto/create-loan.dto';
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
            companyId: string;
            userId: string | null;
            name: string;
            employmentType: import("@prisma/client").$Enums.EmploymentType;
            salaryBasis: import("@prisma/client").$Enums.SalaryBasis;
            basicSalary: import("@prisma/client/runtime/library").Decimal;
            isGosiRegistered: boolean;
            gosiNumber: string | null;
            shiftId: string | null;
            isActive: boolean;
            departmentId: string | null;
            department: string | null;
            position: string | null;
            managerId: string | null;
            jobRank: import("@prisma/client").$Enums.JobRank;
            workLocation: import("@prisma/client").$Enums.WorkLocation;
            contractDurationYears: import("@prisma/client/runtime/library").Decimal | null;
            photoUrl: string | null;
            nationalId: string | null;
            dateOfBirth: Date | null;
            gender: import("@prisma/client").$Enums.Gender | null;
            maritalStatus: import("@prisma/client").$Enums.MaritalStatus | null;
            address: string | null;
            emergencyContactName: string | null;
            emergencyContactRelation: string | null;
            emergencyContactPhone: string | null;
            subDepartment: string | null;
            hireDate: Date | null;
            probationDays: number | null;
            bankName: string | null;
            iban: string | null;
            hasHealthInsurance: boolean;
            hasTransportAllowance: boolean;
            hasHousingAllowance: boolean;
            hasMealAllowance: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    home(actor: AuthenticatedUser): Promise<{
        employee: {
            id: string;
            name: string;
            department: string | null;
            position: string | null;
            photoUrl: string | null;
            shift: {
                id: string;
                name: string;
                startTime: string;
                endTime: string;
            } | null;
        };
        today: {
            date: string;
            status: import("@prisma/client").$Enums.AttendanceStatus | null;
            checkIn: string | null;
            checkOut: string | null;
            delayMinutes: number;
        };
        month: {
            present: number;
            late: number;
            absent: number;
            leave: number;
        };
        latestPayslip: {
            id: string;
            netSalary: import("@prisma/client/runtime/library").Decimal;
            basicSalary: import("@prisma/client/runtime/library").Decimal;
            month: number;
            year: number;
        } | null;
        pendingLeaves: number;
        pendingRequests: number;
        recentLeaves: {
            id: string;
            fromDate: string;
            toDate: string;
            status: import("@prisma/client").$Enums.LeaveStatus;
            reason: string | null;
        }[];
        recentRequests: {
            id: string;
            type: import("@prisma/client").$Enums.RequestType;
            title: string | null;
            status: import("@prisma/client").$Enums.RequestStatus;
            date: string | null;
        }[];
    }>;
    salaryComponents(actor: AuthenticatedUser): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPercentage: boolean;
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
        shiftId: string | null;
        createdAt: Date;
        updatedAt: Date;
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
            status: import("@prisma/client").$Enums.LoanInstallmentStatus;
            payrollCycleId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            dueDate: Date;
            loanId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import("@prisma/client").$Enums.LoanStatus;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    requestLoan(actor: AuthenticatedUser, dto: CreateLoanDto): Promise<{
        installments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.LoanInstallmentStatus;
            payrollCycleId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            dueDate: Date;
            loanId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import("@prisma/client").$Enums.LoanStatus;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    payslips(actor: AuthenticatedUser, query: PageOptionsDto): Promise<import("../../common/pagination/page.dto").PageDto<{
        payrollCycle: {
            id: string;
            status: import("@prisma/client").$Enums.PayrollCycleStatus;
            month: number;
            year: number;
        };
    } & {
        id: string;
        basicSalary: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
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
            status: import("@prisma/client").$Enums.PayrollCycleStatus;
            month: number;
            year: number;
        };
    } & {
        id: string;
        basicSalary: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        payrollCycleId: string;
        totalAllowances: import("@prisma/client/runtime/library").Decimal;
        totalDeductions: import("@prisma/client/runtime/library").Decimal;
        loanDeductions: import("@prisma/client/runtime/library").Decimal;
        overtimeBonus: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
    }>;
}
