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
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
const STEP_ORDER = [
    client_1.OnboardingStep.PRICING,
    client_1.OnboardingStep.ATTENDANCE,
    client_1.OnboardingStep.PAYROLL,
    client_1.OnboardingStep.BENEFITS,
    client_1.OnboardingStep.EMPLOYEES,
    client_1.OnboardingStep.COMPLETE,
];
let OnboardingService = class OnboardingService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getState(userId) {
        const user = await this.db.user.findUnique({
            where: { id: userId },
            select: {
                onboardingStep: true,
                onboardingCompletedAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            step: user.onboardingStep,
            completedAt: user.onboardingCompletedAt,
        };
    }
    async updateState(userId, step) {
        const user = await this.db.user.findUnique({
            where: { id: userId },
            select: {
                onboardingStep: true,
                onboardingCompletedAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.onboardingCompletedAt) {
            return {
                step: client_1.OnboardingStep.COMPLETE,
                completedAt: user.onboardingCompletedAt,
            };
        }
        const current = user.onboardingStep;
        const next = current == null || stepIndex(step) >= stepIndex(current) ? step : current;
        const updated = await this.db.user.update({
            where: { id: userId },
            data: { onboardingStep: next },
            select: {
                onboardingStep: true,
                onboardingCompletedAt: true,
            },
        });
        return {
            step: updated.onboardingStep,
            completedAt: updated.onboardingCompletedAt,
        };
    }
    async complete(userId) {
        const updated = await this.db.user.update({
            where: { id: userId },
            data: {
                onboardingStep: client_1.OnboardingStep.COMPLETE,
                onboardingCompletedAt: new Date(),
            },
            select: {
                onboardingStep: true,
                onboardingCompletedAt: true,
            },
        });
        return {
            step: updated.onboardingStep,
            completedAt: updated.onboardingCompletedAt,
        };
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], OnboardingService);
function stepIndex(step) {
    const idx = STEP_ORDER.indexOf(step);
    return idx < 0 ? 0 : idx;
}
//# sourceMappingURL=onboarding.service.js.map