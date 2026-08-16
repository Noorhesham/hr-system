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
exports.RequestService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
const page_dto_1 = require("../../common/pagination/page.dto");
const page_meta_dto_1 = require("../../common/pagination/page-meta.dto");
const roles_constant_1 = require("../../common/constants/roles.constant");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const attendance_time_util_1 = require("../../common/utils/attendance-time.util");
const notification_service_1 = require("../notification/notification.service");
const SORTABLE = ['createdAt', 'updatedAt', 'date', 'status'];
function mapRequest(row) {
    return {
        id: row.id,
        companyId: row.companyId,
        employeeId: row.employeeId,
        employeeName: row.employee?.name ?? null,
        managerId: row.employee?.managerId ?? null,
        type: row.type,
        title: row.title,
        reason: row.reason,
        date: row.date ? (0, attendance_time_util_1.formatYmd)(row.date) : null,
        hours: row.hours != null ? Number(row.hours) : null,
        status: row.status,
        approvalLevel: row.approvalLevel,
        reviewedById: row.reviewedById,
        reviewedAt: row.reviewedAt?.toISOString() ?? null,
        reviewNote: row.reviewNote,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        steps: (row.steps ?? []).map((s) => ({
            id: s.id,
            level: s.level,
            action: s.action,
            actorId: s.actorId,
            note: s.note,
            createdAt: s.createdAt.toISOString(),
        })),
    };
}
let RequestService = class RequestService {
    db;
    notifications;
    constructor(db, notifications) {
        this.db = db;
        this.notifications = notifications;
    }
    async create(companyId, actor, dto) {
        const isOwner = actor.roleName === roles_constant_1.COMPANY_OWNER_ROLE;
        const hasManage = this.hasPerm(actor, permissions_constant_1.PERMISSIONS.MANAGE_REQUESTS);
        let employeeId = dto.employeeId;
        if (actor.isPortalUser) {
            if (!actor.employeeId) {
                throw new common_1.BadRequestException('حسابك غير مرتبط بملف موظف');
            }
            employeeId = actor.employeeId;
        }
        else if (!employeeId) {
            if (!actor.employeeId) {
                throw new common_1.BadRequestException('employeeId is required');
            }
            employeeId = actor.employeeId;
        }
        const emp = await this.db.employee.findFirst({
            where: { id: employeeId, companyId },
            include: {
                manager: { select: { userId: true, name: true } },
                user: { select: { id: true, email: true } },
            },
        });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        const isSelf = actor.employeeId === employeeId;
        if (!isOwner && !hasManage && !isSelf) {
            throw new common_1.ForbiddenException('You can only create requests for yourself');
        }
        if (dto.type === client_1.RequestType.OVERTIME) {
            if (!dto.date || dto.hours == null) {
                throw new common_1.BadRequestException('OVERTIME requires date and hours');
            }
        }
        if (dto.type === client_1.RequestType.GENERAL && !dto.title?.trim()) {
            throw new common_1.BadRequestException('GENERAL requires a title');
        }
        let otDate = null;
        if (dto.date) {
            try {
                otDate = (0, attendance_time_util_1.parseDateOnly)(dto.date);
            }
            catch {
                throw new common_1.BadRequestException('date must be YYYY-MM-DD');
            }
        }
        const row = await this.db.employeeRequest.create({
            data: {
                companyId,
                employeeId,
                type: dto.type,
                title: dto.title?.trim() || null,
                reason: dto.reason?.trim() || null,
                date: otDate,
                hours: dto.hours != null ? new client_1.Prisma.Decimal(dto.hours) : null,
                status: client_1.RequestStatus.PENDING,
                approvalLevel: 1,
            },
            include: {
                employee: { select: { id: true, name: true, managerId: true } },
                steps: true,
            },
        });
        await this.notifyManagersOnSubmit(companyId, emp, row.id, dto.type);
        return mapRequest(row);
    }
    async findAll(companyId, actor, query) {
        const mine = query.mine === '1' ||
            query.mine === 'true' ||
            actor.isPortalUser;
        const and = [{ companyId }];
        if (mine) {
            if (!actor.employeeId) {
                return new page_dto_1.PageDto([], new page_meta_dto_1.PageMetaDto({
                    pageOptionsDto: query,
                    itemCount: 0,
                }));
            }
            and.push({ employeeId: actor.employeeId });
        }
        else {
            and.push(...this.adminVisibility(actor));
        }
        if (query.status)
            and.push({ status: query.status });
        if (query.type)
            and.push({ type: query.type });
        if (query.employeeId)
            and.push({ employeeId: query.employeeId });
        const orderByField = SORTABLE.includes(query.orderBy)
            ? query.orderBy
            : 'createdAt';
        const where = { AND: and };
        const [total, rows] = await Promise.all([
            this.db.employeeRequest.count({ where }),
            this.db.employeeRequest.findMany({
                where,
                orderBy: { [orderByField]: query.prismaOrder },
                skip: query.skip,
                take: query.limit,
                include: {
                    employee: { select: { id: true, name: true, managerId: true } },
                    steps: { orderBy: { createdAt: 'asc' } },
                },
            }),
        ]);
        return new page_dto_1.PageDto(rows.map(mapRequest), new page_meta_dto_1.PageMetaDto({ pageOptionsDto: query, itemCount: total }));
    }
    async findOne(companyId, actor, id) {
        const row = await this.db.employeeRequest.findFirst({
            where: { id, companyId },
            include: {
                employee: { select: { id: true, name: true, managerId: true } },
                steps: { orderBy: { createdAt: 'asc' } },
            },
        });
        if (!row)
            throw new common_1.NotFoundException('Request not found');
        this.assertCanView(actor, row.employeeId, row.employee?.managerId ?? null);
        return mapRequest(row);
    }
    async approve(companyId, actor, id) {
        const row = await this.loadPending(companyId, id);
        if (row.status !== client_1.RequestStatus.PENDING &&
            row.status !== client_1.RequestStatus.IN_REVIEW) {
            throw new common_1.BadRequestException('Request is not awaiting approval');
        }
        if (actor.employeeId && actor.employeeId === row.employeeId) {
            throw new common_1.ForbiddenException('Cannot approve your own request');
        }
        const isOwner = actor.roleName === roles_constant_1.COMPANY_OWNER_ROLE;
        const level = row.approvalLevel;
        if (level === 1) {
            const isManager = await this.isDirectManager(actor, row.employeeId);
            if (!isOwner && !isManager) {
                throw new common_1.ForbiddenException('Only the direct manager or Owner can approve at level 1');
            }
            if (isOwner) {
                return this.finalize(companyId, actor, row, true);
            }
            const updated = await this.db.employeeRequest.update({
                where: { id: row.id },
                data: {
                    status: client_1.RequestStatus.IN_REVIEW,
                    approvalLevel: 2,
                    steps: {
                        create: {
                            level: 1,
                            action: client_1.RequestApprovalAction.APPROVED,
                            actorId: actor.userId,
                        },
                    },
                },
                include: {
                    employee: {
                        select: {
                            id: true,
                            name: true,
                            managerId: true,
                            user: { select: { id: true, email: true } },
                        },
                    },
                    steps: { orderBy: { createdAt: 'asc' } },
                },
            });
            await this.notifyHrOnLevel1(companyId, updated.id, updated.type);
            return mapRequest(updated);
        }
        if (!isOwner && !this.hasPerm(actor, permissions_constant_1.PERMISSIONS.APPROVE_REQUESTS)) {
            throw new common_1.ForbiddenException('HR / Owner permission required for final approval');
        }
        return this.finalize(companyId, actor, row, true);
    }
    async reject(companyId, actor, id, dto) {
        const row = await this.loadPending(companyId, id);
        if (row.status !== client_1.RequestStatus.PENDING &&
            row.status !== client_1.RequestStatus.IN_REVIEW) {
            throw new common_1.BadRequestException('Request is not awaiting approval');
        }
        if (actor.employeeId && actor.employeeId === row.employeeId) {
            throw new common_1.ForbiddenException('Cannot reject your own request');
        }
        const isOwner = actor.roleName === roles_constant_1.COMPANY_OWNER_ROLE;
        const level = row.approvalLevel;
        if (level === 1) {
            const isManager = await this.isDirectManager(actor, row.employeeId);
            if (!isOwner && !isManager) {
                throw new common_1.ForbiddenException('Only the direct manager or Owner can reject at level 1');
            }
        }
        else if (!isOwner &&
            !this.hasPerm(actor, permissions_constant_1.PERMISSIONS.APPROVE_REQUESTS)) {
            throw new common_1.ForbiddenException('HR / Owner permission required to reject at level 2');
        }
        return this.finalize(companyId, actor, row, false, dto.reviewNote);
    }
    async cancel(companyId, actor, id) {
        const row = await this.db.employeeRequest.findFirst({
            where: { id, companyId },
            include: {
                employee: { select: { id: true, name: true, managerId: true } },
            },
        });
        if (!row)
            throw new common_1.NotFoundException('Request not found');
        if (row.status !== client_1.RequestStatus.PENDING) {
            throw new common_1.BadRequestException('Only PENDING requests can be cancelled');
        }
        const isOwner = actor.roleName === roles_constant_1.COMPANY_OWNER_ROLE;
        const isSelf = actor.employeeId === row.employeeId;
        if (!isOwner && !isSelf && !this.hasPerm(actor, permissions_constant_1.PERMISSIONS.MANAGE_REQUESTS)) {
            throw new common_1.ForbiddenException('Not allowed to cancel this request');
        }
        const updated = await this.db.employeeRequest.update({
            where: { id: row.id },
            data: { status: client_1.RequestStatus.CANCELLED },
            include: {
                employee: { select: { id: true, name: true, managerId: true } },
                steps: { orderBy: { createdAt: 'asc' } },
            },
        });
        return mapRequest(updated);
    }
    async finalize(companyId, actor, row, approved, reviewNote) {
        const status = approved ? client_1.RequestStatus.APPROVED : client_1.RequestStatus.REJECTED;
        const updated = await this.db.employeeRequest.update({
            where: { id: row.id },
            data: {
                status,
                reviewedById: actor.userId,
                reviewedAt: new Date(),
                reviewNote: reviewNote?.trim() || null,
                steps: {
                    create: {
                        level: row.approvalLevel,
                        action: approved
                            ? client_1.RequestApprovalAction.APPROVED
                            : client_1.RequestApprovalAction.REJECTED,
                        actorId: actor.userId,
                        note: reviewNote?.trim() || null,
                    },
                },
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        managerId: true,
                        user: { select: { id: true, email: true } },
                    },
                },
                steps: { orderBy: { createdAt: 'asc' } },
            },
        });
        const empUser = updated.employee?.user;
        if (empUser) {
            const label = updated.type === client_1.RequestType.OVERTIME ? 'العمل الإضافي' : 'الطلب';
            await this.notifications.create({
                companyId,
                userId: empUser.id,
                title: approved ? `تمت الموافقة على ${label}` : `تم رفض ${label}`,
                body: approved
                    ? `تمت الموافقة النهائية على طلبك.`
                    : `تم رفض طلبك${reviewNote ? `: ${reviewNote}` : '.'}`,
                type: approved ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
                link: '/my-requests',
                emailTo: empUser.email,
            });
        }
        return mapRequest(updated);
    }
    async loadPending(companyId, id) {
        const row = await this.db.employeeRequest.findFirst({
            where: { id, companyId },
            include: {
                employee: { select: { id: true, name: true, managerId: true } },
            },
        });
        if (!row)
            throw new common_1.NotFoundException('Request not found');
        return row;
    }
    async isDirectManager(actor, employeeId) {
        if (!actor.employeeId)
            return false;
        const emp = await this.db.employee.findFirst({
            where: { id: employeeId },
            select: { managerId: true },
        });
        return emp?.managerId === actor.employeeId;
    }
    hasPerm(actor, action) {
        if (actor.roleName === roles_constant_1.COMPANY_OWNER_ROLE)
            return true;
        return (actor.permissions ?? []).includes(action);
    }
    adminVisibility(actor) {
        if (actor.roleName === roles_constant_1.COMPANY_OWNER_ROLE ||
            this.hasPerm(actor, permissions_constant_1.PERMISSIONS.MANAGE_REQUESTS) ||
            this.hasPerm(actor, permissions_constant_1.PERMISSIONS.APPROVE_REQUESTS)) {
            if (!this.hasPerm(actor, permissions_constant_1.PERMISSIONS.MANAGE_REQUESTS) &&
                actor.roleName !== roles_constant_1.COMPANY_OWNER_ROLE &&
                actor.employeeId) {
                return [
                    {
                        OR: [
                            { employee: { managerId: actor.employeeId } },
                            {
                                status: client_1.RequestStatus.IN_REVIEW,
                                approvalLevel: 2,
                            },
                        ],
                    },
                ];
            }
            return [];
        }
        if (actor.employeeId) {
            return [
                {
                    OR: [
                        { employeeId: actor.employeeId },
                        { employee: { managerId: actor.employeeId } },
                    ],
                },
            ];
        }
        throw new common_1.ForbiddenException('Insufficient permissions to list requests');
    }
    assertCanView(actor, employeeId, managerId) {
        if (actor.roleName === roles_constant_1.COMPANY_OWNER_ROLE)
            return;
        if (this.hasPerm(actor, permissions_constant_1.PERMISSIONS.MANAGE_REQUESTS))
            return;
        if (this.hasPerm(actor, permissions_constant_1.PERMISSIONS.APPROVE_REQUESTS))
            return;
        if (actor.employeeId === employeeId)
            return;
        if (actor.employeeId && managerId === actor.employeeId)
            return;
        throw new common_1.ForbiddenException('Not allowed to view this request');
    }
    async notifyManagersOnSubmit(companyId, emp, requestId, type) {
        const label = type === client_1.RequestType.OVERTIME ? 'عمل إضافي' : 'طلب عام';
        const title = `طلب ${label} جديد`;
        const body = `${emp.name} قدّم طلب ${label} بانتظار موافقتك.`;
        if (emp.manager?.userId) {
            await this.notifications.create({
                companyId,
                userId: emp.manager.userId,
                title,
                body,
                type: 'REQUEST_SUBMITTED',
                link: '/requests',
            });
            return;
        }
        const owners = await this.db.user.findMany({
            where: {
                companyId,
                role: { name: roles_constant_1.COMPANY_OWNER_ROLE },
            },
            select: { id: true },
        });
        await this.notifications.createMany(owners.map((o) => ({
            companyId,
            userId: o.id,
            title,
            body,
            type: 'REQUEST_SUBMITTED',
            link: '/requests',
        })));
    }
    async notifyHrOnLevel1(companyId, requestId, type) {
        const label = type === client_1.RequestType.OVERTIME ? 'عمل إضافي' : 'طلب عام';
        const users = await this.db.user.findMany({
            where: {
                companyId,
                OR: [
                    { role: { name: roles_constant_1.COMPANY_OWNER_ROLE } },
                    {
                        role: {
                            permissions: { some: { action: permissions_constant_1.PERMISSIONS.APPROVE_REQUESTS } },
                        },
                    },
                ],
            },
            select: { id: true },
        });
        const seen = new Set();
        const inputs = [];
        for (const u of users) {
            if (seen.has(u.id))
                continue;
            seen.add(u.id);
            inputs.push({
                companyId,
                userId: u.id,
                title: `طلب ${label} بانتظار الموافقة النهائية`,
                body: 'تمت موافقة المدير المباشر — مطلوب اعتماد المستوى الثاني.',
                type: 'REQUEST_LEVEL2',
                link: '/requests',
            });
        }
        await this.notifications.createMany(inputs);
    }
};
exports.RequestService = RequestService;
exports.RequestService = RequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        notification_service_1.NotificationService])
], RequestService);
//# sourceMappingURL=request.service.js.map