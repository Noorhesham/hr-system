import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { BenefitsSyncService } from './benefits-sync.service';

@Injectable()
export class CompanyService {
  constructor(
    private readonly db: DatabaseService,
    private readonly benefitsSync: BenefitsSyncService,
  ) {}

  /** Fetch the calling tenant's company profile. */
  async getCompany(companyId: string) {
    const company = await this.db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        establishmentNumber: true,
        website: true,
        industry: true,
        logoUrl: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async updateCompany(companyId: string, dto: UpdateCompanyDto) {
    await this.getCompany(companyId);
    return this.db.company.update({
      where: { id: companyId },
      data: dto,
      select: {
        id: true,
        name: true,
        establishmentNumber: true,
        website: true,
        industry: true,
        logoUrl: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        updatedAt: true,
      },
    });
  }

  /** Fetch the calling tenant's policy. */
  async getPolicy(companyId: string) {
    const policy = await this.db.companyPolicy.findUnique({
      where: { companyId },
    });
    if (!policy) {
      throw new NotFoundException('Company policy not found');
    }
    return policy;
  }

  /**
   * Update the calling tenant's policy.
   *
   * Tenant isolation: the `where: { companyId }` filter uses the companyId from
   * the JWT (passed by the controller via @Tenant()). A token from another
   * company simply targets a different row — it can never read or mutate this
   * tenant's policy.
   *
   * After saving, benefit flags/amounts are materialized into SalaryComponent
   * rows for every active employee.
   */
  async updatePolicy(companyId: string, dto: UpdatePolicyDto) {
    await this.getPolicy(companyId);
    const data: Prisma.CompanyPolicyUpdateInput = { ...dto };
    const updated = await this.db.companyPolicy.update({
      where: { companyId },
      data,
    });

    // Only sync when any benefit-related field changed — avoids pointless work
    // on attendance/payroll-only patches, and still covers onboarding benefits.
    const benefitTouched =
      dto.benefitHousingAllowance !== undefined ||
      dto.benefitHousingAllowanceAmount !== undefined ||
      dto.benefitHousingAllowanceIsPercentage !== undefined ||
      dto.benefitTransportAllowance !== undefined ||
      dto.benefitTransportAllowanceAmount !== undefined ||
      dto.benefitAnnualTickets !== undefined ||
      dto.benefitAnnualTicketsAmount !== undefined;

    if (benefitTouched) {
      await this.benefitsSync.syncEmployeeBenefits(companyId);
    }

    return updated;
  }
}
