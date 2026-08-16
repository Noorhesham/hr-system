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
exports.RejectLeaveDto = exports.CreateLeaveDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateLeaveDto {
    employeeId;
    fromDate;
    toDate;
    reason;
    static _OPENAPI_METADATA_FACTORY() {
        return { employeeId: { required: false, type: () => String, format: "uuid" }, fromDate: { required: true, type: () => String }, toDate: { required: true, type: () => String }, reason: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.CreateLeaveDto = CreateLeaveDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid', description: 'Employee requesting leave. Portal users omit this (always self).' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-10' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "fromDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-12' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "toDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'إجازة سنوية', maxLength: 500 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "reason", void 0);
class RejectLeaveDto {
    reviewNote;
    static _OPENAPI_METADATA_FACTORY() {
        return { reviewNote: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.RejectLeaveDto = RejectLeaveDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'تعارض مع جدول العمل', maxLength: 500 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], RejectLeaveDto.prototype, "reviewNote", void 0);
//# sourceMappingURL=create-leave.dto.js.map