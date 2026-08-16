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
function employeeCodeFromId(id) {
    const hex = id.replace(/-/g, '').slice(-4);
    const n = (parseInt(hex, 16) % 9000) + 1000;
    return `EMP-${n}`;
}
function decimalNum(v) {
    if (v == null)
        return 0;
    return typeof v === 'number' ? v : Number(v);
}
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
                _count: { select: { payrollSlips: true, loanInstallments: true } },
            },
        });
        if (!cycle) {
            throw new common_1.NotFoundException('Payroll cycle not found');
        }
        const sums = await this.db.payrollSlip.aggregate({
            where: { payrollCycleId: id },
            _sum: {
                basicSalary: true,
                totalAllowances: true,
                overtimeBonus: true,
                totalDeductions: true,
                loanDeductions: true,
                netSalary: true,
            },
        });
        const basic = decimalNum(sums._sum.basicSalary);
        const allowances = decimalNum(sums._sum.totalAllowances);
        const bonuses = decimalNum(sums._sum.overtimeBonus);
        const deductions = decimalNum(sums._sum.totalDeductions) + decimalNum(sums._sum.loanDeductions);
        return {
            ...cycle,
            totals: {
                totalSalaries: basic + allowances,
                totalAllowances: allowances,
                totalBonuses: bonuses,
                totalDeductions: deductions,
                netSalaries: decimalNum(sums._sum.netSalary),
            },
        };
    }
    async listSlips(companyId, cycleId, query) {
        await this.getOwnedOrThrow(companyId, cycleId);
        const search = query.search?.trim();
        const employeeFilter = {
            ...(query.departmentId ? { departmentId: query.departmentId } : {}),
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { position: { contains: search, mode: 'insensitive' } },
                        { department: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const where = {
            payrollCycleId: cycleId,
            ...(query.departmentId || search ? { employee: employeeFilter } : {}),
        };
        const [rows, itemCount] = await Promise.all([
            this.db.payrollSlip.findMany({
                where,
                orderBy: { employee: { name: 'asc' } },
                skip: query.skip,
                take: query.limit,
                include: {
                    employee: {
                        select: {
                            id: true,
                            name: true,
                            photoUrl: true,
                            department: true,
                            departmentId: true,
                            user: { select: { email: true } },
                        },
                    },
                },
            }),
            this.db.payrollSlip.count({ where }),
        ]);
        const data = rows.map((s) => ({
            id: s.id,
            employeeId: s.employeeId,
            basicSalary: s.basicSalary,
            totalAllowances: s.totalAllowances,
            overtimeBonus: s.overtimeBonus,
            totalDeductions: s.totalDeductions,
            loanDeductions: s.loanDeductions,
            netSalary: s.netSalary,
            employee: {
                id: s.employee.id,
                name: s.employee.name,
                photoUrl: s.employee.photoUrl,
                department: s.employee.department,
                departmentId: s.employee.departmentId,
                email: s.employee.user?.email ?? null,
                employeeCode: employeeCodeFromId(s.employee.id),
            },
        }));
        return new page_dto_1.PageDto(data, new page_meta_dto_1.PageMetaDto({ pageOptionsDto: query, itemCount }));
    }
    async findSlip(companyId, slipId) {
        const slip = await this.db.payrollSlip.findFirst({
            where: { id: slipId, payrollCycle: { companyId } },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        photoUrl: true,
                        isGosiRegistered: true,
                        user: { select: { email: true } },
                    },
                },
                payrollCycle: {
                    select: { id: true, month: true, year: true, status: true },
                },
            },
        });
        if (!slip) {
            throw new common_1.NotFoundException('Payroll slip not found');
        }
        const policy = await this.db.companyPolicy.findUnique({
            where: { companyId },
        });
        const { from, to } = (0, payroll_calculator_1.monthDateRange)(slip.payrollCycle.year, slip.payrollCycle.month);
        const emp = await this.db.employee.findFirst({
            where: { id: slip.employeeId, companyId },
            include: {
                salaryComponents: true,
                attendanceRecords: { where: { date: { gte: from, lte: to } } },
                loans: {
                    where: { status: client_1.LoanStatus.APPROVED },
                    include: {
                        installments: {
                            where: {
                                OR: [
                                    { payrollCycleId: slip.payrollCycleId },
                                    {
                                        status: client_1.LoanInstallmentStatus.PENDING,
                                        dueDate: { gte: from, lte: to },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        });
        const otGrants = await this.loadApprovedOvertime(companyId, [slip.employeeId], from, to);
        const calc = emp && policy
            ? (0, payroll_calculator_1.calculateEmployeeSlip)({
                basicSalary: emp.basicSalary,
                salaryBasis: emp.salaryBasis,
                isGosiRegistered: emp.isGosiRegistered,
                components: emp.salaryComponents,
                attendance: emp.attendanceRecords,
                policy,
                loanInstallmentAmounts: emp.loans.flatMap((l) => l.installments.map((i) => i.amount)),
                approvedOvertime: otGrants,
            })
            : null;
        const att = emp?.attendanceRecords ?? [];
        const paidOt = (0, payroll_calculator_1.resolvePaidOvertime)(att, otGrants);
        const overtimeHours = paidOt.reduce((sum, d) => sum + Number(d.hours), 0);
        const hourRate = emp ? hourRateFor(emp.salaryBasis, Number(emp.basicSalary)) : 0;
        const weekends = new Set((policy?.defaultWeekendDays ?? []).map((d) => d.toUpperCase()));
        const weekdayNames = [
            'SUNDAY',
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY',
        ];
        const leaves = await this.db.leaveRequest.findMany({
            where: {
                employeeId: slip.employeeId,
                status: client_1.LeaveStatus.APPROVED,
                fromDate: { lte: to },
                toDate: { gte: from },
            },
            orderBy: { fromDate: 'asc' },
            select: {
                id: true,
                fromDate: true,
                toDate: true,
                reason: true,
            },
        });
        return {
            id: slip.id,
            employeeId: slip.employeeId,
            basicSalary: slip.basicSalary,
            totalAllowances: slip.totalAllowances,
            overtimeBonus: slip.overtimeBonus,
            totalDeductions: slip.totalDeductions,
            loanDeductions: slip.loanDeductions,
            netSalary: slip.netSalary,
            employee: {
                id: slip.employee.id,
                name: slip.employee.name,
                photoUrl: slip.employee.photoUrl,
                email: slip.employee.user?.email ?? null,
                employeeCode: employeeCodeFromId(slip.employee.id),
                isGosiRegistered: slip.employee.isGosiRegistered,
            },
            payrollCycle: slip.payrollCycle,
            attendance: {
                present: att.filter((r) => r.status === client_1.AttendanceStatus.PRESENT)
                    .length,
                absent: att.filter((r) => r.status === client_1.AttendanceStatus.ABSENT).length,
                leave: att.filter((r) => r.status === client_1.AttendanceStatus.LEAVE).length,
                delayMinutes: att.reduce((sum, r) => sum + r.delayMinutes, 0),
                overtimeHours,
            },
            attendanceDays: att
                .slice()
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((r) => ({
                date: (0, payroll_calculator_1.formatYmd)(r.date),
                status: r.status,
                delayMinutes: r.delayMinutes,
                overtimeHours: Number(r.overtimeHours),
            })),
            overtimeDays: paidOt
                .filter((d) => d.hours.greaterThan(0))
                .map((d) => {
                const isWeekend = weekends.has(weekdayNames[d.date.getUTCDay()]);
                const mult = Number(isWeekend
                    ? (policy?.overtimeMultiplierHoliday ?? 2)
                    : (policy?.overtimeMultiplierNormal ?? 1.5));
                const amount = Number(d.hours) * hourRate * mult;
                const source = d.requestHours.greaterThan(0) &&
                    d.requestHours.greaterThanOrEqualTo(d.clockHours)
                    ? 'REQUEST'
                    : 'CLOCK';
                return {
                    date: (0, payroll_calculator_1.formatYmd)(d.date),
                    hours: Number(d.hours),
                    clockHours: Number(d.clockHours),
                    requestHours: Number(d.requestHours),
                    source,
                    amount: Number(amount.toFixed(2)),
                };
            }),
            leaves: leaves.map((l) => ({
                id: l.id,
                fromDate: (0, payroll_calculator_1.formatYmd)(l.fromDate),
                toDate: (0, payroll_calculator_1.formatYmd)(l.toDate),
                reason: l.reason,
            })),
            loans: (emp?.loans ?? []).flatMap((loan) => loan.installments.map((i) => ({
                amount: i.amount,
                dueDate: (0, payroll_calculator_1.formatYmd)(i.dueDate),
                status: i.status,
            }))),
            components: (emp?.salaryComponents ?? []).map((c) => ({
                name: c.name,
                type: c.type,
                amount: c.amount,
                isPercentage: c.isPercentage,
            })),
            breakdown: calc
                ? {
                    componentDeductions: calc.breakdown.componentDeductions,
                    absenceDeduction: calc.breakdown.absenceDeduction,
                    delayDeduction: calc.breakdown.delayDeduction,
                    gosiEmployee: calc.breakdown.gosiEmployee,
                }
                : null,
        };
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
    async revertToDraft(companyId, id) {
        const cycle = await this.getOwnedOrThrow(companyId, id);
        this.assertStatus(cycle.status, [client_1.PayrollCycleStatus.REVIEW], 'revert to draft');
        await this.db.loanInstallment.updateMany({
            where: { payrollCycleId: id, status: client_1.LoanInstallmentStatus.PENDING },
            data: { payrollCycleId: null },
        });
        return this.db.payrollCycle.update({
            where: { id },
            data: { status: client_1.PayrollCycleStatus.DRAFT },
            include: { _count: { select: { payrollSlips: true } } },
        });
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
                include: { _count: { select: { payrollSlips: true } } },
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
        const otByEmp = await this.loadApprovedOvertimeGrouped(companyId, employees.map((e) => e.id), from, to);
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
                    approvedOvertime: otByEmp.get(emp.id) ?? [],
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
    async loadApprovedOvertime(companyId, employeeIds, from, to) {
        if (employeeIds.length === 0)
            return [];
        const rows = await this.db.employeeRequest.findMany({
            where: {
                companyId,
                employeeId: { in: employeeIds },
                type: client_1.RequestType.OVERTIME,
                status: client_1.RequestStatus.APPROVED,
                date: { gte: from, lte: to },
            },
            select: { date: true, hours: true },
        });
        return rows
            .filter((r) => r.date != null && r.hours != null)
            .map((r) => ({ date: r.date, hours: r.hours }));
    }
    async loadApprovedOvertimeGrouped(companyId, employeeIds, from, to) {
        const map = new Map();
        if (employeeIds.length === 0)
            return map;
        const rows = await this.db.employeeRequest.findMany({
            where: {
                companyId,
                employeeId: { in: employeeIds },
                type: client_1.RequestType.OVERTIME,
                status: client_1.RequestStatus.APPROVED,
                date: { gte: from, lte: to },
            },
            select: { employeeId: true, date: true, hours: true },
        });
        for (const r of rows) {
            if (!r.date || r.hours == null)
                continue;
            const list = map.get(r.employeeId) ?? [];
            list.push({ date: r.date, hours: r.hours });
            map.set(r.employeeId, list);
        }
        return map;
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PayrollService);
function hourRateFor(basis, basic) {
    if (basis === client_1.SalaryBasis.HOURLY)
        return basic;
    if (basis === client_1.SalaryBasis.DAILY)
        return basic / 8;
    return basic / 30 / 8;
}
function csvEscape(value) {
    if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
//# sourceMappingURL=payroll.service.js.map