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
exports.ShiftController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shift_service_1 = require("./shift.service");
const create_shift_dto_1 = require("./dto/create-shift.dto");
const update_shift_dto_1 = require("./dto/update-shift.dto");
const query_shifts_dto_1 = require("./dto/query-shifts.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
let ShiftController = class ShiftController {
    shiftService;
    constructor(shiftService) {
        this.shiftService = shiftService;
    }
    create(companyId, dto) {
        return this.shiftService.create(companyId, dto);
    }
    findAll(companyId, query) {
        return this.shiftService.findAll(companyId, query);
    }
    findOne(companyId, id) {
        return this.shiftService.findOne(companyId, id);
    }
    update(companyId, id, dto) {
        return this.shiftService.update(companyId, id, dto);
    }
    remove(companyId, id) {
        return this.shiftService.remove(companyId, id);
    }
};
exports.ShiftController = ShiftController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_SHIFTS),
    (0, swagger_1.ApiBody)({
        type: create_shift_dto_1.CreateShiftDto,
        examples: {
            default: {
                summary: 'Morning shift',
                value: {
                    name: 'Morning',
                    startTime: '08:00',
                    endTime: '17:00',
                    gracePeriodMinutes: 15,
                },
            },
            overnight: {
                summary: 'Night shift (crosses midnight)',
                value: {
                    name: 'Night',
                    startTime: '22:00',
                    endTime: '06:00',
                    gracePeriodMinutes: 10,
                },
            },
        },
    }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_shift_dto_1.CreateShiftDto]),
    __metadata("design:returntype", void 0)
], ShiftController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_shifts_dto_1.QueryShiftsDto]),
    __metadata("design:returntype", void 0)
], ShiftController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ShiftController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_SHIFTS),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_shift_dto_1.UpdateShiftDto]),
    __metadata("design:returntype", void 0)
], ShiftController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_SHIFTS),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ShiftController.prototype, "remove", null);
exports.ShiftController = ShiftController = __decorate([
    (0, swagger_1.ApiTags)('Shifts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('shifts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [shift_service_1.ShiftService])
], ShiftController);
//# sourceMappingURL=shift.controller.js.map