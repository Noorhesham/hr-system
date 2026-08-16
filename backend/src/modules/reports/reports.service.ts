import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AttendanceStatus,
  LeaveStatus,
  LoanInstallmentStatus,
  Prisma,
} from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { monthDateRange } from '../payroll/payroll-calculator';
import { QueryMonthDto } from './dto/query-month.dto';
import { QueryDashboardDto } from './dto/query-dashboard.dto';

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

function ymKey(year: number, month: number): number {
  return year * 12 + month;
}

/** Default window: first day of previous month → last day of current month (UTC). */
function defaultDashboardRange(now = new Date()): { from: Date; to: Date } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1; // 1-12
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;
  const { from } = monthDateRange(prevYear, prevMonth);
  const { to } = monthDateRange(y, m);
  return { from, to };
}

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Rich KPI payload for the main dashboard screen: headline stat cards,
   * department breakdown, salary trend for the selected period, today's
   * attendance breakdown, and leave requests overlapping the period.
   */
  async dashboard(companyId: string, query: QueryDashboardDto = {}) {
    const now = new Date();
    const defaults = defaultDashboardRange(now);
    const rangeFrom = query.from ? new Date(query.from) : defaults.from;
    const rangeTo = query.to ? new Date(query.to) : defaults.to;

    const fromYear = rangeFrom.getUTCFullYear();
    const fromMonth = rangeFrom.getUTCMonth() + 1;
    const toYear = rangeTo.getUTCFullYear();
    const toMonth = rangeTo.getUTCMonth() + 1;

    const { from: currentMonthFrom, to: currentMonthTo } = monthDateRange(
      toYear,
      toMonth,
    );
    const { from: prevMonthFrom, to: prevMonthTo } = monthDateRange(
      fromYear,
      fromMonth,
    );

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const [
      totalEmployees,
      employeesCreatedInRange,
      openLoans,
      pendingInstallments,
      employeesByDepartmentRaw,
      rangeAttendanceRecords,
      prevMonthAttendanceRecords,
      currentMonthAttendanceRecords,
      todayAttendanceRecords,
      pendingLeaveRequests,
      pendingLeaveRequestsLastWeek,
      recentLeaveRequestsRaw,
      periodCycles,
    ] = await Promise.all([
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
          status: LoanInstallmentStatus.PENDING,
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
        where: { employee: { companyId }, status: LeaveStatus.PENDING },
      }),
      this.db.leaveRequest.count({
        where: {
          employee: { companyId },
          status: LeaveStatus.PENDING,
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

    const attendanceRate = (records: { status: AttendanceStatus }[]) =>
      records.length
        ? +(
            (records.filter((r) => r.status === AttendanceStatus.PRESENT)
              .length /
              records.length) *
            100
          ).toFixed(1)
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

    const todayOnTime = todayAttendanceRecords.filter(
      (r) => r.status === AttendanceStatus.PRESENT && r.delayMinutes === 0,
    ).length;
    const todayLate = todayAttendanceRecords.filter(
      (r) => r.status === AttendanceStatus.PRESENT && r.delayMinutes > 0,
    ).length;
    const todayAbsent = todayAttendanceRecords.filter(
      (r) => r.status === AttendanceStatus.ABSENT,
    ).length;
    const todayCheckedIn = todayOnTime + todayLate;
    const todayTotal = todayCheckedIn + todayAbsent || totalEmployees || 1;

    const fromKey = ymKey(fromYear, fromMonth);
    const toKey = ymKey(toYear, toMonth);
    const cyclesInRange = periodCycles.filter(
      (c) => ymKey(c.year, c.month) >= fromKey && ymKey(c.year, c.month) <= toKey,
    );

    const salarySummary = cyclesInRange.map((c) => {
      const totals = c.payrollSlips.reduce(
        (acc, s) => ({
          gross: acc.gross.plus(
            s.basicSalary.plus(s.totalAllowances).plus(s.overtimeBonus),
          ),
          net: acc.net.plus(s.netSalary),
        }),
        { gross: new Prisma.Decimal(0), net: new Prisma.Decimal(0) },
      );
      return {
        month: c.month,
        year: c.year,
        label: MONTH_LABELS_AR[c.month - 1],
        gross: totals.gross.toNumber(),
        net: totals.net.toNumber(),
      };
    });

    const currentCycle =
      cyclesInRange.find((c) => c.year === toYear && c.month === toMonth) ??
      cyclesInRange[cyclesInRange.length - 1] ??
      null;
    const previousCycle =
      cyclesInRange.find((c) => c.year === fromYear && c.month === fromMonth) ??
      (cyclesInRange.length > 1
        ? cyclesInRange[cyclesInRange.length - 2]
        : null);

    const netOf = (c: (typeof cyclesInRange)[number] | null) =>
      c
        ? c.payrollSlips
            .reduce((acc, s) => acc.plus(s.netSalary), new Prisma.Decimal(0))
            .toNumber()
        : 0;
    const currentCyclePayroll = netOf(currentCycle);
    const previousCyclePayroll = netOf(previousCycle);
    const payrollDeltaPct = previousCyclePayroll
      ? +(
          ((currentCyclePayroll - previousCyclePayroll) /
            previousCyclePayroll) *
          100
        ).toFixed(1)
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
      pendingLeaveRequestsDelta:
        pendingLeaveRequests - pendingLeaveRequestsLastWeek,
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
