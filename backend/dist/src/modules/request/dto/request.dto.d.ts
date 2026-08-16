import { RequestStatus, RequestType } from '@prisma/client';
import { PageOptionsDto } from '../../../common/pagination/page-options.dto';
export declare class CreateRequestDto {
    type: RequestType;
    employeeId?: string;
    title?: string;
    reason?: string;
    date?: string;
    hours?: number;
}
export declare class RejectRequestDto {
    reviewNote?: string;
}
export declare class QueryRequestsDto extends PageOptionsDto {
    status?: RequestStatus;
    type?: RequestType;
    employeeId?: string;
    mine?: string;
}
