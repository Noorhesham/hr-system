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
exports.CompanyService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const benefits_sync_service_1 = require("./benefits-sync.service");
let CompanyService = class CompanyService {
    db;
    benefitsSync;
    constructor(db, benefitsSync) {
        this.db = db;
        this.benefitsSync = benefitsSync;
    }
    async getCompany(companyId) {
        const company = await this.db.company.findUnique({
            where: { id: companyId },
            select: {
                id: true,
                name: true,
                establishmentNumber: true,
                website: true,
                industry: true,
                logoUrl: true,
                subscriptionStatus: true,
                trialEndsAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        return company;
    }
    async updateCompany(companyId, dto) {
        await this.getCompany(companyId);
        return this.db.company.update({
            where: { id: companyId },
            data: dto,
            select: {
                id: true,
                name: true,
                establishmentNumber: true,
                website: true,
                industry: true,
                logoUrl: true,
                subscriptionStatus: true,
                trialEndsAt: true,
                updatedAt: true,
            },
        });
    }
    async getPolicy(companyId) {
        const policy = await this.db.companyPolicy.findUnique({
            where: { companyId },
        });
        if (!policy) {
            throw new common_1.NotFoundException('Company policy not found');
        }
        return policy;
    }
    async updatePolicy(companyId, dto) {
        await this.getPolicy(companyId);
        const data = { ...dto };
        const updated = await this.db.companyPolicy.update({
            where: { companyId },
            data,
        });
        const benefitTouched = dto.benefitHousingAllowance !== undefined ||
            dto.benefitHousingAllowanceAmount !== undefined ||
            dto.benefitHousingAllowanceIsPercentage !== undefined ||
            dto.benefitTransportAllowance !== undefined ||
            dto.benefitTransportAllowanceAmount !== undefined ||
            dto.benefitAnnualTickets !== undefined ||
            dto.benefitAnnualTicketsAmount !== undefined;
        if (benefitTouched) {
            await this.benefitsSync.syncEmployeeBenefits(companyId);
        }
        return updated;
    }
};
exports.CompanyService = CompanyService;
exports.CompanyService = CompanyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        benefits_sync_service_1.BenefitsSyncService])
], CompanyService);
//# sourceMappingURL=company.service.js.map