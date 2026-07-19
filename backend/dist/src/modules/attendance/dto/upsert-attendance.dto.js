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
exports.UpsertAttendanceDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class UpsertAttendanceDto {
    employeeId;
    date;
    shiftId;
    checkIn;
    checkOut;
    status;
    delayMinutes;
    overtimeHours;
    static _OPENAPI_METADATA_FACTORY() {
        return { employeeId: { required: true, type: () => String }, date: { required: true, type: () => String }, shiftId: { required: false, type: () => String }, checkIn: { required: false, type: () => String }, checkOut: { required: false, type: () => String }, status: { required: false, enum: ["PRESENT", "ABSENT", "LEAVE"] }, delayMinutes: { required: false, type: () => Number, minimum: 0 }, overtimeHours: { required: false, type: () => Number, minimum: 0 } };
    }
}
exports.UpsertAttendanceDto = UpsertAttendanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpsertAttendanceDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-06-29', description: 'Calendar day (tenant-local).' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpsertAttendanceDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertAttendanceDto.prototype, "shiftId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-06-29T08:05:00+03:00' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpsertAttendanceDto.prototype, "checkIn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-06-29T17:30:00+03:00' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpsertAttendanceDto.prototype, "checkOut", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.AttendanceStatus, example: client_1.AttendanceStatus.PRESENT }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AttendanceStatus),
    __metadata("design:type", String)
], UpsertAttendanceDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0, description: 'Manual override of derived delay.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpsertAttendanceDto.prototype, "delayMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0, description: 'Manual override of derived overtime.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpsertAttendanceDto.prototype, "overtimeHours", void 0);
//# sourceMappingURL=upsert-attendance.dto.js.map