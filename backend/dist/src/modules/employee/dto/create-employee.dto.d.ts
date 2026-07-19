import { EmploymentType, SalaryBasis } from '@prisma/client';
export declare class CreateEmployeeDto {
    name: string;
    email: string;
    basicSalary: number;
    employmentType?: EmploymentType;
    salaryBasis?: SalaryBasis;
    shiftId?: string;
    isGosiRegistered?: boolean;
    gosiNumber?: string;
}
