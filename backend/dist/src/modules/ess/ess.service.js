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
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
const page_dto_1 = require("../../common/pagination/page.dto");
const page_meta_dto_1 = require("../../common/pagination/page-meta.dto");
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