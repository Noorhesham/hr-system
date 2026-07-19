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
exports.ShiftService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const page_dto_1 = require("../../common/pagination/page.dto");
const page_meta_dto_1 = require("../../common/pagination/page-meta.dto");
const SORTABLE = ['createdAt', 'updatedAt', 'name', 'startTime'];
let ShiftService = class ShiftService {
    db;
    constructor(db) {
        this.db = db;
    }
    create(companyId, dto) {
        return this.db.shift.create({
            data: {
                companyId,
                name: dto.name,
                startTime: dto.startTime,
                endTime: dto.endTime,
                gracePeriodMinutes: dto.gracePeriodMinutes,
            },
        });
    }
    async findAll(companyId, query) {
        const search = query.search?.trim();
        const where = {
            companyId,
            ...(search
                ? { name: { contains: search, mode: 'insensitive' } }
                : {}),
        };
        const orderByField = SORTABLE.includes(query.orderBy)
            ? query.orderBy
            : 'createdAt';
        const [data, itemCount] = await Promise.all([
            this.db.shift.findMany({
                where,
                orderBy: { [orderByField]: query.prismaOrder },
                skip: query.skip,
                take: query.limit,
            }),
            this.db.shift.count({ where }),
        ]);
        return new page_dto_1.PageDto(data, new page_meta_dto_1.PageMetaDto({ pageOptionsDto: query, itemCount }));
    }
    async findOne(companyId, id) {
        const shift = await this.db.shift.findFirst({ where: { id, companyId } });
        if (!shift) {
            throw new common_1.NotFoundException('Shift not found');
        }
        return shift;
    }
    async update(companyId, id, dto) {
        await this.findOne(companyId, id);
        return this.db.shift.update({
            where: { id },
            data: dto,
        });
    }
    async remove(companyId, id) {
        await this.findOne(companyId, id);
        const assigned = await this.db.employee.count({
            where: { companyId, shiftId: id },
        });
        if (assigned > 0) {
            throw new common_1.ConflictException('Shift is still assigned to employees');
        }
        await this.db.shift.delete({ where: { id } });
        return { success: true };
    }
};
exports.ShiftService = ShiftService;
exports.ShiftService = ShiftService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ShiftService);
//# sourceMappingURL=shift.service.js.map