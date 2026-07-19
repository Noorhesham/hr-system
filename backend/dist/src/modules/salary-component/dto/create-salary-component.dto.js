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
exports.CreateSalaryComponentDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateSalaryComponentDto {
    type;
    name;
    amount;
    isPercentage;
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, enum: ["ALLOWANCE", "DEDUCTION"] }, name: { required: true, type: () => String, maxLength: 120 }, amount: { required: true, type: () => Number, minimum: 0 }, isPercentage: { required: false, type: () => Boolean } };
    }
}
exports.CreateSalaryComponentDto = CreateSalaryComponentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.SalaryComponentType, example: client_1.SalaryComponentType.ALLOWANCE }),
    (0, class_validator_1.IsEnum)(client_1.SalaryComponentType),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Housing', maxLength: 120 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1000,
        minimum: 0,
        description: 'Fixed amount, or a 0–100 percentage when isPercentage is true.',
    }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryComponentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: false,
        description: 'When true, amount is a percentage of the basic salary.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSalaryComponentDto.prototype, "isPercentage", void 0);
//# sourceMappingURL=create-salary-component.dto.js.map