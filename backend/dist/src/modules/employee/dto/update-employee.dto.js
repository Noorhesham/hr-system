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
exports.UpdateEmployeeDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class UpdateEmployeeDto {
    name;
    basicSalary;
    employmentType;
    salaryBasis;
    shiftId;
    isActive;
    isGosiRegistered;
    gosiNumber;
    departmentId;
    department;
    position;
    managerId;
    jobRank;
    workLocation;
    contractDurationYears;
    phone;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: false, type: () => String, maxLength: 120 }, basicSalary: { required: false, type: () => Number, minimum: 0 }, employmentType: { required: false, enum: ["PERMANENT", "TEMPORARY", "CONTRACT", "PROBATION"] }, salaryBasis: { required: false, enum: ["MONTHLY", "DAILY", "HOURLY"] }, shiftId: { required: false, type: () => String, nullable: true }, isActive: { required: false, type: () => Boolean }, isGosiRegistered: { required: false, type: () => Boolean }, gosiNumber: { required: false, type: () => String, maxLength: 50 }, departmentId: { required: false, type: () => String, nullable: true, format: "uuid" }, department: { required: false, type: () => String, maxLength: 120 }, position: { required: false, type: () => String, maxLength: 120 }, managerId: { required: false, type: () => String, nullable: true, format: "uuid" }, jobRank: { required: false, enum: ["EMPLOYEE", "TEAM_LEAD", "DEPARTMENT_MANAGER"] }, workLocation: { required: false, enum: ["HEADQUARTERS", "REMOTE", "BRANCH"] }, contractDurationYears: { required: false, type: () => Number, nullable: true, minimum: 0 }, phone: { required: false, type: () => String, nullable: true, maxLength: 30 } };
    }
}
exports.UpdateEmployeeDto = UpdateEmployeeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ahmed Ali', maxLength: 120 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 6000, minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateEmployeeDto.prototype, "basicSalary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.EmploymentType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.EmploymentType),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "employmentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SalaryBasis }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SalaryBasis),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "salaryBasis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        format: 'uuid',
        nullable: true,
        description: 'Clear with null.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== null && v !== undefined),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateEmployeeDto.prototype, "shiftId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: false,
        description: 'Set to false to deactivate the employee (resignation).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateEmployeeDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateEmployeeDto.prototype, "isGosiRegistered", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '123456789', maxLength: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "gosiNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        format: 'uuid',
        nullable: true,
        description: 'Tenant department id. Null clears.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== null && v !== undefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdateEmployeeDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'الهندسة',
        maxLength: 120,
        deprecated: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'مهندس برمجيات', maxLength: 120 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        format: 'uuid',
        nullable: true,
        description: 'Direct manager employee id (same company). Null clears.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== null && v !== undefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdateEmployeeDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.JobRank }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.JobRank),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "jobRank", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.WorkLocation }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WorkLocation),
    __metadata("design:type", String)
], UpdateEmployeeDto.prototype, "workLocation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1,
        minimum: 0,
        description: 'Contract length in years.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 1 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Object)
], UpdateEmployeeDto.prototype, "contractDurationYears", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '501234567',
        maxLength: 30,
        nullable: true,
        description: 'Updates linked portal User.phone when present. Null clears.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== null && v !== undefined),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", Object)
], UpdateEmployeeDto.prototype, "phone", void 0);
//# sourceMappingURL=update-employee.dto.js.map