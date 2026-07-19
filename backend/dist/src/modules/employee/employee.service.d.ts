import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { HashingService } from '../../core/hashing/hashing.service';
import { LimitsService } from '../platform/limits.service';
import { PageDto } from '../../common/pagination/page.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
export declare class EmployeeService {
    private readonly db;
    private readonly hashing;
    private readonly limits;
    constructor(db: DatabaseService, hashing: HashingService, limits: LimitsService);
    create(companyId: string, dto: CreateEmployeeDto): Promise<{
        portalCredentials: {
            email: string;
            temporaryPassword: string;
        };
        name: string;
        id: string;
        companyId: string;
        userId: string | null;
        employmentType: import("@prisma/client").$Enums.EmploymentType;
        salaryBasis: import("@prisma/client").$Enums.SalaryBasis;
        basicSalary: Prisma.Decimal;
        isGosiRegistered: boolean;
        gosiNumber: string | null;
        shiftId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(companyId: string, query: QueryEmployeesDto): Promise<PageDto<{
        shift: {
            name: string;
            id: string;
            startTime: string;
            endTime: string;
        } | null;
    } & {
        name: string;
        id: string;
        companyId: string;
        userId: string | null;
        employmentType: import("@prisma/client").$Enums.EmploymentType;
        salaryBasis: import("@prisma/client").$Enums.SalaryBasis;
        basicSalary: Prisma.Decimal;
        isGosiRegistered: boolean;
        gosiNumber: string | null;
        shiftId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    findOne(companyId: string, id: string): Promise<{
        shift: {
            name: string;
            id: string;
            startTime: string;
            endTime: string;
        } | null;
    } & {
        name: string;
        id: string;
        companyId: string;
        userId: string | null;
        employmentType: import("@prisma/client").$Enums.EmploymentType;
        salaryBasis: import("@prisma/client").$Enums.SalaryBasis;
        basicSalary: Prisma.Decimal;
        isGosiRegistered: boolean;
        gosiNumber: string | null;
        shiftId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(companyId: string, id: string, dto: UpdateEmployeeDto): Promise<{
        name: string;
        id: string;
        companyId: string;
        userId: string | null;
        employmentType: import("@prisma/client").$Enums.EmploymentType;
        salaryBasis: import("@prisma/client").$Enums.SalaryBasis;
        basicSalary: Prisma.Decimal;
        isGosiRegistered: boolean;
        gosiNumber: string | null;
        shiftId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private assertShiftInCompany;
}
