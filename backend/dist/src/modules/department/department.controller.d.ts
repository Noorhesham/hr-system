import { DepartmentService } from './department.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { QueryDepartmentsDto } from './dto/query-departments.dto';
export declare class DepartmentController {
    private readonly departmentService;
    constructor(departmentService: DepartmentService);
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
    findAll(companyId: string, query: QueryDepartmentsDto): Promise<import("../../common/pagination/page.dto").PageDto<{
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
