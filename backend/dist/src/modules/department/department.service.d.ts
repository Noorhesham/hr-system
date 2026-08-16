import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { QueryDepartmentsDto } from './dto/query-departments.dto';
export declare class DepartmentService {
    private readonly db;
    constructor(db: DatabaseService);
    create(companyId: string, dto: CreateDepartmentDto): Promise<{
        _count: {
            employees: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
    }>;
    findAll(companyId: string, query: QueryDepartmentsDto): Promise<PageDto<{
        _count: {
            employees: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
    }>>;
    listOptions(companyId: string): Promise<{
        id: string;
        _count: {
            employees: number;
        };
        name: string;
    }[]>;
    findOne(companyId: string, id: string): Promise<{
        _count: {
            employees: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
    }>;
    update(companyId: string, id: string, dto: UpdateDepartmentDto): Promise<{
        _count: {
            employees: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string;
    }>;
    remove(companyId: string, id: string): Promise<{
        success: true;
    }>;
}
