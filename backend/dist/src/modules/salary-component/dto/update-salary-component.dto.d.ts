import { SalaryComponentType } from '@prisma/client';
export declare class UpdateSalaryComponentDto {
    type?: SalaryComponentType;
    name?: string;
    amount?: number;
    isPercentage?: boolean;
}
