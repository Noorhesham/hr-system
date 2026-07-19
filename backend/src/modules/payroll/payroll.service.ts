import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  LoanInstallmentStatus,
  LoanStatus,
  PayrollCycleStatus,
  Prisma,
} from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { QueryPayrollCyclesDto } from './dto/query-payroll-cycles.dto';
import {
  calculateEmployeeSlip,
  monthDateRange,
} from './payroll-calculator';

const SORTABLE = ['createdAt', 'updatedAt', 'year', 'month'];

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

    await this.runCalculation(companyId, cycle.id);
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
        payrollSlips: {
          include: { employee: { select: { id: true, name: true } } },
          orderBy: { employee: { name: 'asc' } },
        },
        _count: { select: { payrollSlips: true, loanInstallments: true } },
      },
    });
    if (!cycle) {
      throw new NotFoundException('Payroll cycle not found');
    }
    return cycle;
  }

  async findSlip(companyId: string, slipId: string) {
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
      throw new NotFoundException('Payroll slip not found');
    }
    return slip;
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
        include: {
          payrollSlips: {
            include: { employee: { select: { id: true, name: true } } },
          },
        },
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

    await this.db.$transaction(async (tx) => {
      for (const emp of employees) {
        const loanAmounts = emp.loans.flatMap((l) =>
          l.installments.map((i) => i.amount),
        );
        const installmentIds = emp.loans.flatMap((l) =>
          l.installments.map((i) => i.id),
        );

        const slip = calculateEmployeeSlip({
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
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
