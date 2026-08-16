"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
const page_dto_1 = require("../../common/pagination/page.dto");
const page_meta_dto_1 = require("../../common/pagination/page-meta.dto");
const SORTABLE = ['createdAt', 'updatedAt', 'name'];
let DepartmentService = class DepartmentService {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(companyId, dto) {
        const name = dto.name.trim();
        try {
            return await this.db.department.create({
                data: { companyId, name },
                include: { _count: { select: { employees: true } } },
            });
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                err.code === 'P2002') {
                throw new common_1.ConflictException('Department name already exists');
            }
            throw err;
        }
    }
    async findAll(companyId, query) {
        const search = query.search?.trim();
        const where = {
            companyId,
            ...(search
                ? { name: { contains: search, mode: 'insensitive' } }
                : {}),
        };
        const orderBy = SORTABLE.includes(query.orderBy)
            ? query.orderBy
            : 'name';
        const [data, itemCount] = await Promise.all([
            this.db.department.findMany({
                where,
                orderBy: { [orderBy]: query.prismaOrder },
                skip: query.skip,
                take: query.limit,
                include: { _count: { select: { employees: true } } },
            }),
            this.db.department.count({ where }),
        ]);
        return new page_dto_1.PageDto(data, new page_meta_dto_1.PageMetaDto({ pageOptionsDto: query, itemCount }));
    }
    async listOptions(companyId) {
        return this.db.department.findMany({
            where: { companyId },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                _count: { select: { employees: true } },
            },
        });
    }
    async findOne(companyId, id) {
        const row = await this.db.department.findFirst({
            where: { id, companyId },
            include: { _count: { select: { employees: true } } },
        });
        if (!row)
            throw new common_1.NotFoundException('Department not found');
        return row;
    }
    async update(companyId, id, dto) {
        await this.findOne(companyId, id);
        const name = dto.name?.trim();
        if (!name)
            return this.findOne(companyId, id);
        try {
            const updated = await this.db.department.update({
                where: { id },
                data: { name },
                include: { _count: { select: { employees: true } } },
            });
            await this.db.employee.updateMany({
                where: { companyId, departmentId: id },
                data: { department: name },
            });
            return updated;
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                err.code === 'P2002') {
                throw new common_1.ConflictException('Department name already exists');
            }
            throw err;
        }
    }
    async remove(companyId, id) {
        await this.findOne(companyId, id);
        const assigned = await this.db.employee.count({
            where: { companyId, departmentId: id },
        });
        if (assigned > 0) {
            throw new common_1.ConflictException('Department is still assigned to employees');
        }
        await this.db.department.delete({ where: { id } });
        return { success: true };
    }
};
exports.DepartmentService = DepartmentService;
exports.DepartmentService = DepartmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], DepartmentService);
//# sourceMappingURL=department.service.js.map