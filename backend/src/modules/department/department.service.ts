import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/department.dto';
import { QueryDepartmentsDto } from './dto/query-departments.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'name'];

@Injectable()
export class DepartmentService {
  constructor(private readonly db: DatabaseService) {}

  async create(companyId: string, dto: CreateDepartmentDto) {
    const name = dto.name.trim();
    try {
      return await this.db.department.create({
        data: { companyId, name },
        include: { _count: { select: { employees: true } } },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Department name already exists');
      }
      throw err;
    }
  }

  async findAll(companyId: string, query: QueryDepartmentsDto) {
    const search = query.search?.trim();
    const where: Prisma.DepartmentWhereInput = {
      companyId,
      ...(search
        ? { name: { contains: search, mode: 'insensitive' } }
        : {}),
    };
    const orderBy = SORTABLE.includes(query.orderBy)
      ? query.orderBy
      : 'name';

    const [data, itemCount] = await Promise.all([
      this.db.department.findMany({
        where,
        orderBy: { [orderBy]: query.prismaOrder },
        skip: query.skip,
        take: query.limit,
        include: { _count: { select: { employees: true } } },
      }),
      this.db.department.count({ where }),
    ]);

    return new PageDto(
      data,
      new PageMetaDto({ pageOptionsDto: query, itemCount }),
    );
  }

  /** Compact list for selects (id + name), no pagination. */
  async listOptions(companyId: string) {
    return this.db.department.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { employees: true } },
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const row = await this.db.department.findFirst({
      where: { id, companyId },
      include: { _count: { select: { employees: true } } },
    });
    if (!row) throw new NotFoundException('Department not found');
    return row;
  }

  async update(companyId: string, id: string, dto: UpdateDepartmentDto) {
    await this.findOne(companyId, id);
    const name = dto.name?.trim();
    if (!name) return this.findOne(companyId, id);

    try {
      const updated = await this.db.department.update({
        where: { id },
        data: { name },
        include: { _count: { select: { employees: true } } },
      });
      // Keep denormalized Employee.department in sync for groupBy/reports.
      await this.db.employee.updateMany({
        where: { companyId, departmentId: id },
        data: { department: name },
      });
      return updated;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Department name already exists');
      }
      throw err;
    }
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    const assigned = await this.db.employee.count({
      where: { companyId, departmentId: id },
    });
    if (assigned > 0) {
      throw new ConflictException(
        'Department is still assigned to employees',
      );
    }
    await this.db.department.delete({ where: { id } });
    return { success: true as const };
  }
}
