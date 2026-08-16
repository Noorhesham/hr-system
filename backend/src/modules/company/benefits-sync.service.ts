import { Injectable } from '@nestjs/common';
import { Prisma, SalaryComponentType } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';

/** Canonical SalaryComponent names owned by company policy sync. */
export const BENEFIT_COMPONENT_NAMES = {
  housing: 'Housing Allowance',
  transport: 'Transport Allowance',
  annualTickets: 'Annual Tickets Allowance',
} as const;

/**
 * Materializes CompanyPolicy benefit flags/amounts into per-employee
 * SalaryComponent rows so payroll actually pays them.
 *
 * Upserts by exact `name` (no uniqueness constraint). An admin's own custom
 * component with an identical name would be treated as policy-owned.
 */
@Injectable()
export class BenefitsSyncService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Sync policy benefits onto the given employees (or all active ones when
   * `employeeIds` is omitted).
   */
  async syncEmployeeBenefits(companyId: string, employeeIds?: string[]) {
    const policy = await this.db.companyPolicy.findUnique({
      where: { companyId },
    });
    if (!policy) return;

    const employees = await this.db.employee.findMany({
      where: {
        companyId,
        isActive: true,
        ...(employeeIds?.length ? { id: { in: employeeIds } } : {}),
      },
      select: { id: true },
    });
    if (!employees.length) return;

    for (const emp of employees) {
      await this.syncOne(emp.id, policy);
    }
  }

  private async syncOne(
    employeeId: string,
    policy: {
      benefitHousingAllowance: boolean;
      benefitHousingAllowanceAmount: Prisma.Decimal | null;
      benefitHousingAllowanceIsPercentage: boolean;
      benefitTransportAllowance: boolean;
      benefitTransportAllowanceAmount: Prisma.Decimal | null;
      benefitAnnualTickets: boolean;
      benefitAnnualTicketsAmount: Prisma.Decimal | null;
    },
  ) {
    await this.upsertOrDelete(
      employeeId,
      BENEFIT_COMPONENT_NAMES.housing,
      policy.benefitHousingAllowance &&
        policy.benefitHousingAllowanceAmount != null &&
        policy.benefitHousingAllowanceAmount.toNumber() > 0
        ? {
            amount: policy.benefitHousingAllowanceAmount.toNumber(),
            isPercentage: policy.benefitHousingAllowanceIsPercentage,
          }
        : null,
    );

    await this.upsertOrDelete(
      employeeId,
      BENEFIT_COMPONENT_NAMES.transport,
      policy.benefitTransportAllowance &&
        policy.benefitTransportAllowanceAmount != null &&
        policy.benefitTransportAllowanceAmount.toNumber() > 0
        ? {
            amount: policy.benefitTransportAllowanceAmount.toNumber(),
            isPercentage: false,
          }
        : null,
    );

    // Annual tickets stored as yearly value; SalaryComponent is monthly → /12.
    const annual =
      policy.benefitAnnualTicketsAmount?.toNumber() ?? 0;
    const monthlyTickets = Math.round((annual / 12) * 100) / 100;
    await this.upsertOrDelete(
      employeeId,
      BENEFIT_COMPONENT_NAMES.annualTickets,
      policy.benefitAnnualTickets && monthlyTickets > 0
        ? { amount: monthlyTickets, isPercentage: false }
        : null,
    );
  }

  private async upsertOrDelete(
    employeeId: string,
    name: string,
    wanted: { amount: number; isPercentage: boolean } | null,
  ) {
    const existing = await this.db.salaryComponent.findFirst({
      where: { employeeId, name },
    });

    if (!wanted) {
      if (existing) {
        await this.db.salaryComponent.delete({ where: { id: existing.id } });
      }
      return;
    }

    if (existing) {
      await this.db.salaryComponent.update({
        where: { id: existing.id },
        data: {
          type: SalaryComponentType.ALLOWANCE,
          amount: new Prisma.Decimal(wanted.amount),
          isPercentage: wanted.isPercentage,
        },
      });
      return;
    }

    await this.db.salaryComponent.create({
      data: {
        employeeId,
        type: SalaryComponentType.ALLOWANCE,
        name,
        amount: new Prisma.Decimal(wanted.amount),
        isPercentage: wanted.isPercentage,
      },
    });
  }
}
