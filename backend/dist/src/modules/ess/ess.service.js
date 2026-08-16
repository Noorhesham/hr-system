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
exports.EssService = void 0;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
const page_dto_1 = require("../../common/pagination/page.dto");
const page_meta_dto_1 = require("../../common/pagination/page-meta.dto");
const time_constant_1 = require("../../common/constants/time.constant");
const attendance_time_util_1 = require("../../common/utils/attendance-time.util");
let EssService = class EssService {
    db;
    constructor(db) {
        this.db = db;
    }
    async me(actor) {
        const employeeId = this.requireEmployeeId(actor);
        const employee = await this.db.employee.findFirst({
            where: { id: employeeId, companyId: actor.companyId },
            include: {
                shift: {
                    select: {
                        id: true,
                        name: true,
                        startTime: true,
                        endTime: true,
                        gracePeriodMinutes: true,
                    },
                },
                company: { select: { id: true, name: true } },
            },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not found');
        }
        return {
            user: {
                userId: actor.userId,
                email: actor.email,
                roleName: actor.roleName,
                isPortalUser: actor.isPortalUser,
            },
            employee,
        };
    }
    async home(actor) {
        const employeeId = this.requireEmployeeId(actor);
        const tz = (0, time_constant_1.getDefaultTz)();
        const now = luxon_1.DateTime.now().setZone(tz);
        const todayYmd = now.toFormat('yyyy-MM-dd');
        const todayDate = (0, attendance_time_util_1.parseDateOnly)(todayYmd);
        const monthStart = (0, attendance_time_util_1.parseDateOnly)(now.startOf('month').toFormat('yyyy-MM-dd'));
        const monthEnd = (0, attendance_time_util_1.parseDateOnly)(now.endOf('month').toFormat('yyyy-MM-dd'));
        const [employee, today, monthRows, latestPayslip, pendingLeaves, pendingRequests, recentLeaves, recentRequests,] = await Promise.all([
            this.db.employee.findFirst({
                where: { id: employeeId, companyId: actor.companyId },
                select: {
                    id: true,
                    name: true,
                    department: true,
                    position: true,
                    photoUrl: true,
                    shift: {
                        select: { id: true, name: true, startTime: true, endTime: true },
                    },
                },
            }),
            this.db.attendanceRecord.findFirst({
                where: { employeeId, date: todayDate },
                select: {
                    status: true,
                    checkIn: true,
                    checkOut: true,
                    delayMinutes: true,
                },
            }),
            this.db.attendanceRecord.findMany({
                where: {
                    employeeId,
                    date: { gte: monthStart, lte: monthEnd },
                },
                select: { status: true, delayMinutes: true },
            }),
            this.db.payrollSlip.findFirst({
                where: {
                    employeeId,
                    payrollCycle: {
                        status: {
                            in: [client_1.PayrollCycleStatus.APPROVED, client_1.PayrollCycleStatus.CLOSED],
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    netSalary: true,
                    basicSalary: true,
                    payrollCycle: {
                        select: { month: true, year: true, status: true },
                    },
                },
            }),
            this.db.leaveRequest.count({
                where: { employeeId, status: client_1.LeaveStatus.PENDING },
            }),
            this.db.employeeRequest.count({
                where: {
                    employeeId,
                    status: { in: [client_1.RequestStatus.PENDING, client_1.RequestStatus.IN_REVIEW] },
                },
            }),
            this.db.leaveRequest.findMany({
                where: { employeeId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    fromDate: true,
                    toDate: true,
                    status: true,
                    reason: true,
                },
            }),
            this.db.employeeRequest.findMany({
                where: { employeeId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    type: true,
                    title: true,
                    status: true,
                    date: true,
                },
            }),
        ]);
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not found');
        }
        const month = {
            present: 0,
            late: 0,
            absent: 0,
            leave: 0,
        };
        for (const row of monthRows) {
            if (row.status === 'LEAVE')
                month.leave += 1;
            else if (row.status === 'ABSENT')
                month.absent += 1;
            else if (row.status === 'PRESENT' && row.delayMinutes > 0)
                month.late += 1;
            else if (row.status === 'PRESENT')
                month.present += 1;
        }
        return {
            employee,
            today: {
                date: todayYmd,
                status: today?.status ?? null,
                checkIn: today?.checkIn?.toISOString() ?? null,
                checkOut: today?.checkOut?.toISOString() ?? null,
                delayMinutes: today?.delayMinutes ?? 0,
            },
            month,
            latestPayslip: latestPayslip
                ? {
                    id: latestPayslip.id,
                    netSalary: latestPayslip.netSalary,
                    basicSalary: latestPayslip.basicSalary,
                    month: latestPayslip.payrollCycle.month,
                    year: latestPayslip.payrollCycle.year,
                }
                : null,
            pendingLeaves,
            pendingRequests,
            recentLeaves: recentLeaves.map((l) => ({
                id: l.id,
                fromDate: (0, attendance_time_util_1.formatYmd)(l.fromDate),
                toDate: (0, attendance_time_util_1.formatYmd)(l.toDate),
                status: l.status,
                reason: l.reason,
            })),
            recentRequests: recentRequests.map((r) => ({
                id: r.id,
                type: r.type,
                title: r.title,
                status: r.status,
                date: r.date ? (0, attendance_time_util_1.formatYmd)(r.date) : null,
            })),
        };
    }
    async mySalaryComponents(actor) {
        const employeeId = this.requireEmployeeId(actor);
        return this.db.salaryComponent.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async myDocuments(actor) {
        const employeeId = this.requireEmployeeId(actor);
        return this.db.document.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async myAttendance(actor, query) {
        const employeeId = this.requireEmployeeId(actor);
        const where = { employeeId };
        const [data, itemCount] = await Promise.all([
            this.db.attendanceRecord.findMany({
                where,
                orderBy: { date: 'desc' },
                skip: query.skip,
                take: query.limit,
            }),
            this.db.attendanceRecord.count({ where }),
        ]);
        return new page_dto_1.PageDto(data, new page_meta_dto_1.PageMetaDto({ pageOptionsDto: query, itemCount }));
    }
    async myLoans(actor) {
        const employeeId = this.requireEmployeeId(actor);
        return this.db.loan.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
            include: { installments: { orderBy: { dueDate: 'asc' } } },
        });
    }
    async requestLoan(actor, totalAmount) {
        const employeeId = this.requireEmployeeId(actor);
        const pending = await this.db.loan.findFirst({
            where: { employeeId, status: client_1.LoanStatus.PENDING },
            select: { id: true },
        });
        if (pending) {
            throw new common_1.ConflictException('You already have a pending loan request');
        }
        return this.db.loan.create({
            data: {
                employeeId,
                totalAmount: new client_1.Prisma.Decimal(totalAmount),
                status: client_1.LoanStatus.PENDING,
            },
            include: { installments: { orderBy: { dueDate: 'asc' } } },
        });
    }
    async myPayslips(actor, query) {
        const employeeId = this.requireEmployeeId(actor);
        const where = {
            employeeId,
            payrollCycle: {
                status: {
                    in: [client_1.PayrollCycleStatus.APPROVED, client_1.PayrollCycleStatus.CLOSED],
                },
            },
        };
        const [data, itemCount] = await Promise.all([
            this.db.payrollSlip.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: query.skip,
                take: query.limit,
                include: {
                    payrollCycle: {
                        select: { id: true, month: true, year: true, status: true },
                    },
                },
            }),
            this.db.payrollSlip.count({ where }),
        ]);
        return new page_dto_1.PageDto(data, new page_meta_dto_1.PageMetaDto({ pageOptionsDto: query, itemCount }));
    }
    async myPayslip(actor, slipId) {
        const employeeId = this.requireEmployeeId(actor);
        const slip = await this.db.payrollSlip.findFirst({
            where: {
                id: slipId,
                employeeId,
                payrollCycle: {
                    status: {
                        in: [client_1.PayrollCycleStatus.APPROVED, client_1.PayrollCycleStatus.CLOSED],
                    },
                },
            },
            include: {
                payrollCycle: {
                    select: { id: true, month: true, year: true, status: true },
                },
                employee: { select: { id: true, name: true } },
            },
        });
        if (!slip) {
            throw new common_1.NotFoundException('Payslip not found');
        }
        return slip;
    }
    requireEmployeeId(actor) {
        if (!actor.isPortalUser || !actor.employeeId) {
            throw new common_1.ForbiddenException('ESS endpoints are for employee portal accounts only');
        }
        return actor.employeeId;
    }
};
exports.EssService = EssService;
exports.EssService = EssService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], EssService);
//# sourceMappingURL=ess.service.js.map