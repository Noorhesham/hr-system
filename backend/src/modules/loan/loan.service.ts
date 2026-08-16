import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LoanInstallmentStatus,
  LoanStatus,
  Prisma,
} from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import { parseDateOnly } from '../../common/utils/attendance-time.util';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { QueryLoansDto } from './dto/query-loans.dto';

/** Columns a client may sort by (guards against arbitrary orderBy). */
const SORTABLE = ['createdAt', 'updatedAt', 'totalAmount'];

@Injectable()
export class LoanService {
  constructor(private readonly db: DatabaseService) {}

  /** Create a PENDING loan for an employee. */
  async create(companyId: string, employeeId: string, dto: CreateLoanDto) {
    await this.assertEmployeeInCompany(companyId, employeeId);
    return this.db.loan.create({
      data: {
        employeeId,
        totalAmount: new Prisma.Decimal(dto.totalAmount),
        status: LoanStatus.PENDING,
      },
    });
  }

  async findAllForEmployee(companyId: string, employeeId: string) {
    await this.assertEmployeeInCompany(companyId, employeeId);
    return this.db.loan.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      include: { installments: { orderBy: { dueDate: 'asc' } } },
    });
  }

  async findAll(companyId: string, query: QueryLoansDto) {
    const where: Prisma.LoanWhereInput = {
      employee: { companyId },
      ...(query.status ? { status: query.status } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    };
    const orderBy = SORTABLE.includes(query.orderBy) ? query.orderBy : 'createdAt';

    const [data, itemCount] = await Promise.all([
      this.db.loan.findMany({
        where,
        orderBy: { [orderBy]: query.prismaOrder },
        skip: query.skip,
        take: query.limit,
        include: { employee: { select: { id: true, name: true } } },
      }),
      this.db.loan.count({ where }),
    ]);

    return new PageDto(
      data,
      new PageMetaDto({ pageOptionsDto: query, itemCount }),
    );
  }

  async findOne(companyId: string, id: string) {
    const loan = await this.db.loan.findFirst({
      where: { id, employee: { companyId } },
      include: {
        employee: { select: { id: true, name: true } },
        installments: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }
    return loan;
  }

  /**
   * Approve a PENDING loan and generate its monthly installment schedule in a
   * single transaction. The schedule always reconciles to the exact total:
   * any rounding remainder is placed on the final installment.
   */
  async approve(companyId: string, id: string, dto: ApproveLoanDto) {
    const loan = await this.getOwnedOrThrow(companyId, id);
    if (loan.status !== LoanStatus.PENDING) {
      throw new ConflictException(
        `Only a PENDING loan can be approved (current status: ${loan.status})`,
      );
    }

    const hasCount = dto.numberOfInstallments !== undefined;
    const hasAmount = dto.installmentAmount !== undefined;
    if (hasCount === hasAmount) {
      throw new BadRequestException(
        'Provide exactly one of numberOfInstallments or installmentAmount',
      );
    }

    // Work in integer cents to avoid floating-point drift.
    const totalCents = loan.totalAmount.times(100).toNumber();
    const perCents = this.buildInstallmentCents(
      totalCents,
      dto.numberOfInstallments,
      dto.installmentAmount,
    );

    const start = parseDateOnly(dto.startDate);
    const installmentsData = perCents.map((cents, i) => ({
      loanId: loan.id,
      amount: new Prisma.Decimal(cents).dividedBy(100),
      dueDate: addUtcMonths(start, i),
      status: LoanInstallmentStatus.PENDING,
    }));

    return this.db.$transaction(async (tx) => {
      await tx.loanInstallment.createMany({ data: installmentsData });
      return tx.loan.update({
        where: { id: loan.id },
        data: { status: LoanStatus.APPROVED },
        include: { installments: { orderBy: { dueDate: 'asc' } } },
      });
    });
  }

  /** Delete a loan — only while PENDING (an approved schedule is immutable here). */
  async remove(companyId: string, id: string) {
    const loan = await this.getOwnedOrThrow(companyId, id);
    if (loan.status !== LoanStatus.PENDING) {
      throw new ConflictException('Only a PENDING loan can be deleted');
    }
    await this.db.loan.delete({ where: { id } });
    return { success: true };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  /**
   * Splits `totalCents` into a list of per-installment cent amounts. Either an
   * installment count OR a fixed installment amount drives the split; the last
   * installment absorbs the remainder so the sum equals the total exactly.
   */
  private buildInstallmentCents(
    totalCents: number,
    numberOfInstallments?: number,
    installmentAmount?: number,
  ): number[] {
    if (numberOfInstallments !== undefined) {
      const n = numberOfInstallments;
      const base = Math.floor(totalCents / n);
      const amounts = new Array<number>(n).fill(base);
      amounts[n - 1] += totalCents - base * n;
      return amounts;
    }

    const perCents = Math.round((installmentAmount as number) * 100);
    if (perCents >= totalCents) {
      return [totalCents];
    }
    const fullCount = Math.floor(totalCents / perCents);
    const remainder = totalCents - fullCount * perCents;
    const amounts = new Array<number>(fullCount).fill(perCents);
    if (remainder > 0) {
      amounts.push(remainder);
    }
    return amounts;
  }

  private async assertEmployeeInCompany(companyId: string, employeeId: string) {
    const employee = await this.db.employee.findFirst({
      where: { id: employeeId, companyId },
      select: { id: true },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
  }

  /** Fetches a loan scoped by its parent employee's company (isolation). */
  private async getOwnedOrThrow(companyId: string, id: string) {
    const loan = await this.db.loan.findFirst({
      where: { id, employee: { companyId } },
    });
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }
    return loan;
  }
}

/** Returns a new UTC date `months` after `date` (day-of-month preserved). */
function addUtcMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}
