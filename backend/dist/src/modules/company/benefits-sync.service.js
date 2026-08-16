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
exports.BenefitsSyncService = exports.BENEFIT_COMPONENT_NAMES = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
exports.BENEFIT_COMPONENT_NAMES = {
    housing: 'Housing Allowance',
    transport: 'Transport Allowance',
    annualTickets: 'Annual Tickets Allowance',
};
let BenefitsSyncService = class BenefitsSyncService {
    db;
    constructor(db) {
        this.db = db;
    }
    async syncEmployeeBenefits(companyId, employeeIds) {
        const policy = await this.db.companyPolicy.findUnique({
            where: { companyId },
        });
        if (!policy)
            return;
        const employees = await this.db.employee.findMany({
            where: {
                companyId,
                isActive: true,
                ...(employeeIds?.length ? { id: { in: employeeIds } } : {}),
            },
            select: { id: true },
        });
        if (!employees.length)
            return;
        for (const emp of employees) {
            await this.syncOne(emp.id, policy);
        }
    }
    async syncOne(employeeId, policy) {
        await this.upsertOrDelete(employeeId, exports.BENEFIT_COMPONENT_NAMES.housing, policy.benefitHousingAllowance &&
            policy.benefitHousingAllowanceAmount != null &&
            policy.benefitHousingAllowanceAmount.toNumber() > 0
            ? {
                amount: policy.benefitHousingAllowanceAmount.toNumber(),
                isPercentage: policy.benefitHousingAllowanceIsPercentage,
            }
            : null);
        await this.upsertOrDelete(employeeId, exports.BENEFIT_COMPONENT_NAMES.transport, policy.benefitTransportAllowance &&
            policy.benefitTransportAllowanceAmount != null &&
            policy.benefitTransportAllowanceAmount.toNumber() > 0
            ? {
                amount: policy.benefitTransportAllowanceAmount.toNumber(),
                isPercentage: false,
            }
            : null);
        const annual = policy.benefitAnnualTicketsAmount?.toNumber() ?? 0;
        const monthlyTickets = Math.round((annual / 12) * 100) / 100;
        await this.upsertOrDelete(employeeId, exports.BENEFIT_COMPONENT_NAMES.annualTickets, policy.benefitAnnualTickets && monthlyTickets > 0
            ? { amount: monthlyTickets, isPercentage: false }
            : null);
    }
    async upsertOrDelete(employeeId, name, wanted) {
        const existing = await this.db.salaryComponent.findFirst({
            where: { employeeId, name },
        });
        if (!wanted) {
            if (existing) {
                await this.db.salaryComponent.delete({ where: { id: existing.id } });
            }
            return;
        }
        if (existing) {
            await this.db.salaryComponent.update({
                where: { id: existing.id },
                data: {
                    type: client_1.SalaryComponentType.ALLOWANCE,
                    amount: new client_1.Prisma.Decimal(wanted.amount),
                    isPercentage: wanted.isPercentage,
                },
            });
            return;
        }
        await this.db.salaryComponent.create({
            data: {
                employeeId,
                type: client_1.SalaryComponentType.ALLOWANCE,
                name,
                amount: new client_1.Prisma.Decimal(wanted.amount),
                isPercentage: wanted.isPercentage,
            },
        });
    }
};
exports.BenefitsSyncService = BenefitsSyncService;
exports.BenefitsSyncService = BenefitsSyncService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], BenefitsSyncService);
//# sourceMappingURL=benefits-sync.service.js.map