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
exports.QueryRequestsDto = exports.RejectRequestDto = exports.CreateRequestDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const page_options_dto_1 = require("../../../common/pagination/page-options.dto");
class CreateRequestDto {
    type;
    employeeId;
    title;
    reason;
    date;
    hours;
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, enum: ["OVERTIME", "GENERAL"] }, employeeId: { required: false, type: () => String, format: "uuid" }, title: { required: false, type: () => String, minLength: 2 }, reason: { required: false, type: () => String }, date: { required: false, type: () => String }, hours: { required: false, type: () => Number, minimum: 0.5, maximum: 24 } };
    }
}
exports.CreateRequestDto = CreateRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.RequestType }),
    (0, class_validator_1.IsEnum)(client_1.RequestType),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Create on behalf of employee (admin). Portal users omit.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Required for GENERAL' }),
    (0, class_validator_1.ValidateIf)((o) => o.type === client_1.RequestType.GENERAL),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Required for OVERTIME (YYYY-MM-DD)' }),
    (0, class_validator_1.ValidateIf)((o) => o.type === client_1.RequestType.OVERTIME),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Required for OVERTIME' }),
    (0, class_validator_1.ValidateIf)((o) => o.type === client_1.RequestType.OVERTIME),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.5),
    (0, class_validator_1.Max)(24),
    __metadata("design:type", Number)
], CreateRequestDto.prototype, "hours", void 0);
class RejectRequestDto {
    reviewNote;
    static _OPENAPI_METADATA_FACTORY() {
        return { reviewNote: { required: false, type: () => String } };
    }
}
exports.RejectRequestDto = RejectRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RejectRequestDto.prototype, "reviewNote", void 0);
class QueryRequestsDto extends page_options_dto_1.PageOptionsDto {
    status;
    type;
    employeeId;
    mine;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, enum: ["PENDING", "APPROVED", "REJECTED", "IN_REVIEW", "CANCELLED"] }, type: { required: false, enum: ["OVERTIME", "GENERAL"] }, employeeId: { required: false, type: () => String, format: "uuid" }, mine: { required: false, type: () => String } };
    }
}
exports.QueryRequestsDto = QueryRequestsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.RequestStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RequestStatus),
    __metadata("design:type", String)
], QueryRequestsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.RequestType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RequestType),
    __metadata("design:type", String)
], QueryRequestsDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryRequestsDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Only the current user\'s employee requests',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryRequestsDto.prototype, "mine", void 0);
//# sourceMappingURL=request.dto.js.map