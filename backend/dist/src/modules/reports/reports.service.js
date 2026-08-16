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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
const payroll_calculator_1 = require("../payroll/payroll-calculator");
const MONTH_LABELS_AR = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
];
function ymKey(year, month) {
    return year * 12 + month;
}
function defaultDashboardRange(now = new Date()) {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + 1;
    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;
    const { from } = (0, payroll_calculator_1.monthDateRange)(prevYear, prevMonth);
    const { to } = (0, payroll_calculator_1.monthDateRange)(y, m);
    return { from, to };
}
let ReportsService = class ReportsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async dashboard(companyId, query = {}) {
        const now = new Date();
        const defaults = defaultDashboardRange(now);
        const rangeFrom = query.from ? new Date(query.from) : defaults.from;
        const rangeTo = query.to ? new Date(query.to) : defaults.to;
        const fromYear = rangeFrom.getUTCFullYear();
        const fromMonth = rangeFrom.getUTCMonth() + 1;
        const toYear = rangeTo.getUTCFullYear();
        const toMonth = rangeTo.getUTCMonth() + 1;
        const { from: currentMonthFrom, to: currentMonthTo } = (0, payroll_calculator_1.monthDateRange)(toYear, toMonth);
        const { from: prevMonthFrom, to: prevMonthTo } = (0, payroll_calculator_1.monthDateRange)(fromYear, fromMonth);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const [totalEmployees, employeesCreatedInRange, openLoans, pendingInstallments, employeesByDepartmentRaw, rangeAttendanceRecords, prevMonthAttendanceRecords, currentMonthAttendanceRecords, todayAttendanceRecords, pendingLeaveRequests, pendingLeaveRequestsLastWeek, recentLeaveRequestsRaw, periodCycles,] = await Promise.all([
            this.db.employee.count({ where: { companyId, isActive: true } }),
            this.db.employee.count({
                where: {
                    companyId,
                    isActive: true,
                    createdAt: { gte: rangeFrom, lte: rangeTo },
                },
            }),
            this.db.loan.count({
                where: { employee: { companyId }, status: 'APPROVED' },
            }),
            this.db.loanInstallment.count({
                where: {
                    status: client_1.LoanInstallmentStatus.PENDING,
                    loan: { employee: { companyId }, status: 'APPROVED' },
                },
            }),
            this.db.employee.groupBy({
                by: ['department'],
                where: { companyId, isActive: true },
                _count: { _all: true },
            }),
            this.db.attendanceRecord.findMany({
                where: {
                    employee: { companyId },
                    date: { gte: rangeFrom, lte: rangeTo },
                },
                select: { status: true },
            }),
            this.db.attendanceRecord.findMany({
                where: {
                    employee: { companyId },
                    date: { gte: prevMonthFrom, lte: prevMonthTo },
                },
                select: { status: true },
            }),
            this.db.attendanceRecord.findMany({
                where: {
                    employee: { companyId },
                    date: { gte: currentMonthFrom, lte: currentMonthTo },
                },
                select: { status: true },
            }),
            this.db.attendanceRecord.findMany({
                where: {
                    employee: { companyId },
                    date: { gte: todayStart, lte: now },
                },
                select: { status: true, delayMinutes: true },
            }),
            this.db.leaveRequest.count({
                where: { employee: { companyId }, status: client_1.LeaveStatus.PENDING },
            }),
            this.db.leaveRequest.count({
                where: {
                    employee: { companyId },
                    status: client_1.LeaveStatus.PENDING,
                    createdAt: { lte: weekAgo },
                },
            }),
            this.db.leaveRequest.findMany({
                where: {
                    employee: { companyId },
                    fromDate: { lte: rangeTo },
                    toDate: { gte: rangeFrom },
                },
                orderBy: { createdAt: 'desc' },
                take: 4,
                include: {
                    employee: { select: { name: true, position: true } },
                },
            }),
            this.db.payrollCycle.findMany({
                where: { companyId },
                orderBy: [{ year: 'asc' }, { month: 'asc' }],
                include: { payrollSlips: true },
            }),
        ]);
        const attendanceRate = (records) => records.length
            ? +((records.filter((r) => r.status === client_1.AttendanceStatus.PRESENT)
                .length /
                records.length) *
                100).toFixed(1)
            : 0;
        const rangeRate = attendanceRate(rangeAttendanceRecords);
        const prevMonthRate = attendanceRate(prevMonthAttendanceRecords);
        const currentMonthRate = attendanceRate(currentMonthAttendanceRecords);
        const employeesByDepartment = employeesByDepartmentRaw
            .map((g) => ({
            department: g.department ?? 'غير محدد',
            count: g._count._all,
        }))
            .sort((a, b) => b.count - a.count);
        const todayOnTime = todayAttendanceRecords.filter((r) => r.status === client_1.AttendanceStatus.PRESENT && r.delayMinutes === 0).length;
        const todayLate = todayAttendanceRecords.filter((r) => r.status === client_1.AttendanceStatus.PRESENT && r.delayMinutes > 0).length;
        const todayAbsent = todayAttendanceRecords.filter((r) => r.status === client_1.AttendanceStatus.ABSENT).length;
        const todayCheckedIn = todayOnTime + todayLate;
        const todayTotal = todayCheckedIn + todayAbsent || totalEmployees || 1;
        const fromKey = ymKey(fromYear, fromMonth);
        const toKey = ymKey(toYear, toMonth);
        const cyclesInRange = periodCycles.filter((c) => ymKey(c.year, c.month) >= fromKey && ymKey(c.year, c.month) <= toKey);
        const salarySummary = cyclesInRange.map((c) => {
            const totals = c.payrollSlips.reduce((acc, s) => ({
                gross: acc.gross.plus(s.basicSalary.plus(s.totalAllowances).plus(s.overtimeBonus)),
                net: acc.net.plus(s.netSalary),
            }), { gross: new client_1.Prisma.Decimal(0), net: new client_1.Prisma.Decimal(0) });
            return {
                month: c.month,
                year: c.year,
                label: MONTH_LABELS_AR[c.month - 1],
                gross: totals.gross.toNumber(),
                net: totals.net.toNumber(),
            };
        });
        const currentCycle = cyclesInRange.find((c) => c.year === toYear && c.month === toMonth) ??
            cyclesInRange[cyclesInRange.length - 1] ??
            null;
        const previousCycle = cyclesInRange.find((c) => c.year === fromYear && c.month === fromMonth) ??
            (cyclesInRange.length > 1
                ? cyclesInRange[cyclesInRange.length - 2]
                : null);
        const netOf = (c) => c
            ? c.payrollSlips
                .reduce((acc, s) => acc.plus(s.netSalary), new client_1.Prisma.Decimal(0))
                .toNumber()
            : 0;
        const currentCyclePayroll = netOf(currentCycle);
        const previousCyclePayroll = netOf(previousCycle);
        const payrollDeltaPct = previousCyclePayroll
            ? +(((currentCyclePayroll - previousCyclePayroll) /
                previousCyclePayroll) *
                100).toFixed(1)
            : 0;
        const recentLeaveRequests = recentLeaveRequestsRaw.map((r) => ({
            id: r.id,
            employeeName: r.employee.name,
            position: r.employee.position,
            status: r.status,
            fromDate: r.fromDate.toISOString(),
            toDate: r.toDate.toISOString(),
        }));
        return {
            period: {
                from: rangeFrom.toISOString().slice(0, 10),
                to: rangeTo.toISOString().slice(0, 10),
                fromMonth,
                fromYear,
                toMonth,
                toYear,
                fromLabel: MONTH_LABELS_AR[fromMonth - 1],
                toLabel: MONTH_LABELS_AR[toMonth - 1],
            },
            totalEmployees,
            employeesDeltaMonth: employeesCreatedInRange,
            attendanceRate: rangeRate,
            attendanceRateDeltaWeek: +(currentMonthRate - prevMonthRate).toFixed(1),
            currentCyclePayroll,
            payrollDeltaPct,
            currentCycleLabel: currentCycle
                ? `${MONTH_LABELS_AR[currentCycle.month - 1]} ${currentCycle.year}`
                : null,
            previousCycleLabel: previousCycle
                ? MONTH_LABELS_AR[previousCycle.month - 1]
                : null,
            pendingLeaveRequests,
            pendingLeaveRequestsDelta: pendingLeaveRequests - pendingLeaveRequestsLastWeek,
            openLoans,
            pendingLoanInstallments: pendingInstallments,
            employeesByDepartment,
            salarySummary,
            attendanceToday: {
                total: todayTotal,
                checkedIn: todayCheckedIn,
                onTime: todayOnTime,
                late: todayLate,
                absent: todayAbsent,
                onTimeRate: todayTotal
                    ? Math.round((todayOnTime / todayTotal) * 100)
                    : 0,
            },
            recentLeaveRequests,
        };
    }
    async payrollSummary(companyId, q) {
        const cycle = await this.db.payrollCycle.findUnique({
            where: {
                companyId_month_year: {
                    companyId,
                    month: q.month,
                    year: q.year,
                },
            },
            include: { payrollSlips: true },
        });
        if (!cycle) {
            throw new common_1.NotFoundException('No payroll cycle for that month/year');
        }
        const zero = new client_1.Prisma.Decimal(0);
        const totals = cycle.payrollSlips.reduce((acc, s) => ({
            basicSalary: acc.basicSalary.plus(s.basicSalary),
            totalAllowances: acc.totalAllowances.plus(s.totalAllowances),
            totalDeductions: acc.totalDeductions.plus(s.totalDeductions),
            loanDeductions: acc.loanDeductions.plus(s.loanDeductions),
            overtimeBonus: acc.overtimeBonus.plus(s.overtimeBonus),
            netSalary: acc.netSalary.plus(s.netSalary),
        }), {
            basicSalary: zero,
            totalAllowances: zero,
            totalDeductions: zero,
            loanDeductions: zero,
            overtimeBonus: zero,
            netSalary: zero,
        });
        return {
            cycle: {
                id: cycle.id,
                month: cycle.month,
                year: cycle.year,
                status: cycle.status,
            },
            employeeCount: cycle.payrollSlips.length,
            totals,
        };
    }
    async attendanceSummary(companyId, q) {
        const { from, to } = (0, payroll_calculator_1.monthDateRange)(q.year, q.month);
        const records = await this.db.attendanceRecord.findMany({
            where: {
                employee: { companyId },
                date: { gte: from, lte: to },
            },
            select: { status: true, delayMinutes: true, overtimeHours: true },
        });
        const summary = {
            present: 0,
            absent: 0,
            leave: 0,
            totalDelayMinutes: 0,
            totalOvertimeHours: new client_1.Prisma.Decimal(0),
        };
        for (const r of records) {
            if (r.status === client_1.AttendanceStatus.PRESENT)
                summary.present += 1;
            else if (r.status === client_1.AttendanceStatus.ABSENT)
                summary.absent += 1;
            else
                summary.leave += 1;
            summary.totalDelayMinutes += r.delayMinutes;
            summary.totalOvertimeHours = summary.totalOvertimeHours.plus(r.overtimeHours);
        }
        return {
            month: q.month,
            year: q.year,
            recordCount: records.length,
            ...summary,
            totalOvertimeHours: summary.totalOvertimeHours.toDecimalPlaces(2),
        };
    }
    async gosiSummary(companyId, q) {
        const cycle = await this.db.payrollCycle.findUnique({
            where: {
                companyId_month_year: {
                    companyId,
                    month: q.month,
                    year: q.year,
                },
            },
            include: {
                payrollSlips: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                name: true,
                                isGosiRegistered: true,
                                gosiNumber: true,
                            },
                        },
                    },
                },
            },
        });
        if (!cycle) {
            throw new common_1.NotFoundException('No payroll cycle for that month/year');
        }
        const policy = await this.db.companyPolicy.findUnique({
            where: { companyId },
        });
        const empPct = policy?.gosiEmployeePercentage ?? new client_1.Prisma.Decimal(0);
        const coPct = policy?.gosiCompanyPercentage ?? new client_1.Prisma.Decimal(0);
        const rows = cycle.payrollSlips
            .filter((s) => s.employee.isGosiRegistered)
            .map((s) => {
            const base = s.basicSalary.plus(s.totalAllowances);
            const employeeShare = base.times(empPct).div(100).toDecimalPlaces(2);
            const companyShare = base.times(coPct).div(100).toDecimalPlaces(2);
            return {
                employeeId: s.employee.id,
                name: s.employee.name,
                gosiNumber: s.employee.gosiNumber,
                gosiBase: base.toDecimalPlaces(2),
                employeeShare,
                companyShare,
            };
        });
        const totals = rows.reduce((acc, r) => ({
            employeeShare: acc.employeeShare.plus(r.employeeShare),
            companyShare: acc.companyShare.plus(r.companyShare),
        }), {
            employeeShare: new client_1.Prisma.Decimal(0),
            companyShare: new client_1.Prisma.Decimal(0),
        });
        return {
            month: q.month,
            year: q.year,
            companyGosiNumber: policy?.gosiNumber ?? null,
            rates: {
                employeePercentage: empPct,
                companyPercentage: coPct,
            },
            employees: rows,
            totals,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map