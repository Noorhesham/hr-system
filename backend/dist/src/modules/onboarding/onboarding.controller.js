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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
const onboarding_service_1 = require("./onboarding.service");
const update_onboarding_state_dto_1 = require("./dto/update-onboarding-state.dto");
let OnboardingController = class OnboardingController {
    onboarding;
    constructor(onboarding) {
        this.onboarding = onboarding;
    }
    getState(userId) {
        return this.onboarding.getState(userId);
    }
    updateState(userId, dto) {
        return this.onboarding.updateState(userId, dto.step);
    }
    complete(userId) {
        return this.onboarding.complete(userId);
    }
};
exports.OnboardingController = OnboardingController;
__decorate([
    (0, common_1.Get)('state'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "getState", null);
__decorate([
    (0, common_1.Patch)('state'),
    (0, swagger_1.ApiBody)({
        type: update_onboarding_state_dto_1.UpdateOnboardingStateDto,
        examples: {
            default: {
                summary: 'Move to payroll step',
                value: { step: client_1.OnboardingStep.PAYROLL },
            },
        },
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_onboarding_state_dto_1.UpdateOnboardingStateDto]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "updateState", null);
__decorate([
    (0, common_1.Post)('complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, tenant_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "complete", null);
exports.OnboardingController = OnboardingController = __decorate([
    (0, swagger_1.ApiTags)('Onboarding'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('onboarding'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [onboarding_service_1.OnboardingService])
], OnboardingController);
//# sourceMappingURL=onboarding.controller.js.map