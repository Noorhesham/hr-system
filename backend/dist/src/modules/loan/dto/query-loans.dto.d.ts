import { LoanStatus } from '@prisma/client';
import { PageOptionsDto } from '../../../common/pagination/page-options.dto';
export declare class QueryLoansDto extends PageOptionsDto {
    status?: LoanStatus;
    employeeId?: string;
}
