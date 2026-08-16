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
exports.LeaveService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
const page_dto_1 = require("../../common/pagination/page.dto");
const page_meta_dto_1 = require("../../common/pagination/page-meta.dto");
const roles_constant_1 = require("../../common/constants/roles.constant");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const attendance_time_util_1 = require("../../common/utils/attendance-time.util");
const time_constant_1 = require("../../common/constants/time.constant");
const SORTABLE = ['createdAt', 'updatedAt', 'fromDate', 'toDate'];
function hasLeaveAdmin(actor) {
    if (actor.roleName === roles_constant_1.COMPANY_OWNER_ROLE)
        return true;
    const perms = actor.permissions ?? [];
    return (perms.includes(permissions_constant_1.PERMISSIONS.MANAGE_LEAVES) ||
        perms.includes(permissions_constant_1.PERMISSIONS.APPROVE_LEAVES));
}
function mapLeave(row) {
    return {
        id: row.id,
        employeeId: row.employeeId,
        employeeName: row.employee?.name ?? null,
        managerId: row.employee?.managerId ?? null,
        fromDate: (0, attendance_time_util_1.formatYmd)(row.fromDate),
        toDate: (0, attendance_time_util_1.formatYmd)(row.toDate),
        days: (0, attendance_time_util_1.inclusiveDayCount)(row.fromDate, row.toDate),
        reason: row.reason,
        status: row.status,
        reviewedById: row.reviewedById,
        reviewedAt: row.reviewedAt?.toISOString() ?? null,
        reviewNote: row.reviewNote,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}
let LeaveService = class LeaveService {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(companyId, actor, dto) {
        const employeeId = actor.isPortalUser
            ? actor.employeeId
            : dto.employeeId || actor.employeeId;
        if (!employeeId) {
            throw new common_1.BadRequestException(actor.isPortalUser
                ? 'حسابك غير مرتبط بملف موظف'
                : 'employeeId is required');
        }
        const emp = await this.db.employee.findFirst({
            where: { id: employeeId, companyId },
            select: { id: true },
        });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        const isSelf = actor.employeeId === employeeId;
        if (actor.isPortalUser && !isSelf) {
            throw new common_1.ForbiddenException('يمكنك إنشاء إجازة لنفسك فقط');
        }
        if (!actor.isPortalUser && !hasLeaveAdmin(actor) && !isSelf) {
            throw new common_1.ForbiddenException('يمكنك إنشاء إجازة لنفسك فقط');
        }
        let from;
        let to;
        try {
            from = (0, attendance_time_util_1.parseDateOnly)(dto.fromDate);
            to = (0, attendance_time_util_1.parseDateOnly)(dto.toDate);
        }
        catch {
            throw new common_1.BadRequestException('fromDate and toDate must be YYYY-MM-DD');
        }
        if (to < from) {
            throw new common_1.BadRequestException('toDate must be on or after fromDate');
        }
        const today = (0, attendance_time_util_1.normalizeToTenantDay)(new Date(), (0, time_constant_1.getDefaultTz)());
        if (from < today) {
            throw new common_1.BadRequestException('لا يمكن طلب إجازة قبل اليوم');
        }
        const row = await this.db.leaveRequest.create({
            data: {
                employeeId,
                fromDate: from,
                toDate: to,
                reason: dto.reason?.trim() || null,
                status: client_1.LeaveStatus.PENDING,
            },
            include: {
                employee: { select: { id: true, name: true, managerId: true } },
            },
        });
        return mapLeave(row);
    }
    async findAll(companyId, actor, query) {
        const and = [
            { employee: { companyId } },
            ...this.visibilityFilters(actor),
        ];
        if (query.status)
            and.push({ status: query.status });
        if (query.employeeId)
            and.push({ employeeId: query.employeeId });
        if (query.from) {
            try {
                and.push({ toDate: { gte: (0, attendance_time_util_1.parseDateOnly)(query.from) } });
            }
            catch {
                throw new common_1.BadRequestException('from must be YYYY-MM-DD');
            }
        }
        if (query.to) {
            try {
                and.push({ fromDate: { lte: (0, attendance_time_util_1.parseDateOnly)(query.to) } });
            }
            catch {
                throw new common_1.BadRequestException('to must be YYYY-MM-DD');
            }
        }
        const where = { AND: and };
        const orderBy = SORTABLE.includes(query.orderBy)
            ? query.orderBy
            : 'createdAt';
        const [rows, itemCount] = await Promise.all([
            this.db.leaveRequest.findMany({
                where,
                orderBy: { [orderBy]: query.prismaOrder },
                skip: query.skip,
                take: query.limit,
                include: {
                    employee: { select: { id: true, name: true, managerId: true } },
                },
            }),
            this.db.leaveRequest.count({ where }),
        ]);
        return new page_dto_1.PageDto(rows.map(mapLeave), new page_meta_dto_1.PageMetaDto({ pageOptionsDto: query, itemCount }));
    }
    async findOne(companyId, actor, id) {
        const row = await this.db.leaveRequest.findFirst({
            where: {
                id,
                AND: [{ employee: { companyId } }, ...this.visibilityFilters(actor)],
            },
            include: {
                employee: { select: { id: true, name: true, managerId: true } },
            },
        });
        if (!row)
            throw new common_1.NotFoundException('Leave request not found');
        return mapLeave(row);
    }
    async approve(companyId, actor, id) {
        const row = await this.requirePending(companyId, id);
        this.assertCanReview(actor, row.employeeId, row.employee.managerId);
        const tz = (0, time_constant_1.getDefaultTz)();
        const from = (0, attendance_time_util_1.normalizeToTenantDay)(row.fromDate, tz);
        const to = (0, attendance_time_util_1.normalizeToTenantDay)(row.toDate, tz);
        const days = eachUtcDay(from, to);
        const updated = await this.db.$transaction(async (tx) => {
            const leave = await tx.leaveRequest.update({
                where: { id },
                data: {
                    status: client_1.LeaveStatus.APPROVED,
                    reviewedById: actor.userId,
                    reviewedAt: new Date(),
                    reviewNote: null,
                },
                include: {
                    employee: {
                        select: { id: true, name: true, managerId: true, shiftId: true },
                    },
                },
            });
            for (const day of days) {
                await tx.attendanceRecord.upsert({
                    where: {
                        employeeId_date: { employeeId: row.employeeId, date: day },
                    },
                    create: {
                        employeeId: row.employeeId,
                        date: day,
                        shiftId: leave.employee.shiftId,
                        status: client_1.AttendanceStatus.LEAVE,
                        checkIn: null,
                        checkOut: null,
                        delayMinutes: 0,
                        overtimeHours: 0,
                    },
                    update: {
                        status: client_1.AttendanceStatus.LEAVE,
                        checkIn: null,
                        checkOut: null,
                        delayMinutes: 0,
                        overtimeHours: 0,
                    },
                });
            }
            return leave;
        });
        return mapLeave(updated);
    }
    async reject(companyId, actor, id, dto) {
        const row = await this.requirePending(companyId, id);
        this.assertCanReview(actor, row.employeeId, row.employee.managerId);
        const updated = await this.db.leaveRequest.update({
            where: { id },
            data: {
                status: client_1.LeaveStatus.REJECTED,
                reviewedById: actor.userId,
                reviewedAt: new Date(),
                reviewNote: dto.reviewNote?.trim() || null,
            },
            include: {
                employee: { select: { id: true, name: true, managerId: true } },
            },
        });
        return mapLeave(updated);
    }
    async remove(companyId, actor, id) {
        const row = await this.db.leaveRequest.findFirst({
            where: { id, employee: { companyId } },
            include: {
                employee: { select: { id: true, managerId: true } },
            },
        });
        if (!row)
            throw new common_1.NotFoundException('Leave request not found');
        if (row.status !== client_1.LeaveStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending leave can be cancelled');
        }
        const isOwner = actor.roleName === roles_constant_1.COMPANY_OWNER_ROLE;
        const isSelf = actor.employeeId === row.employeeId;
        if (!isOwner && !isSelf) {
            throw new common_1.ForbiddenException('You cannot cancel this leave request');
        }
        await this.db.leaveRequest.delete({ where: { id } });
        return { success: true };
    }
    async requirePending(companyId, id) {
        const row = await this.db.leaveRequest.findFirst({
            where: { id, employee: { companyId } },
            include: {
                employee: { select: { id: true, name: true, managerId: true } },
            },
        });
        if (!row)
            throw new common_1.NotFoundException('Leave request not found');
        if (row.status !== client_1.LeaveStatus.PENDING) {
            throw new common_1.BadRequestException('Leave request is not pending');
        }
        return row;
    }
    visibilityFilters(actor) {
        if (actor.isPortalUser) {
            if (!actor.employeeId) {
                throw new common_1.ForbiddenException('حسابك غير مرتبط بملف موظف');
            }
            return [{ employeeId: actor.employeeId }];
        }
        if (hasLeaveAdmin(actor))
            return [];
        if (!actor.employeeId) {
            throw new common_1.ForbiddenException('No employee profile linked to this user');
        }
        return [
            {
                OR: [
                    { employeeId: actor.employeeId },
                    { employee: { managerId: actor.employeeId } },
                ],
            },
        ];
    }
    assertCanReview(actor, employeeId, managerId) {
        if (actor.isPortalUser) {
            throw new common_1.ForbiddenException('لا يمكنك مراجعة طلبات الإجازة');
        }
        if (hasLeaveAdmin(actor)) {
            if (actor.employeeId && actor.employeeId === employeeId) {
                throw new common_1.ForbiddenException('You cannot review your own leave request');
            }
            return;
        }
        if (actor.employeeId && actor.employeeId === employeeId) {
            throw new common_1.ForbiddenException('You cannot review your own leave request');
        }
        if (actor.employeeId && managerId && actor.employeeId === managerId) {
            return;
        }
        throw new common_1.ForbiddenException('Only the direct manager or company owner can review leave');
    }
};
exports.LeaveService = LeaveService;
exports.LeaveService = LeaveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], LeaveService);
function eachUtcDay(from, to) {
    const days = [];
    const cur = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    const endMs = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
    while (cur.getTime() <= endMs) {
        days.push(new Date(cur));
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return days;
}
//# sourceMappingURL=leave.service.js.map