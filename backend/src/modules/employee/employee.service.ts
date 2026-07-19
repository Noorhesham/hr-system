import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { HashingService } from '../../core/hashing/hashing.service';
import { LimitsService } from '../platform/limits.service';
import { EMPLOYEE_ROLE } from '../../common/constants/roles.constant';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';

/** Columns a client may sort by (guards against arbitrary orderBy). */
const SORTABLE = ['createdAt', 'updatedAt', 'name', 'basicSalary'];

@Injectable()
export class EmployeeService {
  constructor(
    private readonly db: DatabaseService,
    private readonly hashing: HashingService,
    private readonly limits: LimitsService,
  ) {}

  /**
   * Creates an employee + an auto-provisioned portal login (isPortalUser=true)
   * inside one transaction, enforcing the company's seat cap first. Returns the
   * employee plus a one-time temporary password for the portal account.
   */
  async create(companyId: string, dto: CreateEmployeeDto) {
    // 1. Plan/trial seat cap.
    await this.limits.assertCanAddEmployee(companyId);

    // 2. The portal login email must be free.
    const existing = await this.db.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    // 3. GOSI consistency + tenant-owned shift.
    if (dto.isGosiRegistered && !dto.gosiNumber) {
      throw new BadRequestException(
        'gosiNumber is required when isGosiRegistered is true',
      );
    }
    if (dto.shiftId) {
      await this.assertShiftInCompany(companyId, dto.shiftId);
    }

    // 4. One-time temp password for the portal account.
    const temporaryPassword = generateTempPassword();
    const passwordHash = await this.hashing.hash(temporaryPassword);

    const employee = await this.db.$transaction(async (tx) => {
      // Ensure the tenant has a limited "Employee" role for portal users.
      const role = await tx.role.upsert({
        where: { companyId_name: { companyId, name: EMPLOYEE_ROLE } },
        create: { companyId, name: EMPLOYEE_ROLE },
        update: {},
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: passwordHash,
          companyId,
          roleId: role.id,
          isPortalUser: true,
        },
      });

      return tx.employee.create({
        data: {
          companyId,
          userId: user.id,
          name: dto.name,
          basicSalary: dto.basicSalary,
          employmentType: dto.employmentType,
          salaryBasis: dto.salaryBasis,
          shiftId: dto.shiftId,
          isGosiRegistered: dto.isGosiRegistered,
          gosiNumber: dto.gosiNumber,
        },
      });
    });

    return {
      ...employee,
      // Surfaced ONCE so the admin can hand it to the employee.
      portalCredentials: { email: dto.email, temporaryPassword },
    };
  }

  async findAll(companyId: string, query: QueryEmployeesDto) {
    const search = query.search?.trim();
    const where: Prisma.EmployeeWhereInput = {
      companyId,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };
    const orderBy = SORTABLE.includes(query.orderBy)
      ? query.orderBy
      : 'createdAt';

    const [data, itemCount] = await Promise.all([
      this.db.employee.findMany({
        where,
        orderBy: { [orderBy]: query.prismaOrder },
        skip: query.skip,
        take: query.limit,
        include: {
          shift: {
            select: {
              id: true,
              name: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      }),
      this.db.employee.count({ where }),
    ]);

    return new PageDto(
      data,
      new PageMetaDto({ pageOptionsDto: query, itemCount }),
    );
  }

  async findOne(companyId: string, id: string) {
    const employee = await this.db.employee.findFirst({
      where: { id, companyId },
      include: {
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async update(companyId: string, id: string, dto: UpdateEmployeeDto) {
    await this.findOne(companyId, id); // 404 if outside the tenant
    if (dto.shiftId) {
      await this.assertShiftInCompany(companyId, dto.shiftId);
    }
    return this.db.employee.update({
      where: { id },
      data: dto as Prisma.EmployeeUpdateInput,
    });
  }

  private async assertShiftInCompany(companyId: string, shiftId: string) {
    const shift = await this.db.shift.findFirst({
      where: { id: shiftId, companyId },
      select: { id: true },
    });
    if (!shift) {
      throw new BadRequestException('Shift not found in your company');
    }
  }
}

/** URL-safe random ~12-char temporary password. */
function generateTempPassword(): string {
  return crypto.randomBytes(9).toString('base64url');
}
