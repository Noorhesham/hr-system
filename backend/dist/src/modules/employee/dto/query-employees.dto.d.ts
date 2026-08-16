import { PageOptionsDto } from '../../../common/pagination/page-options.dto';
export declare class QueryEmployeesDto extends PageOptionsDto {
    isActive?: boolean;
    departmentId?: string;
    department?: string;
    accountStatus?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
    managersOnly?: boolean;
}
