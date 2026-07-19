import { SalaryComponentService } from './salary-component.service';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { UpdateSalaryComponentDto } from './dto/update-salary-component.dto';
export declare class SalaryComponentController {
    private readonly salaryComponentService;
    constructor(salaryComponentService: SalaryComponentService);
    create(companyId: string, employeeId: string, dto: CreateSalaryComponentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isPercentage: boolean;
        employeeId: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(companyId: string, employeeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isPercentage: boolean;
        employeeId: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        amount: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    update(companyId: string, id: string, dto: UpdateSalaryComponentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isPercentage: boolean;
        employeeId: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(companyId: string, id: string): Promise<{
        success: boolean;
    }>;
}
