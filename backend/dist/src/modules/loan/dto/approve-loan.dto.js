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
exports.ApproveLoanDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class ApproveLoanDto {
    numberOfInstallments;
    installmentAmount;
    startDate;
    static _OPENAPI_METADATA_FACTORY() {
        return { numberOfInstallments: { required: false, type: () => Number, minimum: 1, maximum: 240 }, installmentAmount: { required: false, type: () => Number, minimum: 1 }, startDate: { required: true, type: () => String } };
    }
}
exports.ApproveLoanDto = ApproveLoanDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 6,
        description: 'Split the total into this many equal monthly installments.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(240),
    __metadata("design:type", Number)
], ApproveLoanDto.prototype, "numberOfInstallments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 2000,
        description: 'Fixed monthly installment amount (the last one absorbs any remainder).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], ApproveLoanDto.prototype, "installmentAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2026-08-01',
        description: 'Due date of the first installment; each following one is +1 month.',
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ApproveLoanDto.prototype, "startDate", void 0);
//# sourceMappingURL=approve-loan.dto.js.map