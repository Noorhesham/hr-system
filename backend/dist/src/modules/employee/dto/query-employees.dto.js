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
exports.QueryEmployeesDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const page_options_dto_1 = require("../../../common/pagination/page-options.dto");
class QueryEmployeesDto extends page_options_dto_1.PageOptionsDto {
    isActive;
    departmentId;
    department;
    accountStatus;
    managersOnly;
    static _OPENAPI_METADATA_FACTORY() {
        return { isActive: { required: false, type: () => Boolean }, departmentId: { required: false, type: () => String, format: "uuid" }, department: { required: false, type: () => String }, accountStatus: { required: false, enum: ["ACTIVE", "INACTIVE", "ON_LEAVE"], enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] }, managersOnly: { required: false, type: () => Boolean } };
    }
}
exports.QueryEmployeesDto = QueryEmployeesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by active status',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryEmployeesDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        format: 'uuid',
        description: 'Filter by department id',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryEmployeesDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by department label (exact match) — prefer departmentId',
        example: 'الهندسة',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryEmployeesDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Account status filter: ACTIVE | INACTIVE | ON_LEAVE (approved leave covering today)',
        enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ACTIVE', 'INACTIVE', 'ON_LEAVE']),
    __metadata("design:type", String)
], QueryEmployeesDto.prototype, "accountStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Only employees eligible as direct managers: jobRank TEAM_LEAD / DEPARTMENT_MANAGER, or linked Company Owner user',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryEmployeesDto.prototype, "managersOnly", void 0);
//# sourceMappingURL=query-employees.dto.js.map