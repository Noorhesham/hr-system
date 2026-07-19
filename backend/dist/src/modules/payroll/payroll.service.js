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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
const page_dto_1 = require("../../common/pagination/page.dto");
const page_meta_dto_1 = require("../../common/pagination/page-meta.dto");
const payroll_calculator_1 = require("./payroll-calculator");
const SORTABLE = ['createdAt', 'updatedAt', 'year', 'month'];
let PayrollService = class PayrollService {
    db;
    constructor(db) {
        this.db = db;
    }
    async createCycle(companyId, dto) {
        const existing = await this.db.payrollCycle.findUnique({
            where: {
                companyId_month_year: {
                    companyId,
                    month: dto.month,
                    year: dto.year,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`A payroll cycle for ${dto.year}-${String(dto.month).padStart(2, '0')} already exists`);
        }
        const cycle = await this.db.payrollCycle.create({
            data: {
                companyId,
                month: dto.month,
                year: dto.year,
                status: client_1.PayrollCycleStatus.DRAFT,
            },
        });
        await this.runCalculation(companyId, cycle.id);
        return this.findOne(companyId, cycle.id);
    }
    async findAll(companyId, query) {
        const where = {
            companyId,
            ...(query.status ? { status: query.status } : {}),
            ...(query.month ? { month: query.month } : {}),
            ...(query.year ? { year: query.year } : {}),
        };
        const orderBy = SORTABLE.includes(query.orderBy) ? query.orderBy : 'createdAt';
        const [data, itemCount] = await Promise.all([
            this.db.payrollCycle.findMany({
                where,
                orderBy: { [orderBy]: query.prismaOrder },
                skip: query.skip,
                take: query.limit,
                include: {
                    _count: { select: { payrollSlips: true } },
                },
            }),
            this.db.payrollCycle.count({ where }),
        ]);
        return new page_dto_1.PageDto(data, new page_meta_dto_1.PageMetaDto({ pageOptionsDto: query, itemCount }));
    }
    async findOne(companyId, id) {
        const cycle = await this.db.payrollCycle.findFirst({
            where: { id, companyId },
            include: {
                payrollSlips: {
                    include: { employee: { select: { id: true, name: true } } },
                    orderBy: { employee: { name: 'asc' } },
                },
                _count: { select: { payrollSlips: true, loanInstallments: true } },
            },
        });
        if (!cycle) {
            throw new common_1.NotFoundException('Payroll cycle not found');
        }
        return cycle;
    }
    async findSlip(companyId, slipId) {
        const slip = await this.db.payrollSlip.findFirst({
            where: { id: slipId, payrollCycle: { companyId } },
            include: {
                employee: { select: { id: true, name: true, isGosiRegistered: true } },
                payrollCycle: {
                    select: { id: true, month: true, year: true, status: true },
                },
            },
        });
        if (!slip) {
            throw new common_1.NotFoundException('Payroll slip not found');
        }
        return slip;
    }
    async recalculate(companyId, id) {
        const cycle = await this.getOwnedOrThrow(companyId, id);
        this.assertStatus(cycle.status, [client_1.PayrollCycleStatus.DRAFT], 'recalculate');
        await this.db.loanInstallment.updateMany({
            where: { payrollCycleId: id },
            data: { payrollCycleId: null, status: client_1.LoanInstallmentStatus.PENDING },
        });
        await this.db.payrollSlip.deleteMany({ where: { payrollCycleId: id } });
        await this.runCalculation(companyId, id);
        return this.findOne(companyId, id);
    }
    async moveToReview(companyId, id) {
        const cycle = await this.getOwnedOrThrow(companyId, id);
        this.assertStatus(cycle.status, [client_1.PayrollCycleStatus.DRAFT], 'submit for review');
        const count = await this.db.payrollSlip.count({ where: { payrollCycleId: id } });
        if (count === 0) {
            throw new common_1.UnprocessableEntityException('Cycle has no slips — run calculation first');
        }
        return this.db.payrollCycle.update({
            where: { id },
            data: { status: client_1.PayrollCycleStatus.REVIEW },
            include: { _count: { select: { payrollSlips: true } } },
        });
    }
    async approve(companyId, id) {
        const cycle = await this.getOwnedOrThrow(companyId, id);
        this.assertStatus(cycle.status, [client_1.PayrollCycleStatus.REVIEW], 'approve');
        return this.db.$transaction(async (tx) => {
            const linked = await tx.loanInstallment.findMany({
                where: { payrollCycleId: id },
                select: { id: true, loanId: true },
            });
            if (linked.length) {
                await tx.loanInstallment.updateMany({
                    where: { payrollCycleId: id },
                    data: { status: client_1.LoanInstallmentStatus.DEDUCTED },
                });
                const loanIds = [...new Set(linked.map((l) => l.loanId))];
                for (const loanId of loanIds) {
                    const pending = await tx.loanInstallment.count({
                        where: {
                            loanId,
                            status: client_1.LoanInstallmentStatus.PENDING,
                        },
                    });
                    if (pending === 0) {
                        await tx.loan.update({
                            where: { id: loanId },
                            data: { status: client_1.LoanStatus.PAID_OFF },
                        });
                    }
                }
            }
            return tx.payrollCycle.update({
                where: { id },
                data: { status: client_1.PayrollCycleStatus.APPROVED },
                include: {
                    payrollSlips: {
                        include: { employee: { select: { id: true, name: true } } },
                    },
                },
            });
        });
    }
    async close(companyId, id) {
        const cycle = await this.getOwnedOrThrow(companyId, id);
        this.assertStatus(cycle.status, [client_1.PayrollCycleStatus.APPROVED], 'close');
        return this.db.payrollCycle.update({
            where: { id },
            data: { status: client_1.PayrollCycleStatus.CLOSED },
            include: { _count: { select: { payrollSlips: true } } },
        });
    }
    async exportWps(companyId, id) {
        const cycle = await this.db.payrollCycle.findFirst({
            where: { id, companyId },
            include: {
                company: { select: { establishmentNumber: true, name: true } },
                payrollSlips: {
                    include: { employee: { select: { name: true } } },
                    orderBy: { employee: { name: 'asc' } },
                },
            },
        });
        if (!cycle) {
            throw new common_1.NotFoundException('Payroll cycle not found');
        }
        if (cycle.status !== client_1.PayrollCycleStatus.APPROVED &&
            cycle.status !== client_1.PayrollCycleStatus.CLOSED) {
            throw new common_1.ConflictException('WPS export is only available after the cycle is APPROVED');
        }
        const est = cycle.company.establishmentNumber ?? 'UNKNOWN';
        const header = 'EmployeeName,NetSalary,Currency,EstablishmentNumber,Month,Year,CompanyName';
        const rows = cycle.payrollSlips.map((s) => {
            const name = csvEscape(s.employee.name);
            const company = csvEscape(cycle.company.name);
            return `${name},${s.netSalary.toFixed(2)},SAR,${est},${cycle.month},${cycle.year},${company}`;
        });
        const body = [header, ...rows].join('\n') + '\n';
        const filename = `WPS_${est}_${cycle.year}${String(cycle.month).padStart(2, '0')}.csv`;
        return { filename, contentType: 'text/csv; charset=utf-8', body };
    }
    async runCalculation(companyId, cycleId) {
        const cycle = await this.db.payrollCycle.findFirst({
            where: { id: cycleId, companyId },
        });
        if (!cycle) {
            throw new common_1.NotFoundException('Payroll cycle not found');
        }
        const policy = await this.db.companyPolicy.findUnique({
            where: { companyId },
        });
        if (!policy) {
            throw new common_1.UnprocessableEntityException('Company policy is missing');
        }
        const { from, to } = (0, payroll_calculator_1.monthDateRange)(cycle.year, cycle.month);
        const employees = await this.db.employee.findMany({
            where: { companyId, isActive: true },
            include: {
                salaryComponents: true,
                attendanceRecords: {
                    where: { date: { gte: from, lte: to } },
                },
                loans: {
                    where: { status: client_1.LoanStatus.APPROVED },
                    include: {
                        installments: {
                            where: {
                                status: client_1.LoanInstallmentStatus.PENDING,
                                dueDate: { gte: from, lte: to },
                            },
                        },
                    },
                },
            },
        });
        if (employees.length === 0) {
            throw new common_1.UnprocessableEntityException('No active employees to include in this payroll cycle');
        }
        await this.db.$transaction(async (tx) => {
            for (const emp of employees) {
                const loanAmounts = emp.loans.flatMap((l) => l.installments.map((i) => i.amount));
                const installmentIds = emp.loans.flatMap((l) => l.installments.map((i) => i.id));
                const slip = (0, payroll_calculator_1.calculateEmployeeSlip)({
                    basicSalary: emp.basicSalary,
                    salaryBasis: emp.salaryBasis,
                    isGosiRegistered: emp.isGosiRegistered,
                    components: emp.salaryComponents,
                    attendance: emp.attendanceRecords,
                    policy,
                    loanInstallmentAmounts: loanAmounts,
                });
                await tx.payrollSlip.create({
                    data: {
                        payrollCycleId: cycleId,
                        employeeId: emp.id,
                        basicSalary: slip.basicSalary,
                        totalAllowances: slip.totalAllowances,
                        totalDeductions: slip.totalDeductions,
                        loanDeductions: slip.loanDeductions,
                        overtimeBonus: slip.overtimeBonus,
                        netSalary: slip.netSalary,
                    },
                });
                if (installmentIds.length) {
                    await tx.loanInstallment.updateMany({
                        where: { id: { in: installmentIds } },
                        data: { payrollCycleId: cycleId },
                    });
                }
            }
        });
    }
    assertStatus(current, allowed, action) {
        if (!allowed.includes(current)) {
            throw new common_1.ConflictException(`Cannot ${action} a cycle in status ${current} (allowed: ${allowed.join(', ')})`);
        }
    }
    async getOwnedOrThrow(companyId, id) {
        const cycle = await this.db.payrollCycle.findFirst({
            where: { id, companyId },
        });
        if (!cycle) {
            throw new common_1.NotFoundException('Payroll cycle not found');
        }
        return cycle;
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PayrollService);
function csvEscape(value) {
    if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
//# sourceMappingURL=payroll.service.js.map