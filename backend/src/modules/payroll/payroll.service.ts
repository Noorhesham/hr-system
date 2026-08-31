import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AttendanceStatus,
  LeaveStatus,
  LoanInstallmentStatus,
  LoanStatus,
  PayrollCycleStatus,
  Prisma,
  RequestStatus,
  RequestType,
  SalaryBasis,
} from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { QueryPayrollCyclesDto } from './dto/query-payroll-cycles.dto';
import { QueryPayrollSlipsDto } from './dto/query-payroll-slips.dto';
import {
  calculateEmployeeSlip,
  formatYmd,
  monthDateRange,
  resolvePaidOvertime,
  type OvertimeGrant,
} from './payroll-calculator';

const SORTABLE = ['createdAt', 'updatedAt', 'year', 'month'];

function employeeCodeFromId(id: string): string {
  const hex = id.replace(/-/g, '').slice(-4);
  const n = (parseInt(hex, 16) % 9000) + 1000;
  return `EMP-${n}`;
}

function decimalNum(v: Prisma.Decimal | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v);
}

@Injectable()
export class PayrollService {
  constructor(private readonly db: DatabaseService) {}

  /** Create DRAFT cycle + run first calculation for all active employees. */
  async createCycle(companyId: string, dto: CreatePayrollCycleDto) {
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
      throw new ConflictException(
        `A payroll cycle for ${dto.year}-${String(dto.month).padStart(2, '0')} already exists`,
      );
    }

    const cycle = await this.db.payrollCycle.create({
      data: {
        companyId,
        month: dto.month,
        year: dto.year,
        status: PayrollCycleStatus.DRAFT,
      },
    });

    try {
      await this.runCalculation(companyId, cycle.id);
    } catch (err) {
      // Avoid orphan empty DRAFT + 409 on retry when calc times out.
      await this.db.payrollCycle
        .delete({ where: { id: cycle.id } })
        .catch(() => undefined);
      throw err;
    }
    return this.findOne(companyId, cycle.id);
  }

  async findAll(companyId: string, query: QueryPayrollCyclesDto) {
    const where: Prisma.PayrollCycleWhereInput = {
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

    return new PageDto(
      data,
      new PageMetaDto({ pageOptionsDto: query, itemCount }),
    );
  }

  async findOne(companyId: string, id: string) {
    const cycle = await this.db.payrollCycle.findFirst({
      where: { id, companyId },
      include: {
        _count: { select: { payrollSlips: true, loanInstallments: true } },
      },
    });
    if (!cycle) {
      throw new NotFoundException('Payroll cycle not found');
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
    const deductions =
      decimalNum(sums._sum.totalDeductions) + decimalNum(sums._sum.loanDeductions);
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

  async listSlips(
    companyId: string,
    cycleId: string,
    query: QueryPayrollSlipsDto,
  ) {
    await this.getOwnedOrThrow(companyId, cycleId);

    const search = query.search?.trim();
    const employeeFilter: Prisma.EmployeeWhereInput = {
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
    const where: Prisma.PayrollSlipWhereInput = {
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

    return new PageDto(
      data,
      new PageMetaDto({ pageOptionsDto: query, itemCount }),
    );
  }

  async findSlip(companyId: string, slipId: string) {
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
      throw new NotFoundException('Payroll slip not found');
    }

    const policy = await this.db.companyPolicy.findUnique({
      where: { companyId },
    });
    const { from, to } = monthDateRange(
      slip.payrollCycle.year,
      slip.payrollCycle.month,
    );
    const emp = await this.db.employee.findFirst({
      where: { id: slip.employeeId, companyId },
      include: {
        salaryComponents: true,
        attendanceRecords: { where: { date: { gte: from, lte: to } } },
        loans: {
          where: { status: LoanStatus.APPROVED },
          include: {
            installments: {
              where: {
                OR: [
                  { payrollCycleId: slip.payrollCycleId },
                  {
                    status: LoanInstallmentStatus.PENDING,
                    dueDate: { gte: from, lte: to },
                  },
                ],
              },
            },
          },
        },
      },
    });

    const otGrants = await this.loadApprovedOvertime(
      companyId,
      [slip.employeeId],
      from,
      to,
    );

    const calc =
      emp && policy
        ? calculateEmployeeSlip({
            basicSalary: emp.basicSalary,
            salaryBasis: emp.salaryBasis,
            isGosiRegistered: emp.isGosiRegistered,
            components: emp.salaryComponents,
            attendance: emp.attendanceRecords,
            policy,
            loanInstallmentAmounts: emp.loans.flatMap((l) =>
              l.installments.map((i) => i.amount),
            ),
            approvedOvertime: otGrants,
          })
        : null;

    const att = emp?.attendanceRecords ?? [];
    const paidOt = resolvePaidOvertime(att, otGrants);
    const overtimeHours = paidOt.reduce((sum, d) => sum + Number(d.hours), 0);
    const hourRate = emp ? hourRateFor(emp.salaryBasis, Number(emp.basicSalary)) : 0;
    const weekends = new Set(
      (policy?.defaultWeekendDays ?? []).map((d) => d.toUpperCase()),
    );
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
        status: LeaveStatus.APPROVED,
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
        present: att.filter((r) => r.status === AttendanceStatus.PRESENT)
          .length,
        absent: att.filter((r) => r.status === AttendanceStatus.ABSENT).length,
        leave: att.filter((r) => r.status === AttendanceStatus.LEAVE).length,
        delayMinutes: att.reduce((sum, r) => sum + r.delayMinutes, 0),
        overtimeHours,
      },
      attendanceDays: att
        .slice()
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((r) => ({
          date: formatYmd(r.date),
          status: r.status,
          delayMinutes: r.delayMinutes,
          overtimeHours: Number(r.overtimeHours),
        })),
      overtimeDays: paidOt
        .filter((d) => d.hours.greaterThan(0))
        .map((d) => {
          const isWeekend = weekends.has(weekdayNames[d.date.getUTCDay()]!);
          const mult = Number(
            isWeekend
              ? (policy?.overtimeMultiplierHoliday ?? 2)
              : (policy?.overtimeMultiplierNormal ?? 1.5),
          );
          const amount = Number(d.hours) * hourRate * mult;
          const source =
            d.requestHours.greaterThan(0) &&
            d.requestHours.greaterThanOrEqualTo(d.clockHours)
              ? 'REQUEST'
              : 'CLOCK';
          return {
            date: formatYmd(d.date),
            hours: Number(d.hours),
            clockHours: Number(d.clockHours),
            requestHours: Number(d.requestHours),
            source,
            amount: Number(amount.toFixed(2)),
          };
        }),
      leaves: leaves.map((l) => ({
        id: l.id,
        fromDate: formatYmd(l.fromDate),
        toDate: formatYmd(l.toDate),
        reason: l.reason,
      })),
      loans: (emp?.loans ?? []).flatMap((loan) =>
        loan.installments.map((i) => ({
          amount: i.amount,
          dueDate: formatYmd(i.dueDate),
          status: i.status,
        })),
      ),
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

  /** Re-run calculation — only while DRAFT. */
  async recalculate(companyId: string, id: string) {
    const cycle = await this.getOwnedOrThrow(companyId, id);
    this.assertStatus(cycle.status, [PayrollCycleStatus.DRAFT], 'recalculate');
    // Clear prior loan links from a previous draft run.
    await this.db.loanInstallment.updateMany({
      where: { payrollCycleId: id },
      data: { payrollCycleId: null, status: LoanInstallmentStatus.PENDING },
    });
    await this.db.payrollSlip.deleteMany({ where: { payrollCycleId: id } });
    await this.runCalculation(companyId, id);
    return this.findOne(companyId, id);
  }

  /** REVIEW → DRAFT so HR can fix source data and recalculate. */
  async revertToDraft(companyId: string, id: string) {
    const cycle = await this.getOwnedOrThrow(companyId, id);
    this.assertStatus(
      cycle.status,
      [PayrollCycleStatus.REVIEW],
      'revert to draft',
    );
    await this.db.loanInstallment.updateMany({
      where: { payrollCycleId: id, status: LoanInstallmentStatus.PENDING },
      data: { payrollCycleId: null },
    });
    return this.db.payrollCycle.update({
      where: { id },
      data: { status: PayrollCycleStatus.DRAFT },
      include: { _count: { select: { payrollSlips: true } } },
    });
  }

  async moveToReview(companyId: string, id: string) {
    const cycle = await this.getOwnedOrThrow(companyId, id);
    this.assertStatus(cycle.status, [PayrollCycleStatus.DRAFT], 'submit for review');
    const count = await this.db.payrollSlip.count({ where: { payrollCycleId: id } });
    if (count === 0) {
      throw new UnprocessableEntityException(
        'Cycle has no slips — run calculation first',
      );
    }
    return this.db.payrollCycle.update({
      where: { id },
      data: { status: PayrollCycleStatus.REVIEW },
      include: { _count: { select: { payrollSlips: true } } },
    });
  }

  /**
   * Approve: locks loan installments as DEDUCTED and marks loans PAID_OFF when
   * all installments are deducted. Cycle → APPROVED (immutable calculation).
   */
  async approve(companyId: string, id: string) {
    const cycle = await this.getOwnedOrThrow(companyId, id);
    this.assertStatus(cycle.status, [PayrollCycleStatus.REVIEW], 'approve');

    return this.db.$transaction(async (tx) => {
      const linked = await tx.loanInstallment.findMany({
        where: { payrollCycleId: id },
        select: { id: true, loanId: true },
      });
      if (linked.length) {
        await tx.loanInstallment.updateMany({
          where: { payrollCycleId: id },
          data: { status: LoanInstallmentStatus.DEDUCTED },
        });
        const loanIds = [...new Set(linked.map((l) => l.loanId))];
        for (const loanId of loanIds) {
          const pending = await tx.loanInstallment.count({
            where: {
              loanId,
              status: LoanInstallmentStatus.PENDING,
            },
          });
          if (pending === 0) {
            await tx.loan.update({
              where: { id: loanId },
              data: { status: LoanStatus.PAID_OFF },
            });
          }
        }
      }
      return tx.payrollCycle.update({
        where: { id },
        data: { status: PayrollCycleStatus.APPROVED },
        include: { _count: { select: { payrollSlips: true } } },
      });
    });
  }

  async close(companyId: string, id: string) {
    const cycle = await this.getOwnedOrThrow(companyId, id);
    this.assertStatus(cycle.status, [PayrollCycleStatus.APPROVED], 'close');
    return this.db.payrollCycle.update({
      where: { id },
      data: { status: PayrollCycleStatus.CLOSED },
      include: { _count: { select: { payrollSlips: true } } },
    });
  }

  /**
   * Saudi WPS-style CSV (simplified bank file):
   * EmployeeName,BankAccountPlaceholder,Amount,Currency,EstablishmentNumber,Month,Year
   */
  async exportWps(companyId: string, id: string): Promise<{
    filename: string;
    contentType: string;
    body: string;
  }> {
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
      throw new NotFoundException('Payroll cycle not found');
    }
    if (
      cycle.status !== PayrollCycleStatus.APPROVED &&
      cycle.status !== PayrollCycleStatus.CLOSED
    ) {
      throw new ConflictException(
        'WPS export is only available after the cycle is APPROVED',
      );
    }

    const est = cycle.company.establishmentNumber ?? 'UNKNOWN';
    const header =
      'EmployeeName,NetSalary,Currency,EstablishmentNumber,Month,Year,CompanyName';
    const rows = cycle.payrollSlips.map((s) => {
      const name = csvEscape(s.employee.name);
      const company = csvEscape(cycle.company.name);
      return `${name},${s.netSalary.toFixed(2)},SAR,${est},${cycle.month},${cycle.year},${company}`;
    });
    const body = [header, ...rows].join('\n') + '\n';
    const filename = `WPS_${est}_${cycle.year}${String(cycle.month).padStart(2, '0')}.csv`;
    return { filename, contentType: 'text/csv; charset=utf-8', body };
  }

  // ─── Engine ────────────────────────────────────────────────────────────────
  private async runCalculation(companyId: string, cycleId: string) {
    const cycle = await this.db.payrollCycle.findFirst({
      where: { id: cycleId, companyId },
    });
    if (!cycle) {
      throw new NotFoundException('Payroll cycle not found');
    }

    const policy = await this.db.companyPolicy.findUnique({
      where: { companyId },
    });
    if (!policy) {
      throw new UnprocessableEntityException('Company policy is missing');
    }

    const { from, to } = monthDateRange(cycle.year, cycle.month);

    const employees = await this.db.employee.findMany({
      where: { companyId, isActive: true },
      include: {
        salaryComponents: true,
        attendanceRecords: {
          where: { date: { gte: from, lte: to } },
        },
        loans: {
          where: { status: LoanStatus.APPROVED },
          include: {
            installments: {
              where: {
                status: LoanInstallmentStatus.PENDING,
                dueDate: { gte: from, lte: to },
              },
            },
          },
        },
      },
    });

    if (employees.length === 0) {
      throw new UnprocessableEntityException(
        'No active employees to include in this payroll cycle',
      );
    }

    const otByEmp = await this.loadApprovedOvertimeGrouped(
      companyId,
      employees.map((e) => e.id),
      from,
      to,
    );

    // Compute in memory first — Neon interactive txs die after ~5s if we
    // await one create() per employee (248 slips easily exceeds that).
    const slipRows: Prisma.PayrollSlipCreateManyInput[] = [];
    const installmentIds: string[] = [];

    for (const emp of employees) {
      const loanAmounts = emp.loans.flatMap((l) =>
        l.installments.map((i) => i.amount),
      );
      installmentIds.push(
        ...emp.loans.flatMap((l) => l.installments.map((i) => i.id)),
      );

      const slip = calculateEmployeeSlip({
        basicSalary: emp.basicSalary,
        salaryBasis: emp.salaryBasis,
        isGosiRegistered: emp.isGosiRegistered,
        components: emp.salaryComponents,
        attendance: emp.attendanceRecords,
        policy,
        loanInstallmentAmounts: loanAmounts,
        approvedOvertime: otByEmp.get(emp.id) ?? [],
      });

      slipRows.push({
        payrollCycleId: cycleId,
        employeeId: emp.id,
        basicSalary: slip.basicSalary,
        totalAllowances: slip.totalAllowances,
        totalDeductions: slip.totalDeductions,
        loanDeductions: slip.loanDeductions,
        overtimeBonus: slip.overtimeBonus,
        netSalary: slip.netSalary,
      });
    }

    await this.db.$transaction(
      async (tx) => {
        await tx.payrollSlip.createMany({ data: slipRows });
        if (installmentIds.length) {
          await tx.loanInstallment.updateMany({
            where: { id: { in: installmentIds } },
            data: { payrollCycleId: cycleId },
          });
        }
      },
      { timeout: 120_000, maxWait: 20_000 },
    );
  }

  private assertStatus(
    current: PayrollCycleStatus,
    allowed: PayrollCycleStatus[],
    action: string,
  ) {
    if (!allowed.includes(current)) {
      throw new ConflictException(
        `Cannot ${action} a cycle in status ${current} (allowed: ${allowed.join(', ')})`,
      );
    }
  }

  private async getOwnedOrThrow(companyId: string, id: string) {
    const cycle = await this.db.payrollCycle.findFirst({
      where: { id, companyId },
    });
    if (!cycle) {
      throw new NotFoundException('Payroll cycle not found');
    }
    return cycle;
  }

  private async loadApprovedOvertime(
    companyId: string,
    employeeIds: string[],
    from: Date,
    to: Date,
  ): Promise<OvertimeGrant[]> {
    if (employeeIds.length === 0) return [];
    const rows = await this.db.employeeRequest.findMany({
      where: {
        companyId,
        employeeId: { in: employeeIds },
        type: RequestType.OVERTIME,
        status: RequestStatus.APPROVED,
        date: { gte: from, lte: to },
      },
      select: { date: true, hours: true },
    });
    return rows
      .filter((r): r is { date: Date; hours: Prisma.Decimal } => r.date != null && r.hours != null)
      .map((r) => ({ date: r.date, hours: r.hours }));
  }

  private async loadApprovedOvertimeGrouped(
    companyId: string,
    employeeIds: string[],
    from: Date,
    to: Date,
  ): Promise<Map<string, OvertimeGrant[]>> {
    const map = new Map<string, OvertimeGrant[]>();
    if (employeeIds.length === 0) return map;
    const rows = await this.db.employeeRequest.findMany({
      where: {
        companyId,
        employeeId: { in: employeeIds },
        type: RequestType.OVERTIME,
        status: RequestStatus.APPROVED,
        date: { gte: from, lte: to },
      },
      select: { employeeId: true, date: true, hours: true },
    });
    for (const r of rows) {
      if (!r.date || r.hours == null) continue;
      const list = map.get(r.employeeId) ?? [];
      list.push({ date: r.date, hours: r.hours });
      map.set(r.employeeId, list);
    }
    return map;
  }
}

function hourRateFor(basis: SalaryBasis, basic: number): number {
  if (basis === SalaryBasis.HOURLY) return basic;
  if (basis === SalaryBasis.DAILY) return basic / 8;
  return basic / 30 / 8;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
