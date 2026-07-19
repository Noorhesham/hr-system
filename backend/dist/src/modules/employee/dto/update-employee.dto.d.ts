import { EmploymentType, SalaryBasis } from '@prisma/client';
export declare class UpdateEmployeeDto {
    name?: string;
    basicSalary?: number;
    employmentType?: EmploymentType;
    salaryBasis?: SalaryBasis;
    shiftId?: string;
    isActive?: boolean;
    isGosiRegistered?: boolean;
    gosiNumber?: string;
}
