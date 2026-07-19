import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PlatformSettingsService } from './platform-settings.service';

/** The resolved limits that apply to a company right now. */
export interface EffectiveLimits {
  maxEmployees: number;
}

/**
 * Single source of truth for "what limits apply to this company".
 *
 *  - Company has a plan  → use the plan's limits.
 *  - Company has NO plan → use the platform-wide trial defaults.
 *
 * Every enforcement point should go through here so trial vs. paid is
 * transparent to callers.
 */
@Injectable()
export class LimitsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly settings: PlatformSettingsService,
  ) {}

  async getEffectiveLimits(companyId: string): Promise<EffectiveLimits> {
    const company = await this.db.company.findUnique({
      where: { id: companyId },
      select: { plan: { select: { maxEmployees: true } } },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    if (company.plan) {
      return { maxEmployees: company.plan.maxEmployees };
    }
    const { defaultTrialMaxEmployees } = await this.settings.getSettings();
    return { maxEmployees: defaultTrialMaxEmployees };
  }

  /**
   * Throws if the company has reached its employee seat cap. Counts only
   * ACTIVE employees (a deactivated employee frees a seat).
   *
   * NOTE: not yet called anywhere — wire this into the employee-create path
   * once the Employee module exists.
   */
  async assertCanAddEmployee(companyId: string): Promise<void> {
    const { maxEmployees } = await this.getEffectiveLimits(companyId);
    const activeCount = await this.db.employee.count({
      where: { companyId, isActive: true },
    });
    if (activeCount >= maxEmployees) {
      throw new ForbiddenException(
        `Employee limit reached (${maxEmployees}). Upgrade your plan to add more.`,
      );
    }
  }
}
