import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { QueryPlatformCompaniesDto } from './dto/query-platform-companies.dto';

const COMPANY_SORTABLE = ['createdAt', 'name', 'subscriptionStatus'];

@Injectable()
export class PlatformService {
  constructor(private readonly db: DatabaseService) {}

  listPlans() {
    return this.db.subscriptionPlan.findMany({
      orderBy: { monthlyPrice: 'asc' },
      include: { _count: { select: { companies: true } } },
    });
  }

  async createPlan(dto: CreatePlanDto) {
    await this.assertUniqueName(dto.name);
    return this.db.subscriptionPlan.create({
      data: {
        name: dto.name.trim(),
        maxEmployees: dto.maxEmployees,
        monthlyPrice: new Prisma.Decimal(dto.monthlyPrice),
      },
      include: { _count: { select: { companies: true } } },
    });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    await this.getPlanOrThrow(id);
    if (dto.name) await this.assertUniqueName(dto.name, id);
    return this.db.subscriptionPlan.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.maxEmployees != null ? { maxEmployees: dto.maxEmployees } : {}),
        ...(dto.monthlyPrice != null
          ? { monthlyPrice: new Prisma.Decimal(dto.monthlyPrice) }
          : {}),
      },
      include: { _count: { select: { companies: true } } },
    });
  }

  async removePlan(id: string) {
    const plan = await this.getPlanOrThrow(id);
    const inUse = await this.db.company.count({ where: { planId: id } });
    if (inUse > 0) {
      throw new ConflictException(
        `Cannot delete "${plan.name}" — ${inUse} compan${inUse === 1 ? 'y is' : 'ies are'} on this plan`,
      );
    }
    await this.db.subscriptionPlan.delete({ where: { id } });
    return { ok: true };
  }

  async listCompanies(query: QueryPlatformCompaniesDto) {
    const search = query.search?.trim();
    const where: Prisma.CompanyWhereInput = {
      ...(query.status ? { subscriptionStatus: query.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { establishmentNumber: { contains: search, mode: 'insensitive' } },
              {
                users: {
                  some: { email: { contains: search, mode: 'insensitive' } },
                },
              },
            ],
          }
        : {}),
    };
    const orderBy = COMPANY_SORTABLE.includes(query.orderBy)
      ? query.orderBy
      : 'createdAt';

    const [rows, itemCount] = await Promise.all([
      this.db.company.findMany({
        where,
        orderBy: { [orderBy]: query.prismaOrder },
        skip: query.skip,
        take: query.limit,
        select: {
          id: true,
          name: true,
          establishmentNumber: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          nextBillingDate: true,
          billingCycle: true,
          createdAt: true,
          plan: { select: { id: true, name: true, maxEmployees: true } },
          _count: { select: { employees: true, users: true } },
          users: {
            where: { isPortalUser: false },
            take: 3,
            orderBy: { createdAt: 'asc' },
            select: { email: true, isPlatformAdmin: true },
          },
        },
      }),
      this.db.company.count({ where }),
    ]);

    return new PageDto(
      rows,
      new PageMetaDto({ pageOptionsDto: query, itemCount }),
    );
  }

  private async getPlanOrThrow(id: string) {
    const plan = await this.db.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return plan;
  }

  private async assertUniqueName(name: string, excludeId?: string) {
    const existing = await this.db.subscriptionPlan.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(`A plan named "${name.trim()}" already exists`);
    }
  }
}
