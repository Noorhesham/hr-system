import { LeaveStatus } from '@prisma/client';
import { PageOptionsDto } from '../../../common/pagination/page-options.dto';
export declare class QueryLeavesDto extends PageOptionsDto {
    status?: LeaveStatus;
    employeeId?: string;
    from?: string;
    to?: string;
}
