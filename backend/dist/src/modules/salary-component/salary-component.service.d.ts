import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { UpdateSalaryComponentDto } from './dto/update-salary-component.dto';
export declare class SalaryComponentService {
    private readonly db;
    constructor(db: DatabaseService);
    create(companyId: string, employeeId: string, dto: CreateSalaryComponentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isPercentage: boolean;
        employeeId: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        amount: Prisma.Decimal;
    }>;
    findAllForEmployee(companyId: string, employeeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isPercentage: boolean;
        employeeId: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        amount: Prisma.Decimal;
    }[]>;
    update(companyId: string, id: string, dto: UpdateSalaryComponentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isPercentage: boolean;
        employeeId: string;
        type: import("@prisma/client").$Enums.SalaryComponentType;
        amount: Prisma.Decimal;
    }>;
    remove(companyId: string, id: string): Promise<{
        success: boolean;
    }>;
    private assertPercentageRange;
    private assertEmployeeInCompany;
    private getOwnedOrThrow;
}
