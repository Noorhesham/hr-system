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
exports.CreateShiftDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const time_constant_1 = require("../../../common/constants/time.constant");
class CreateShiftDto {
    name;
    startTime;
    endTime;
    gracePeriodMinutes;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, maxLength: 120 }, startTime: { required: true, type: () => String }, endTime: { required: true, type: () => String }, gracePeriodMinutes: { required: false, type: () => Number, minimum: 0, maximum: 240 } };
    }
}
exports.CreateShiftDto = CreateShiftDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Morning', maxLength: 120 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateShiftDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '08:00', description: '24-hour HH:mm' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(time_constant_1.HH_MM_REGEX, { message: 'startTime must be a valid 24-hour HH:mm' }),
    __metadata("design:type", String)
], CreateShiftDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '17:00',
        description: '24-hour HH:mm. May be <= startTime for overnight shifts.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(time_constant_1.HH_MM_REGEX, { message: 'endTime must be a valid 24-hour HH:mm' }),
    __metadata("design:type", String)
], CreateShiftDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 15, minimum: 0, maximum: 240 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(240),
    __metadata("design:type", Number)
], CreateShiftDto.prototype, "gracePeriodMinutes", void 0);
//# sourceMappingURL=create-shift.dto.js.map