import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly db: DatabaseService) {}

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
   */
  async updatePolicy(companyId: string, dto: UpdatePolicyDto) {
    await this.getPolicy(companyId); // 404 if absent (clearer than Prisma P2025)
    return this.db.companyPolicy.update({
      where: { companyId },
      data: dto,
    });
  }
}
