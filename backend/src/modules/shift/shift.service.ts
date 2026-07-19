import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftsDto } from './dto/query-shifts.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'name', 'startTime'];

@Injectable()
export class ShiftService {
  constructor(private readonly db: DatabaseService) {}

  create(companyId: string, dto: CreateShiftDto) {
    return this.db.shift.create({
      data: {
        companyId,
        name: dto.name,
        startTime: dto.startTime,
        endTime: dto.endTime,
        gracePeriodMinutes: dto.gracePeriodMinutes,
      },
    });
  }

  async findAll(companyId: string, query: QueryShiftsDto) {
    const search = query.search?.trim();
    const where: Prisma.ShiftWhereInput = {
      companyId,
      ...(search
        ? { name: { contains: search, mode: 'insensitive' } }
        : {}),
    };
    const orderByField = SORTABLE.includes(query.orderBy)
      ? query.orderBy
      : 'createdAt';

    const [data, itemCount] = await Promise.all([
      this.db.shift.findMany({
        where,
        orderBy: { [orderByField]: query.prismaOrder },
        skip: query.skip,
        take: query.limit,
      }),
      this.db.shift.count({ where }),
    ]);

    return new PageDto(
      data,
      new PageMetaDto({ pageOptionsDto: query, itemCount }),
    );
  }

  async findOne(companyId: string, id: string) {
    const shift = await this.db.shift.findFirst({ where: { id, companyId } });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    return shift;
  }

  async update(companyId: string, id: string, dto: UpdateShiftDto) {
    await this.findOne(companyId, id);
    return this.db.shift.update({
      where: { id },
      data: dto as Prisma.ShiftUpdateInput,
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    // Block delete while employees are still assigned (avoids silent un-assign).
    const assigned = await this.db.employee.count({
      where: { companyId, shiftId: id },
    });
    if (assigned > 0) {
      throw new ConflictException('Shift is still assigned to employees');
    }
    await this.db.shift.delete({ where: { id } });
    return { success: true };
  }
}
