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
exports.SubscribeDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SubscribeDto {
    planId;
    billingCycle;
    cardHolderName;
    cardNumber;
    cvv;
    expiry;
    billingAddress;
    city;
    postalCode;
    country;
    promoCode;
    savePaymentMethod;
    static _OPENAPI_METADATA_FACTORY() {
        return { planId: { required: true, type: () => String }, billingCycle: { required: true, enum: ["MONTHLY", "ANNUAL"], enum: ['MONTHLY', 'ANNUAL'] }, cardHolderName: { required: true, type: () => String, maxLength: 120 }, cardNumber: { required: true, type: () => String, minLength: 12, maxLength: 23 }, cvv: { required: true, type: () => String, pattern: "^\\d{3,4}$" }, expiry: { required: true, type: () => String, pattern: "^(0[1-9]|1[0-2])\\/\\d{2}$" }, billingAddress: { required: true, type: () => String, maxLength: 255 }, city: { required: true, type: () => String, maxLength: 80 }, postalCode: { required: true, type: () => String, maxLength: 20 }, country: { required: true, type: () => String, maxLength: 80 }, promoCode: { required: false, type: () => String, maxLength: 40 }, savePaymentMethod: { required: false, type: () => Boolean } };
    }
}
exports.SubscribeDto = SubscribeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubscribeDto.prototype, "planId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['MONTHLY', 'ANNUAL'], example: 'MONTHLY' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['MONTHLY', 'ANNUAL']),
    __metadata("design:type", String)
], SubscribeDto.prototype, "billingCycle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mohab Mohamed', maxLength: 120 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], SubscribeDto.prototype, "cardHolderName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '4242424242424242',
        description: 'Digits only or spaced. Card numbers ending in 0000 are deliberately declined (dummy fail rule).',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(12),
    (0, class_validator_1.MaxLength)(23),
    __metadata("design:type", String)
], SubscribeDto.prototype, "cardNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123', minLength: 3, maxLength: 4 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{3,4}$/, { message: 'cvv must be 3 or 4 digits' }),
    __metadata("design:type", String)
], SubscribeDto.prototype, "cvv", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '12/28', description: 'MM/YY' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^(0[1-9]|1[0-2])\/\d{2}$/, {
        message: 'expiry must be MM/YY',
    }),
    __metadata("design:type", String)
], SubscribeDto.prototype, "expiry", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'الشارع، رقم المبنى، الحي', maxLength: 255 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SubscribeDto.prototype, "billingAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'الرياض', maxLength: 80 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], SubscribeDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '12345', maxLength: 20 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], SubscribeDto.prototype, "postalCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SA', maxLength: 80 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], SubscribeDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'WELCOME20', maxLength: 40 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], SubscribeDto.prototype, "promoCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SubscribeDto.prototype, "savePaymentMethod", void 0);
//# sourceMappingURL=subscribe.dto.js.map