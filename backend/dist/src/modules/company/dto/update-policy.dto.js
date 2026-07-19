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
exports.UpdatePolicyDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class UpdatePolicyDto {
    delayDeductionType;
    absenceMultiplierUnexcused;
    absenceMultiplierExcused;
    overtimeMultiplierNormal;
    overtimeMultiplierHoliday;
    gosiEmployeePercentage;
    gosiCompanyPercentage;
    gosiNumber;
    defaultWeekendDays;
    static _OPENAPI_METADATA_FACTORY() {
        return { delayDeductionType: { required: false, enum: ["PER_MINUTE", "FIXED_AMOUNT"] }, absenceMultiplierUnexcused: { required: false, type: () => Number, minimum: 0, maximum: 10 }, absenceMultiplierExcused: { required: false, type: () => Number, minimum: 0, maximum: 10 }, overtimeMultiplierNormal: { required: false, type: () => Number, minimum: 0, maximum: 10 }, overtimeMultiplierHoliday: { required: false, type: () => Number, minimum: 0, maximum: 10 }, gosiEmployeePercentage: { required: false, type: () => Number, minimum: 0, maximum: 100 }, gosiCompanyPercentage: { required: false, type: () => Number, minimum: 0, maximum: 100 }, gosiNumber: { required: false, type: () => String, maxLength: 50 }, defaultWeekendDays: { required: false, type: () => [String], minItems: 1 } };
    }
}
exports.UpdatePolicyDto = UpdatePolicyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.DelayDeductionType,
        example: client_1.DelayDeductionType.PER_MINUTE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.DelayDeductionType),
    __metadata("design:type", String)
], UpdatePolicyDto.prototype, "delayDeductionType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1.0, minimum: 0, maximum: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], UpdatePolicyDto.prototype, "absenceMultiplierUnexcused", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0.5, minimum: 0, maximum: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], UpdatePolicyDto.prototype, "absenceMultiplierExcused", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1.5, minimum: 0, maximum: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], UpdatePolicyDto.prototype, "overtimeMultiplierNormal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2.0, minimum: 0, maximum: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], UpdatePolicyDto.prototype, "overtimeMultiplierHoliday", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 9.75, minimum: 0, maximum: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdatePolicyDto.prototype, "gosiEmployeePercentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 11.75, minimum: 0, maximum: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdatePolicyDto.prototype, "gosiCompanyPercentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'GOSI-99887', maxLength: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdatePolicyDto.prototype, "gosiNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], example: ['FRIDAY', 'SATURDAY'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdatePolicyDto.prototype, "defaultWeekendDays", void 0);
//# sourceMappingURL=update-policy.dto.js.map