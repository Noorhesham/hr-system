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
exports.CreateEmployeeDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateEmployeeDto {
    name;
    email;
    basicSalary;
    phone;
    photoUrl;
    nationalId;
    dateOfBirth;
    gender;
    maritalStatus;
    address;
    emergencyContactName;
    emergencyContactRelation;
    emergencyContactPhone;
    departmentId;
    department;
    subDepartment;
    managerId;
    position;
    employmentType;
    contractDurationYears;
    workLocation;
    hireDate;
    jobRank;
    probationDays;
    salaryBasis;
    shiftId;
    bankName;
    iban;
    isGosiRegistered;
    gosiNumber;
    hasHealthInsurance;
    hasTransportAllowance;
    hasHousingAllowance;
    hasMealAllowance;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, maxLength: 120 }, email: { required: true, type: () => String, format: "email" }, basicSalary: { required: true, type: () => Number, minimum: 0 }, phone: { required: false, type: () => String, maxLength: 30 }, photoUrl: { required: false, type: () => String, maxLength: 500 }, nationalId: { required: false, type: () => String, maxLength: 30 }, dateOfBirth: { required: false, type: () => String }, gender: { required: false, enum: ["MALE", "FEMALE"] }, maritalStatus: { required: false, enum: ["SINGLE", "MARRIED"] }, address: { required: false, type: () => String, maxLength: 300 }, emergencyContactName: { required: false, type: () => String, maxLength: 120 }, emergencyContactRelation: { required: false, type: () => String, maxLength: 80 }, emergencyContactPhone: { required: false, type: () => String, maxLength: 30 }, departmentId: { required: false, type: () => String, format: "uuid" }, department: { required: false, type: () => String, maxLength: 120 }, subDepartment: { required: false, type: () => String, maxLength: 120 }, managerId: { required: false, type: () => String, nullable: true, format: "uuid" }, position: { required: false, type: () => String, maxLength: 120 }, employmentType: { required: false, enum: ["PERMANENT", "TEMPORARY", "CONTRACT", "PROBATION"] }, contractDurationYears: { required: false, type: () => Number, minimum: 0 }, workLocation: { required: false, enum: ["HEADQUARTERS", "REMOTE", "BRANCH"] }, hireDate: { required: false, type: () => String }, jobRank: { required: false, enum: ["EMPLOYEE", "TEAM_LEAD", "DEPARTMENT_MANAGER"] }, probationDays: { required: false, type: () => Number, minimum: 0 }, salaryBasis: { required: false, enum: ["MONTHLY", "DAILY", "HOURLY"] }, shiftId: { required: false, type: () => String }, bankName: { required: false, type: () => String, maxLength: 120 }, iban: { required: false, type: () => String, maxLength: 34 }, isGosiRegistered: { required: false, type: () => Boolean }, gosiNumber: { required: false, type: () => String, maxLength: 50 }, hasHealthInsurance: { required: false, type: () => Boolean }, hasTransportAllowance: { required: false, type: () => Boolean }, hasHousingAllowance: { required: false, type: () => Boolean }, hasMealAllowance: { required: false, type: () => Boolean } };
    }
}
exports.CreateEmployeeDto = CreateEmployeeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ahmed Ali', maxLength: 120 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'ahmed@acme.com',
        format: 'email',
        description: 'Login email for the auto-created portal account (unique).',
    }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5000, minimum: 0, description: 'Basic salary' }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "basicSalary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '501234567', maxLength: 30 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://res.cloudinary.com/.../photo.jpg' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "photoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '29801234567890', maxLength: 30 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "nationalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1995-04-21' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.Gender }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Gender),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MaritalStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MaritalStatus),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "maritalStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'الرياض، حي النرجس', maxLength: 300 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxLength: 120 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "emergencyContactName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxLength: 80 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "emergencyContactRelation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxLength: 30 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "emergencyContactPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        format: 'uuid',
        description: 'Tenant department id (preferred over free-text department)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'الهندسة',
        maxLength: 120,
        deprecated: true,
        description: 'Prefer departmentId. Kept for backward compatibility.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'هندسة البرمجيات', maxLength: 120 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "subDepartment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid', nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== null && v !== undefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateEmployeeDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'UI/UX Designer', maxLength: 120 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.EmploymentType, example: client_1.EmploymentType.PERMANENT }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.EmploymentType),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "employmentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 1 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "contractDurationYears", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.WorkLocation }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WorkLocation),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "workLocation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-04-21' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "hireDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.JobRank }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.JobRank),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "jobRank", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 90, minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEmployeeDto.prototype, "probationDays", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SalaryBasis, example: client_1.SalaryBasis.MONTHLY }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SalaryBasis),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "salaryBasis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        format: 'uuid',
        description: 'Optional shift to assign (must belong to your company).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "shiftId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'البنك الأهلي', maxLength: 120 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "bankName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'SA0380000000608010167519', maxLength: 34 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(34),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "iban", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEmployeeDto.prototype, "isGosiRegistered", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '123456789', maxLength: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "gosiNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEmployeeDto.prototype, "hasHealthInsurance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEmployeeDto.prototype, "hasTransportAllowance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEmployeeDto.prototype, "hasHousingAllowance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEmployeeDto.prototype, "hasMealAllowance", void 0);
//# sourceMappingURL=create-employee.dto.js.map