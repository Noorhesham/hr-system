import { SalaryComponentType } from '@prisma/client';
export declare class CreateSalaryComponentDto {
    type: SalaryComponentType;
    name: string;
    amount: number;
    isPercentage?: boolean;
}
