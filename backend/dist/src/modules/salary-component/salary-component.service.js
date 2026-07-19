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
exports.SalaryComponentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
let SalaryComponentService = class SalaryComponentService {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(companyId, employeeId, dto) {
        await this.assertEmployeeInCompany(companyId, employeeId);
        this.assertPercentageRange(dto.isPercentage ?? false, dto.amount);
        return this.db.salaryComponent.create({
            data: {
                employeeId,
                type: dto.type,
                name: dto.name,
                amount: new client_1.Prisma.Decimal(dto.amount),
                isPercentage: dto.isPercentage ?? false,
            },
        });
    }
    async findAllForEmployee(companyId, employeeId) {
        await this.assertEmployeeInCompany(companyId, employeeId);
        return this.db.salaryComponent.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async update(companyId, id, dto) {
        const existing = await this.getOwnedOrThrow(companyId, id);
        const isPercentage = dto.isPercentage ?? existing.isPercentage;
        const amount = dto.amount ?? existing.amount.toNumber();
        this.assertPercentageRange(isPercentage, amount);
        return this.db.salaryComponent.update({
            where: { id },
            data: {
                ...(dto.type !== undefined ? { type: dto.type } : {}),
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.amount !== undefined
                    ? { amount: new client_1.Prisma.Decimal(dto.amount) }
                    : {}),
                ...(dto.isPercentage !== undefined
                    ? { isPercentage: dto.isPercentage }
                    : {}),
            },
        });
    }
    async remove(companyId, id) {
        await this.getOwnedOrThrow(companyId, id);
        await this.db.salaryComponent.delete({ where: { id } });
        return { success: true };
    }
    assertPercentageRange(isPercentage, amount) {
        if (isPercentage && amount > 100) {
            throw new common_1.BadRequestException('A percentage component amount must be between 0 and 100');
        }
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
    async getOwnedOrThrow(companyId, id) {
        const component = await this.db.salaryComponent.findFirst({
            where: { id, employee: { companyId } },
        });
        if (!component) {
            throw new common_1.NotFoundException('Salary component not found');
        }
        return component;
    }
};
exports.SalaryComponentService = SalaryComponentService;
exports.SalaryComponentService = SalaryComponentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SalaryComponentService);
//# sourceMappingURL=salary-component.service.js.map