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
exports.UpdatePlatformSettingDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdatePlatformSettingDto {
    defaultTrialMaxEmployees;
    trialDays;
    static _OPENAPI_METADATA_FACTORY() {
        return { defaultTrialMaxEmployees: { required: false, type: () => Number, minimum: 1, maximum: 100000 }, trialDays: { required: false, type: () => Number, minimum: 1, maximum: 365 } };
    }
}
exports.UpdatePlatformSettingDto = UpdatePlatformSettingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 10,
        minimum: 1,
        maximum: 100000,
        description: 'Seat cap applied to trial / no-plan companies',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100000),
    __metadata("design:type", Number)
], UpdatePlatformSettingDto.prototype, "defaultTrialMaxEmployees", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 14,
        minimum: 1,
        maximum: 365,
        description: 'Trial length in days, applied at company registration',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(365),
    __metadata("design:type", Number)
], UpdatePlatformSettingDto.prototype, "trialDays", void 0);
//# sourceMappingURL=update-platform-setting.dto.js.map