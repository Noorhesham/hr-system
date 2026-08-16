import { EmploymentType, JobRank, SalaryBasis, WorkLocation } from '@prisma/client';
export declare class UpdateEmployeeDto {
    name?: string;
    basicSalary?: number;
    employmentType?: EmploymentType;
    salaryBasis?: SalaryBasis;
    shiftId?: string | null;
    isActive?: boolean;
    isGosiRegistered?: boolean;
    gosiNumber?: string;
    departmentId?: string | null;
    department?: string;
    position?: string;
    managerId?: string | null;
    jobRank?: JobRank;
    workLocation?: WorkLocation;
    contractDurationYears?: number | null;
    phone?: string | null;
}
