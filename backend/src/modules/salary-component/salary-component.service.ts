import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { UpdateSalaryComponentDto } from './dto/update-salary-component.dto';

@Injectable()
export class SalaryComponentService {
  constructor(private readonly db: DatabaseService) {}

  async create(
    companyId: string,
    employeeId: string,
    dto: CreateSalaryComponentDto,
  ) {
    await this.assertEmployeeInCompany(companyId, employeeId);
    this.assertPercentageRange(dto.isPercentage ?? false, dto.amount);
    return this.db.salaryComponent.create({
      data: {
        employeeId,
        type: dto.type,
        name: dto.name,
        amount: new Prisma.Decimal(dto.amount),
        isPercentage: dto.isPercentage ?? false,
      },
    });
  }

  async findAllForEmployee(companyId: string, employeeId: string) {
    await this.assertEmployeeInCompany(companyId, employeeId);
    return this.db.salaryComponent.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(companyId: string, id: string, dto: UpdateSalaryComponentDto) {
    const existing = await this.getOwnedOrThrow(companyId, id);

    // Validate against the effective (post-update) values so a component that
    // becomes a percentage — or has its amount changed — stays within 0–100.
    const isPercentage = dto.isPercentage ?? existing.isPercentage;
    const amount = dto.amount ?? existing.amount.toNumber();
    this.assertPercentageRange(isPercentage, amount);

    return this.db.salaryComponent.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.amount !== undefined
          ? { amount: new Prisma.Decimal(dto.amount) }
          : {}),
        ...(dto.isPercentage !== undefined
          ? { isPercentage: dto.isPercentage }
          : {}),
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.getOwnedOrThrow(companyId, id);
    await this.db.salaryComponent.delete({ where: { id } });
    return { success: true };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  private assertPercentageRange(isPercentage: boolean, amount: number) {
    if (isPercentage && amount > 100) {
      throw new BadRequestException(
        'A percentage component amount must be between 0 and 100',
      );
    }
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

  /** Fetches a component scoped by its parent employee's company (isolation). */
  private async getOwnedOrThrow(companyId: string, id: string) {
    const component = await this.db.salaryComponent.findFirst({
      where: { id, employee: { companyId } },
    });
    if (!component) {
      throw new NotFoundException('Salary component not found');
    }
    return component;
  }
}
