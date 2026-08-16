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
exports.PlansController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const plans_service_1 = require("./plans.service");
const subscribe_dto_1 = require("./dto/subscribe.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
let PlansController = class PlansController {
    plans;
    constructor(plans) {
        this.plans = plans;
    }
    listPlans() {
        return this.plans.listPlans();
    }
    startTrial(companyId, user) {
        return this.plans.startTrial(companyId, user.userId);
    }
    subscribe(companyId, user, dto) {
        return this.plans.subscribe(companyId, user.userId, dto);
    }
};
exports.PlansController = PlansController;
__decorate([
    (0, common_1.Get)('plans'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PlansController.prototype, "listPlans", null);
__decorate([
    (0, common_1.Post)('company/start-trial'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_COMPANY_POLICY),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, tenant_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PlansController.prototype, "startTrial", null);
__decorate([
    (0, common_1.Post)('company/subscribe'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_COMPANY_POLICY),
    (0, swagger_1.ApiBody)({
        type: subscribe_dto_1.SubscribeDto,
        examples: {
            success: {
                summary: 'Successful dummy payment',
                value: {
                    planId: '<uuid>',
                    billingCycle: 'MONTHLY',
                    cardHolderName: 'Mohab Mohamed',
                    cardNumber: '4242 4242 4242 4242',
                    cvv: '123',
                    expiry: '12/28',
                    billingAddress: 'الشارع، رقم المبنى، الحي',
                    city: 'الرياض',
                    postalCode: '12345',
                    country: 'SA',
                    promoCode: 'WELCOME20',
                    savePaymentMethod: true,
                },
            },
            decline: {
                summary: 'Dummy decline (card ends in 0000)',
                value: {
                    planId: '<uuid>',
                    billingCycle: 'MONTHLY',
                    cardHolderName: 'Test User',
                    cardNumber: '4111111111110000',
                    cvv: '123',
                    expiry: '12/28',
                    billingAddress: 'Street',
                    city: 'Riyadh',
                    postalCode: '12345',
                    country: 'SA',
                },
            },
        },
    }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, tenant_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, subscribe_dto_1.SubscribeDto]),
    __metadata("design:returntype", void 0)
], PlansController.prototype, "subscribe", null);
exports.PlansController = PlansController = __decorate([
    (0, swagger_1.ApiTags)('Plans'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [plans_service_1.PlansService])
], PlansController);
//# sourceMappingURL=plans.controller.js.map