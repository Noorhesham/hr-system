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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
const page_dto_1 = require("../../common/pagination/page.dto");
const page_meta_dto_1 = require("../../common/pagination/page-meta.dto");
const time_constant_1 = require("../../common/constants/time.constant");
const attendance_time_util_1 = require("../../common/utils/attendance-time.util");
const SORTABLE = ['createdAt', 'updatedAt', 'date', 'checkIn'];
class RowError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
let AttendanceService = class AttendanceService {
    db;
    constructor(db) {
        this.db = db;
    }
    async checkIn(actor, companyId, dto) {
        const employeeId = this.resolvePunchTarget(actor, dto.employeeId);
        const emp = await this.assertEmployeeInCompany(companyId, employeeId);
        if (!emp.isActive) {
            throw new common_1.UnprocessableEntityException('Employee is not active');
        }
        const tz = (0, time_constant_1.getDefaultTz)();
        const at = dto.at ? new Date(dto.at) : new Date();
        const day = (0, attendance_time_util_1.normalizeToTenantDay)(at, tz);
        const shiftId = await this.requireShiftId(companyId, dto.shiftId, emp.shiftId);
        const shift = await this.loadShift(companyId, shiftId);
        const outside = (0, attendance_time_util_1.checkInOutsideShiftReason)(at, day, shift, tz);
        if (outside) {
            throw new common_1.BadRequestException(outside);
        }
        return this.db.$transaction(async (tx) => {
            const existing = await tx.attendanceRecord.findUnique({
                where: { employeeId_date: { employeeId, date: day } },
            });
            if (existing?.checkIn) {
                throw new common_1.ConflictException('Already checked in for this day');
            }
            if (existing &&
                (existing.status === client_1.AttendanceStatus.ABSENT ||
                    existing.status === client_1.AttendanceStatus.LEAVE)) {
                throw new common_1.ConflictException(`Day is marked ${existing.status}; clear it before check-in`);
            }
            const metrics = (0, attendance_time_util_1.computeAttendanceMetrics)({ date: day, checkIn: at, checkOut: existing?.checkOut ?? null }, shift, tz);
            const rec = await tx.attendanceRecord.upsert({
                where: { employeeId_date: { employeeId, date: day } },
                create: {
                    employeeId,
                    date: day,
                    shiftId,
                    checkIn: at,
                    status: client_1.AttendanceStatus.PRESENT,
                    delayMinutes: metrics.delayMinutes,
                    overtimeHours: metrics.overtimeHours,
                },
                update: {
                    checkIn: at,
                    status: client_1.AttendanceStatus.PRESENT,
                    shiftId,
                    delayMinutes: metrics.delayMinutes,
                    overtimeHours: metrics.overtimeHours,
                },
            });
            return this.serialize(rec);
        });
    }
    async checkOut(actor, companyId, dto) {
        const employeeId = this.resolvePunchTarget(actor, dto.employeeId);
        await this.assertEmployeeInCompany(companyId, employeeId);
        const tz = (0, time_constant_1.getDefaultTz)();
        const at = dto.at ? new Date(dto.at) : new Date();
        return this.db.$transaction(async (tx) => {
            const open = await tx.attendanceRecord.findFirst({
                where: { employeeId, checkIn: { not: null }, checkOut: null },
                orderBy: { checkIn: 'desc' },
            });
            if (!open || !open.checkIn) {
                throw new common_1.ConflictException('No open check-in to check out from');
            }
            if (at.getTime() < open.checkIn.getTime()) {
                throw new common_1.BadRequestException('checkOut cannot precede checkIn');
            }
            const shift = open.shiftId ? await this.loadShift(companyId, open.shiftId) : null;
            const metrics = (0, attendance_time_util_1.computeAttendanceMetrics)({ date: open.date, checkIn: open.checkIn, checkOut: at }, shift, tz);
            const rec = await tx.attendanceRecord.update({
                where: { id: open.id },
                data: {
                    checkOut: at,
                    status: client_1.AttendanceStatus.PRESENT,
                    delayMinutes: metrics.delayMinutes,
                    overtimeHours: metrics.overtimeHours,
                },
            });
            return this.serialize(rec);
        });
    }
    async upsert(companyId, dto) {
        const emp = await this.assertEmployeeInCompany(companyId, dto.employeeId);
        const tz = (0, time_constant_1.getDefaultTz)();
        const day = (0, attendance_time_util_1.normalizeToTenantDay)(new Date(dto.date), tz);
        this.assertStatusConsistency(dto.status, dto.checkIn, dto.checkOut);
        const status = dto.status ?? client_1.AttendanceStatus.PRESENT;
        const needsShift = status === client_1.AttendanceStatus.PRESENT && (!!dto.checkIn || !!dto.checkOut);
        const shiftId = needsShift
            ? await this.requireShiftId(companyId, dto.shiftId, emp.shiftId)
            : await this.resolveShiftId(companyId, dto.shiftId, emp.shiftId);
        const shift = shiftId ? await this.loadShift(companyId, shiftId) : null;
        const checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
        const checkOut = dto.checkOut ? new Date(dto.checkOut) : null;
        if (checkIn && checkOut && checkOut.getTime() < checkIn.getTime()) {
            throw new common_1.BadRequestException('checkOut cannot precede checkIn');
        }
        const { delayMinutes, overtimeHours } = this.resolveMetrics(dto, day, checkIn, checkOut, shift, tz);
        const rec = await this.db.attendanceRecord.upsert({
            where: { employeeId_date: { employeeId: dto.employeeId, date: day } },
            create: {
                employeeId: dto.employeeId,
                date: day,
                shiftId,
                checkIn,
                checkOut,
                status,
                delayMinutes,
                overtimeHours,
            },
            update: { shiftId, checkIn, checkOut, status, delayMinutes, overtimeHours },
        });
        return this.serialize(rec);
    }
    async update(companyId, id, dto) {
        const existing = await this.getOwnedOrThrow(companyId, id);
        const tz = (0, time_constant_1.getDefaultTz)();
        const checkIn = dto.checkIn !== undefined ? new Date(dto.checkIn) : existing.checkIn;
        const checkOut = dto.checkOut !== undefined ? new Date(dto.checkOut) : existing.checkOut;
        const shiftId = dto.shiftId !== undefined ? dto.shiftId : existing.shiftId;
        const status = dto.status ?? existing.status;
        this.assertStatusConsistency(status, checkIn, checkOut);
        if (checkIn && checkOut && checkOut.getTime() < checkIn.getTime()) {
            throw new common_1.BadRequestException('checkOut cannot precede checkIn');
        }
        const shift = shiftId ? await this.loadShift(companyId, shiftId) : null;
        const { delayMinutes, overtimeHours } = this.resolveMetrics(dto, existing.date, checkIn, checkOut, shift, tz);
        const rec = await this.db.attendanceRecord.update({
            where: { id },
            data: { shiftId, checkIn, checkOut, status, delayMinutes, overtimeHours },
        });
        return this.serialize(rec);
    }
    async findAll(actor, companyId, query) {
        const tz = (0, time_constant_1.getDefaultTz)();
        const scopedEmployeeId = actor.isPortalUser
            ? actor.employeeId
            : query.employeeId;
        if (actor.isPortalUser && !scopedEmployeeId) {
            throw new common_1.ForbiddenException('Portal account is not linked to an employee');
        }
        const where = {
            employee: { companyId },
            ...(scopedEmployeeId ? { employeeId: scopedEmployeeId } : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.dateFrom || query.dateTo
                ? {
                    date: {
                        ...(query.dateFrom
                            ? { gte: (0, attendance_time_util_1.normalizeToTenantDay)(new Date(query.dateFrom), tz) }
                            : {}),
                        ...(query.dateTo
                            ? { lte: (0, attendance_time_util_1.normalizeToTenantDay)(new Date(query.dateTo), tz) }
                            : {}),
                    },
                }
                : {}),
        };
        const orderBy = SORTABLE.includes(query.orderBy) ? query.orderBy : 'date';
        const [data, itemCount] = await Promise.all([
            this.db.attendanceRecord.findMany({
                where,
                orderBy: { [orderBy]: query.prismaOrder },
                skip: query.skip,
                take: query.limit,
                include: { employee: { select: { id: true, name: true } } },
            }),
            this.db.attendanceRecord.count({ where }),
        ]);
        return new page_dto_1.PageDto(data.map((r) => this.serialize(r)), new page_meta_dto_1.PageMetaDto({ pageOptionsDto: query, itemCount }));
    }
    async findOne(actor, companyId, id) {
        const rec = await this.db.attendanceRecord.findFirst({
            where: {
                id,
                employee: { companyId },
                ...(actor.isPortalUser && actor.employeeId
                    ? { employeeId: actor.employeeId }
                    : {}),
            },
            include: { employee: { select: { id: true, name: true } } },
        });
        if (!rec) {
            throw new common_1.NotFoundException('Attendance record not found');
        }
        return this.serialize(rec);
    }
    async bulkUpsert(companyId, dto) {
        const tz = (0, time_constant_1.getDefaultTz)();
        const empIds = [...new Set(dto.records.map((r) => r.employeeId))];
        const shiftIds = [
            ...new Set(dto.records.filter((r) => r.shiftId).map((r) => r.shiftId)),
        ];
        const emps = await this.db.employee.findMany({
            where: { id: { in: empIds }, companyId },
            select: { id: true, shiftId: true, isActive: true },
        });
        const empMap = new Map(emps.map((e) => [e.id, e]));
        const shifts = await this.db.shift.findMany({
            where: { id: { in: shiftIds }, companyId },
            select: { id: true, startTime: true, endTime: true, gracePeriodMinutes: true },
        });
        const shiftMap = new Map(shifts.map((s) => [s.id, s]));
        const seen = new Set();
        const results = [];
        for (let i = 0; i < dto.records.length; i++) {
            const r = dto.records[i];
            try {
                const emp = empMap.get(r.employeeId);
                if (!emp)
                    throw new RowError('EMPLOYEE_NOT_FOUND', 'Employee not found');
                const day = (0, attendance_time_util_1.normalizeToTenantDay)(new Date(r.date), tz);
                const key = `${r.employeeId}|${day.toISOString()}`;
                if (seen.has(key)) {
                    throw new RowError('DUPLICATE_IN_BATCH', 'Duplicate (employee,date) in batch');
                }
                seen.add(key);
                if (r.shiftId && !shiftMap.has(r.shiftId)) {
                    throw new RowError('SHIFT_NOT_FOUND', 'Shift not found in your company');
                }
                this.assertStatusConsistency(r.status, r.checkIn, r.checkOut);
                const shiftId = r.shiftId ?? emp.shiftId ?? null;
                const shift = shiftId
                    ? shiftMap.get(shiftId) ?? null
                    : null;
                const checkIn = r.checkIn ? new Date(r.checkIn) : null;
                const checkOut = r.checkOut ? new Date(r.checkOut) : null;
                const { delayMinutes, overtimeHours } = this.resolveMetrics(r, day, checkIn, checkOut, shift, tz);
                const status = r.status ?? client_1.AttendanceStatus.PRESENT;
                await this.db.attendanceRecord.upsert({
                    where: { employeeId_date: { employeeId: r.employeeId, date: day } },
                    create: {
                        employeeId: r.employeeId,
                        date: day,
                        shiftId,
                        checkIn,
                        checkOut,
                        status,
                        delayMinutes,
                        overtimeHours,
                    },
                    update: { shiftId, checkIn, checkOut, status, delayMinutes, overtimeHours },
                });
                results.push({ index: i, employeeId: r.employeeId, date: (0, attendance_time_util_1.formatYmd)(day), status: 'OK' });
            }
            catch (e) {
                results.push({
                    index: i,
                    employeeId: r.employeeId,
                    status: 'ERROR',
                    code: e instanceof RowError ? e.code : 'ERROR',
                    message: e instanceof Error ? e.message : 'Unknown error',
                });
            }
        }
        const succeeded = results.filter((r) => r.status === 'OK').length;
        const failed = results.length - succeeded;
        const report = { total: results.length, succeeded, failed, results };
        if (succeeded === 0) {
            throw new common_1.UnprocessableEntityException(report);
        }
        return report;
    }
    resolveMetrics(src, date, checkIn, checkOut, shift, tz) {
        const derived = (0, attendance_time_util_1.computeAttendanceMetrics)({ date, checkIn, checkOut }, shift, tz);
        return {
            delayMinutes: src.delayMinutes ?? derived.delayMinutes,
            overtimeHours: src.overtimeHours !== undefined
                ? new client_1.Prisma.Decimal(src.overtimeHours)
                : derived.overtimeHours,
        };
    }
    assertStatusConsistency(status, checkIn, checkOut) {
        if ((status === client_1.AttendanceStatus.ABSENT || status === client_1.AttendanceStatus.LEAVE) &&
            (checkIn || checkOut)) {
            throw new common_1.UnprocessableEntityException('ABSENT/LEAVE records cannot have check-in/check-out times');
        }
    }
    async assertEmployeeInCompany(companyId, employeeId) {
        const emp = await this.db.employee.findFirst({
            where: { id: employeeId, companyId },
            select: { id: true, isActive: true, shiftId: true },
        });
        if (!emp) {
            throw new common_1.NotFoundException('Employee not found');
        }
        return emp;
    }
    async loadShift(companyId, shiftId) {
        const shift = await this.db.shift.findFirst({
            where: { id: shiftId, companyId },
            select: { startTime: true, endTime: true, gracePeriodMinutes: true },
        });
        if (!shift) {
            throw new common_1.BadRequestException('Shift not found in your company');
        }
        return shift;
    }
    resolvePunchTarget(actor, requestedEmployeeId) {
        if (actor.isPortalUser) {
            if (!actor.employeeId) {
                throw new common_1.ForbiddenException('Portal account is not linked to an employee');
            }
            if (requestedEmployeeId &&
                requestedEmployeeId !== actor.employeeId) {
                throw new common_1.ForbiddenException('Employees can only check in/out for themselves');
            }
            return actor.employeeId;
        }
        if (!requestedEmployeeId) {
            throw new common_1.BadRequestException('employeeId is required when punching as Company Owner');
        }
        return requestedEmployeeId;
    }
    async requireShiftId(companyId, dtoShiftId, employeeShiftId) {
        const shiftId = await this.resolveShiftId(companyId, dtoShiftId, employeeShiftId);
        if (!shiftId) {
            throw new common_1.BadRequestException('Employee has no shift assigned. Create a shift (POST /shifts), then assign it with PATCH /employees/:id { "shiftId": "..." } before check-in.');
        }
        return shiftId;
    }
    async resolveShiftId(companyId, dtoShiftId, employeeShiftId) {
        if (dtoShiftId === undefined) {
            return employeeShiftId ?? null;
        }
        await this.loadShift(companyId, dtoShiftId);
        return dtoShiftId;
    }
    async getOwnedOrThrow(companyId, id) {
        const rec = await this.db.attendanceRecord.findFirst({
            where: { id, employee: { companyId } },
        });
        if (!rec) {
            throw new common_1.NotFoundException('Attendance record not found');
        }
        return rec;
    }
    serialize(rec) {
        return { ...rec, date: (0, attendance_time_util_1.formatYmd)(rec.date) };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map