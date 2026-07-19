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
let ReportsService = class ReportsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async dashboard(companyId) {
        const [activeEmployees, inactiveEmployees, openLoans, draftCycles, pendingInstallments,] = await Promise.all([
            this.db.employee.count({ where: { companyId, isActive: true } }),
            this.db.employee.count({ where: { companyId, isActive: false } }),
            this.db.loan.count({
                where: { employee: { companyId }, status: 'APPROVED' },
            }),
            this.db.payrollCycle.count({
                where: {
                    companyId,
                    status: {
                        in: [client_1.PayrollCycleStatus.DRAFT, client_1.PayrollCycleStatus.REVIEW],
                    },
                },
            }),
            this.db.loanInstallment.count({
                where: {
                    status: client_1.LoanInstallmentStatus.PENDING,
                    loan: { employee: { companyId }, status: 'APPROVED' },
                },
            }),
        ]);
        return {
            activeEmployees,
            inactiveEmployees,
            openLoans,
            openPayrollCycles: draftCycles,
            pendingLoanInstallments: pendingInstallments,
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