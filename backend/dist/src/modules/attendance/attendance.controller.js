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
exports.AttendanceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const attendance_service_1 = require("./attendance.service");
const check_in_dto_1 = require("./dto/check-in.dto");
const check_out_dto_1 = require("./dto/check-out.dto");
const upsert_attendance_dto_1 = require("./dto/upsert-attendance.dto");
const update_attendance_dto_1 = require("./dto/update-attendance.dto");
const bulk_attendance_dto_1 = require("./dto/bulk-attendance.dto");
const query_attendance_dto_1 = require("./dto/query-attendance.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../tenant/guards/tenant.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const tenant_decorator_1 = require("../tenant/decorators/tenant.decorator");
let AttendanceController = class AttendanceController {
    attendanceService;
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    checkIn(actor, companyId, dto) {
        return this.attendanceService.checkIn(actor, companyId, dto);
    }
    checkOut(actor, companyId, dto) {
        return this.attendanceService.checkOut(actor, companyId, dto);
    }
    upsert(companyId, dto) {
        return this.attendanceService.upsert(companyId, dto);
    }
    bulk(companyId, dto) {
        return this.attendanceService.bulkUpsert(companyId, dto);
    }
    findAll(actor, companyId, query) {
        return this.attendanceService.findAll(actor, companyId, query);
    }
    findOne(actor, companyId, id) {
        return this.attendanceService.findOne(actor, companyId, id);
    }
    update(companyId, id, dto) {
        return this.attendanceService.update(companyId, id, dto);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('check-in'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBody)({
        type: check_in_dto_1.CheckInDto,
        examples: {
            owner: {
                summary: 'Owner punches for an employee',
                value: { employeeId: 'employee-uuid' },
            },
            portal: {
                summary: 'Employee self check-in (empty body)',
                value: {},
            },
        },
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: Object }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __param(1, (0, tenant_decorator_1.Tenant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, check_in_dto_1.CheckInDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)('check-out'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBody)({
        type: check_out_dto_1.CheckOutDto,
        examples: {
            owner: {
                summary: 'Owner punches out for an employee',
                value: { employeeId: 'employee-uuid' },
            },
            portal: {
                summary: 'Employee self check-out',
                value: {},
            },
        },
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: Object }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __param(1, (0, tenant_decorator_1.Tenant)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, check_out_dto_1.CheckOutDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "checkOut", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_ATTENDANCE),
    (0, swagger_1.ApiBody)({
        type: upsert_attendance_dto_1.UpsertAttendanceDto,
        examples: {
            default: {
                summary: 'Manual entry (needs shift on employee)',
                value: {
                    employeeId: 'employee-uuid',
                    date: '2026-06-29',
                    checkIn: '2026-06-29T08:05:00+03:00',
                    checkOut: '2026-06-29T17:30:00+03:00',
                },
            },
            leave: {
                summary: 'Mark a leave day',
                value: { employeeId: 'employee-uuid', date: '2026-06-29', status: 'LEAVE' },
            },
        },
    }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upsert_attendance_dto_1.UpsertAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "upsert", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_ATTENDANCE),
    (0, swagger_1.ApiBody)({
        type: bulk_attendance_dto_1.BulkAttendanceDto,
        examples: {
            default: {
                summary: 'Two rows',
                value: {
                    records: [
                        {
                            employeeId: 'employee-uuid',
                            date: '2026-06-29',
                            checkIn: '2026-06-29T08:00:00+03:00',
                            checkOut: '2026-06-29T17:10:00+03:00',
                        },
                        {
                            employeeId: 'employee-uuid-2',
                            date: '2026-06-29',
                            status: 'ABSENT',
                        },
                    ],
                },
            },
        },
    }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, bulk_attendance_dto_1.BulkAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "bulk", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __param(1, (0, tenant_decorator_1.Tenant)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, query_attendance_dto_1.QueryAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, tenant_decorator_1.CurrentUser)()),
    __param(1, (0, tenant_decorator_1.Tenant)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)(permissions_constant_1.PERMISSIONS.MANAGE_ATTENDANCE),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_attendance_dto_1.UpdateAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "update", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('Attendance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('attendance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map