import { SalaryComponentService } from './salary-component.service';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { UpdateSalaryComponentDto } from './dto/update-salary-component.dto';
export declare class SalaryComponentController {
    private readonly salaryComponentService;
    constructor(salaryComponentService: SalaryComponentService);
    create(companyId: string, employeeId: string, dto: CreateSalaryComponentDto): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        name: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPercentage: boolean;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
    }>;
    findAll(companyId: string, employeeId: string): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        name: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPercentage: boolean;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
    }[]>;
    update(companyId: string, id: string, dto: UpdateSalaryComponentDto): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        name: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPercentage: boolean;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
    }>;
    remove(companyId: string, id: string): Promise<{
        success: boolean;
    }>;
}
