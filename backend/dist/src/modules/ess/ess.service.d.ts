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
            companyId: string;
            userId: string | null;
            name: string;
            employmentType: import("@prisma/client").$Enums.EmploymentType;
            salaryBasis: import("@prisma/client").$Enums.SalaryBasis;
            basicSalary: Prisma.Decimal;
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
            contractDurationYears: Prisma.Decimal | null;
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
            netSalary: Prisma.Decimal;
            basicSalary: Prisma.Decimal;
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
    mySalaryComponents(actor: AuthenticatedUser): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        amount: Prisma.Decimal;
        isPercentage: boolean;
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
        shiftId: string | null;
        createdAt: Date;
        updatedAt: Date;
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
            status: import("@prisma/client").$Enums.LoanInstallmentStatus;
            payrollCycleId: string | null;
            amount: Prisma.Decimal;
            dueDate: Date;
            loanId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import("@prisma/client").$Enums.LoanStatus;
        totalAmount: Prisma.Decimal;
    })[]>;
    requestLoan(actor: AuthenticatedUser, totalAmount: number): Promise<{
        installments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.LoanInstallmentStatus;
            payrollCycleId: string | null;
            amount: Prisma.Decimal;
            dueDate: Date;
            loanId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import("@prisma/client").$Enums.LoanStatus;
        totalAmount: Prisma.Decimal;
    }>;
    myPayslips(actor: AuthenticatedUser, query: PageOptionsDto): Promise<PageDto<{
        payrollCycle: {
            id: string;
            status: import("@prisma/client").$Enums.PayrollCycleStatus;
            month: number;
            year: number;
        };
    } & {
        id: string;
        basicSalary: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
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
            status: import("@prisma/client").$Enums.PayrollCycleStatus;
            month: number;
            year: number;
        };
    } & {
        id: string;
        basicSalary: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
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
