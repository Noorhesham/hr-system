import { AttendanceStatus } from '@prisma/client';
import { PageOptionsDto } from '../../../common/pagination/page-options.dto';
export declare class QueryAttendanceDto extends PageOptionsDto {
    employeeId?: string;
    status?: AttendanceStatus;
    dateFrom?: string;
    dateTo?: string;
}
