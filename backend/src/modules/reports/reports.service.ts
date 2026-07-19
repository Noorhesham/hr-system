import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AttendanceStatus,
  LoanInstallmentStatus,
  PayrollCycleStatus,
  Prisma,
} from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { monthDateRange } from '../payroll/payroll-calculator';
import { QueryMonthDto } from './dto/query-month.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  async dashboard(companyId: string) {
    const [
      activeEmployees,
      inactiveEmployees,
      openLoans,
      draftCycles,
      pendingInstallments,
    ] = await Promise.all([
      this.db.employee.count({ where: { companyId, isActive: true } }),
      this.db.employee.count({ where: { companyId, isActive: false } }),
      this.db.loan.count({
        where: { employee: { companyId }, status: 'APPROVED' },
      }),
      this.db.payrollCycle.count({
        where: {
          companyId,
          status: {
            in: [PayrollCycleStatus.DRAFT, PayrollCycleStatus.REVIEW],
          },
        },
      }),
      this.db.loanInstallment.count({
        where: {
          status: LoanInstallmentStatus.PENDING,
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

  async payrollSummary(companyId: string, q: QueryMonthDto) {
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
      throw new NotFoundException('No payroll cycle for that month/year');
    }

    const zero = new Prisma.Decimal(0);
    const totals = cycle.payrollSlips.reduce(
      (acc, s) => ({
        basicSalary: acc.basicSalary.plus(s.basicSalary),
        totalAllowances: acc.totalAllowances.plus(s.totalAllowances),
        totalDeductions: acc.totalDeductions.plus(s.totalDeductions),
        loanDeductions: acc.loanDeductions.plus(s.loanDeductions),
        overtimeBonus: acc.overtimeBonus.plus(s.overtimeBonus),
        netSalary: acc.netSalary.plus(s.netSalary),
      }),
      {
        basicSalary: zero,
        totalAllowances: zero,
        totalDeductions: zero,
        loanDeductions: zero,
        overtimeBonus: zero,
        netSalary: zero,
      },
    );

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

  async attendanceSummary(companyId: string, q: QueryMonthDto) {
    const { from, to } = monthDateRange(q.year, q.month);
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
      totalOvertimeHours: new Prisma.Decimal(0),
    };
    for (const r of records) {
      if (r.status === AttendanceStatus.PRESENT) summary.present += 1;
      else if (r.status === AttendanceStatus.ABSENT) summary.absent += 1;
      else summary.leave += 1;
      summary.totalDelayMinutes += r.delayMinutes;
      summary.totalOvertimeHours = summary.totalOvertimeHours.plus(
        r.overtimeHours,
      );
    }
    return {
      month: q.month,
      year: q.year,
      recordCount: records.length,
      ...summary,
      totalOvertimeHours: summary.totalOvertimeHours.toDecimalPlaces(2),
    };
  }

  async gosiSummary(companyId: string, q: QueryMonthDto) {
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
      throw new NotFoundException('No payroll cycle for that month/year');
    }

    const policy = await this.db.companyPolicy.findUnique({
      where: { companyId },
    });
    const empPct = policy?.gosiEmployeePercentage ?? new Prisma.Decimal(0);
    const coPct = policy?.gosiCompanyPercentage ?? new Prisma.Decimal(0);

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

    const totals = rows.reduce(
      (acc, r) => ({
        employeeShare: acc.employeeShare.plus(r.employeeShare),
        companyShare: acc.companyShare.plus(r.companyShare),
      }),
      {
        employeeShare: new Prisma.Decimal(0),
        companyShare: new Prisma.Decimal(0),
      },
    );

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
}
