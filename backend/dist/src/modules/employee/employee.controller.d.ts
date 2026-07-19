import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
export declare class EmployeeController {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
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
        basicSalary: import("@prisma/client/runtime/library").Decimal;
        isGosiRegistered: boolean;
        gosiNumber: string | null;
        shiftId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(companyId: string, query: QueryEmployeesDto): Promise<import("../../common/pagination/page.dto").PageDto<{
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
        basicSalary: import("@prisma/client/runtime/library").Decimal;
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
        basicSalary: import("@prisma/client/runtime/library").Decimal;
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
        basicSalary: import("@prisma/client/runtime/library").Decimal;
        isGosiRegistered: boolean;
        gosiNumber: string | null;
        shiftId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
