import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, LeaveStatus, Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import { COMPANY_OWNER_ROLE } from '../../common/constants/roles.constant';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import {
  formatYmd,
  inclusiveDayCount,
  normalizeToTenantDay,
  parseDateOnly,
} from '../../common/utils/attendance-time.util';
import { getDefaultTz } from '../../common/constants/time.constant';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { RejectLeaveDto } from './dto/create-leave.dto';
import { QueryLeavesDto } from './dto/query-leaves.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'fromDate', 'toDate'];

function hasLeaveAdmin(actor: AuthenticatedUser) {
  if (actor.roleName === COMPANY_OWNER_ROLE) return true;
  const perms = actor.permissions ?? [];
  return (
    perms.includes(PERMISSIONS.MANAGE_LEAVES) ||
    perms.includes(PERMISSIONS.APPROVE_LEAVES)
  );
}

function mapLeave(
  row: {
    id: string;
    employeeId: string;
    fromDate: Date;
    toDate: Date;
    reason: string | null;
    status: LeaveStatus;
    reviewedById: string | null;
    reviewedAt: Date | null;
    reviewNote: string | null;
    createdAt: Date;
    updatedAt: Date;
    employee?: { id: string; name: string; managerId: string | null };
  },
) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employee?.name ?? null,
    managerId: row.employee?.managerId ?? null,
    fromDate: formatYmd(row.fromDate),
    toDate: formatYmd(row.toDate),
    days: inclusiveDayCount(row.fromDate, row.toDate),
    reason: row.reason,
    status: row.status,
    reviewedById: row.reviewedById,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewNote: row.reviewNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class LeaveService {
  constructor(private readonly db: DatabaseService) {}

  async create(companyId: string, actor: AuthenticatedUser, dto: CreateLeaveDto) {
    const employeeId = actor.isPortalUser
      ? actor.employeeId
      : dto.employeeId || actor.employeeId;
    if (!employeeId) {
      throw new BadRequestException(
        actor.isPortalUser
          ? 'حسابك غير مرتبط بملف موظف'
          : 'employeeId is required',
      );
    }

    const emp = await this.db.employee.findFirst({
      where: { id: employeeId, companyId },
      select: { id: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    const isSelf = actor.employeeId === employeeId;
    if (actor.isPortalUser && !isSelf) {
      throw new ForbiddenException('يمكنك إنشاء إجازة لنفسك فقط');
    }
    if (!actor.isPortalUser && !hasLeaveAdmin(actor) && !isSelf) {
      throw new ForbiddenException('يمكنك إنشاء إجازة لنفسك فقط');
    }

    let from: Date;
    let to: Date;
    try {
      from = parseDateOnly(dto.fromDate);
      to = parseDateOnly(dto.toDate);
    } catch {
      throw new BadRequestException('fromDate and toDate must be YYYY-MM-DD');
    }
    if (to < from) {
      throw new BadRequestException('toDate must be on or after fromDate');
    }
    const today = normalizeToTenantDay(new Date(), getDefaultTz());
    if (from < today) {
      throw new BadRequestException('لا يمكن طلب إجازة قبل اليوم');
    }

    const row = await this.db.leaveRequest.create({
      data: {
        employeeId,
        fromDate: from,
        toDate: to,
        reason: dto.reason?.trim() || null,
        status: LeaveStatus.PENDING,
      },
      include: {
        employee: { select: { id: true, name: true, managerId: true } },
      },
    });
    return mapLeave(row);
  }

  async findAll(
    companyId: string,
    actor: AuthenticatedUser,
    query: QueryLeavesDto,
  ) {
    const and: Prisma.LeaveRequestWhereInput[] = [
      { employee: { companyId } },
      ...this.visibilityFilters(actor),
    ];
    if (query.status) and.push({ status: query.status });
    if (query.employeeId) and.push({ employeeId: query.employeeId });
    if (query.from) {
      try {
        and.push({ toDate: { gte: parseDateOnly(query.from) } });
      } catch {
        throw new BadRequestException('from must be YYYY-MM-DD');
      }
    }
    if (query.to) {
      try {
        and.push({ fromDate: { lte: parseDateOnly(query.to) } });
      } catch {
        throw new BadRequestException('to must be YYYY-MM-DD');
      }
    }

    const where: Prisma.LeaveRequestWhereInput = { AND: and };
    const orderBy = SORTABLE.includes(query.orderBy)
      ? query.orderBy
      : 'createdAt';

    const [rows, itemCount] = await Promise.all([
      this.db.leaveRequest.findMany({
        where,
        orderBy: { [orderBy]: query.prismaOrder },
        skip: query.skip,
        take: query.limit,
        include: {
          employee: { select: { id: true, name: true, managerId: true } },
        },
      }),
      this.db.leaveRequest.count({ where }),
    ]);

    return new PageDto(
      rows.map(mapLeave),
      new PageMetaDto({ pageOptionsDto: query, itemCount }),
    );
  }

  async findOne(companyId: string, actor: AuthenticatedUser, id: string) {
    const row = await this.db.leaveRequest.findFirst({
      where: {
        id,
        AND: [{ employee: { companyId } }, ...this.visibilityFilters(actor)],
      },
      include: {
        employee: { select: { id: true, name: true, managerId: true } },
      },
    });
    if (!row) throw new NotFoundException('Leave request not found');
    return mapLeave(row);
  }

  async approve(companyId: string, actor: AuthenticatedUser, id: string) {
    const row = await this.requirePending(companyId, id);
    this.assertCanReview(actor, row.employeeId, row.employee.managerId);
    const tz = getDefaultTz();
    const from = normalizeToTenantDay(row.fromDate, tz);
    const to = normalizeToTenantDay(row.toDate, tz);
    const days = eachUtcDay(from, to);

    const updated = await this.db.$transaction(async (tx) => {
      const leave = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveStatus.APPROVED,
          reviewedById: actor.userId,
          reviewedAt: new Date(),
          reviewNote: null,
        },
        include: {
          employee: {
            select: { id: true, name: true, managerId: true, shiftId: true },
          },
        },
      });
      for (const day of days) {
        await tx.attendanceRecord.upsert({
          where: {
            employeeId_date: { employeeId: row.employeeId, date: day },
          },
          create: {
            employeeId: row.employeeId,
            date: day,
            shiftId: leave.employee.shiftId,
            status: AttendanceStatus.LEAVE,
            checkIn: null,
            checkOut: null,
            delayMinutes: 0,
            overtimeHours: 0,
          },
          update: {
            status: AttendanceStatus.LEAVE,
            checkIn: null,
            checkOut: null,
            delayMinutes: 0,
            overtimeHours: 0,
          },
        });
      }
      return leave;
    });
    return mapLeave(updated);
  }

  async reject(
    companyId: string,
    actor: AuthenticatedUser,
    id: string,
    dto: RejectLeaveDto,
  ) {
    const row = await this.requirePending(companyId, id);
    this.assertCanReview(actor, row.employeeId, row.employee.managerId);
    const updated = await this.db.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        reviewedById: actor.userId,
        reviewedAt: new Date(),
        reviewNote: dto.reviewNote?.trim() || null,
      },
      include: {
        employee: { select: { id: true, name: true, managerId: true } },
      },
    });
    return mapLeave(updated);
  }

  async remove(companyId: string, actor: AuthenticatedUser, id: string) {
    const row = await this.db.leaveRequest.findFirst({
      where: { id, employee: { companyId } },
      include: {
        employee: { select: { id: true, managerId: true } },
      },
    });
    if (!row) throw new NotFoundException('Leave request not found');
    if (row.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leave can be cancelled');
    }

    const isOwner = actor.roleName === COMPANY_OWNER_ROLE;
    const isSelf = actor.employeeId === row.employeeId;
    if (!isOwner && !isSelf) {
      throw new ForbiddenException('You cannot cancel this leave request');
    }

    await this.db.leaveRequest.delete({ where: { id } });
    return { success: true as const };
  }

  private async requirePending(companyId: string, id: string) {
    const row = await this.db.leaveRequest.findFirst({
      where: { id, employee: { companyId } },
      include: {
        employee: { select: { id: true, name: true, managerId: true } },
      },
    });
    if (!row) throw new NotFoundException('Leave request not found');
    if (row.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Leave request is not pending');
    }
    return row;
  }

  /** Owner / leave admins see all; others see own requests + direct reports. */
  private visibilityFilters(
    actor: AuthenticatedUser,
  ): Prisma.LeaveRequestWhereInput[] {
    if (actor.isPortalUser) {
      if (!actor.employeeId) {
        throw new ForbiddenException('حسابك غير مرتبط بملف موظف');
      }
      return [{ employeeId: actor.employeeId }];
    }
    if (hasLeaveAdmin(actor)) return [];
    if (!actor.employeeId) {
      throw new ForbiddenException('No employee profile linked to this user');
    }
    return [
      {
        OR: [
          { employeeId: actor.employeeId },
          { employee: { managerId: actor.employeeId } },
        ],
      },
    ];
  }

  private assertCanReview(
    actor: AuthenticatedUser,
    employeeId: string,
    managerId: string | null,
  ) {
    if (actor.isPortalUser) {
      throw new ForbiddenException('لا يمكنك مراجعة طلبات الإجازة');
    }
    if (hasLeaveAdmin(actor)) {
      if (actor.employeeId && actor.employeeId === employeeId) {
        throw new ForbiddenException('You cannot review your own leave request');
      }
      return;
    }
    if (actor.employeeId && actor.employeeId === employeeId) {
      throw new ForbiddenException('You cannot review your own leave request');
    }
    if (actor.employeeId && managerId && actor.employeeId === managerId) {
      return;
    }
    throw new ForbiddenException(
      'Only the direct manager or company owner can review leave',
    );
  }
}

function eachUtcDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const endMs = Date.UTC(
    to.getUTCFullYear(),
    to.getUTCMonth(),
    to.getUTCDate(),
  );
  while (cur.getTime() <= endMs) {
    days.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}
