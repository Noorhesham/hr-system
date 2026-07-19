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
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
let DocumentService = class DocumentService {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(companyId, employeeId, dto) {
        await this.assertEmployeeInCompany(companyId, employeeId);
        return this.db.document.create({
            data: {
                employeeId,
                type: dto.type,
                expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
                fileUrl: dto.fileUrl,
                documentNumber: dto.documentNumber,
            },
        });
    }
    async findAllForEmployee(companyId, employeeId) {
        await this.assertEmployeeInCompany(companyId, employeeId);
        return this.db.document.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
        });
    }
    findExpiring(companyId, days) {
        const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        return this.db.document.findMany({
            where: {
                employee: { companyId },
                expiryDate: { not: null, lte: until },
            },
            orderBy: { expiryDate: 'asc' },
            include: { employee: { select: { id: true, name: true } } },
        });
    }
    async remove(companyId, id) {
        const doc = await this.db.document.findFirst({
            where: { id, employee: { companyId } },
            select: { id: true },
        });
        if (!doc) {
            throw new common_1.NotFoundException('Document not found');
        }
        await this.db.document.delete({ where: { id } });
        return { success: true };
    }
    async assertEmployeeInCompany(companyId, employeeId) {
        const employee = await this.db.employee.findFirst({
            where: { id: employeeId, companyId },
            select: { id: true },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], DocumentService);
//# sourceMappingURL=document.service.js.map