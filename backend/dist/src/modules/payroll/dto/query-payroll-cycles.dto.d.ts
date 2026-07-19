import { PayrollCycleStatus } from '@prisma/client';
import { PageOptionsDto } from '../../../common/pagination/page-options.dto';
export declare class QueryPayrollCyclesDto extends PageOptionsDto {
    status?: PayrollCycleStatus;
    month?: number;
    year?: number;
}
