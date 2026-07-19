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
exports.LimitsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const platform_settings_service_1 = require("./platform-settings.service");
let LimitsService = class LimitsService {
    db;
    settings;
    constructor(db, settings) {
        this.db = db;
        this.settings = settings;
    }
    async getEffectiveLimits(companyId) {
        const company = await this.db.company.findUnique({
            where: { id: companyId },
            select: { plan: { select: { maxEmployees: true } } },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        if (company.plan) {
            return { maxEmployees: company.plan.maxEmployees };
        }
        const { defaultTrialMaxEmployees } = await this.settings.getSettings();
        return { maxEmployees: defaultTrialMaxEmployees };
    }
    async assertCanAddEmployee(companyId) {
        const { maxEmployees } = await this.getEffectiveLimits(companyId);
        const activeCount = await this.db.employee.count({
            where: { companyId, isActive: true },
        });
        if (activeCount >= maxEmployees) {
            throw new common_1.ForbiddenException(`Employee limit reached (${maxEmployees}). Upgrade your plan to add more.`);
        }
    }
};
exports.LimitsService = LimitsService;
exports.LimitsService = LimitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        platform_settings_service_1.PlatformSettingsService])
], LimitsService);
//# sourceMappingURL=limits.service.js.map