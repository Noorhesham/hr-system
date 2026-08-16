import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RequestApprovalAction,
  RequestStatus,
  RequestType,
} from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import { COMPANY_OWNER_ROLE } from '../../common/constants/roles.constant';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import {
  formatYmd,
  parseDateOnly,
} from '../../common/utils/attendance-time.util';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { NotificationService } from '../notification/notification.service';
import type { NotifyInput } from '../notification/notification.service';
import {
  CreateRequestDto,
  QueryRequestsDto,
  RejectRequestDto,
} from './dto/request.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'date', 'status'];

function mapRequest(row: {
  id: string;
  companyId: string;
  employeeId: string;
  type: RequestType;
  title: string | null;
  reason: string | null;
  date: Date | null;
  hours: Prisma.Decimal | null;
  status: RequestStatus;
  approvalLevel: number;
  reviewedById: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  employee?: { id: string; name: string; managerId: string | null };
  steps?: {
    id: string;
    level: number;
    action: RequestApprovalAction;
    actorId: string;
    note: string | null;
    createdAt: Date;
  }[];
}) {
  return {
    id: row.id,
    companyId: row.companyId,
    employeeId: row.employeeId,
    employeeName: row.employee?.name ?? null,
    managerId: row.employee?.managerId ?? null,
    type: row.type,
    title: row.title,
    reason: row.reason,
    date: row.date ? formatYmd(row.date) : null,
    hours: row.hours != null ? Number(row.hours) : null,
    status: row.status,
    approvalLevel: row.approvalLevel,
    reviewedById: row.reviewedById,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewNote: row.reviewNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    steps: (row.steps ?? []).map((s) => ({
      id: s.id,
      level: s.level,
      action: s.action,
      actorId: s.actorId,
      note: s.note,
      createdAt: s.createdAt.toISOString(),
    })),
  };
}

@Injectable()
export class RequestService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifications: NotificationService,
  ) {}

  async create(
    companyId: string,
    actor: AuthenticatedUser,
    dto: CreateRequestDto,
  ) {
    const isOwner = actor.roleName === COMPANY_OWNER_ROLE;
    const hasManage = this.hasPerm(actor, PERMISSIONS.MANAGE_REQUESTS);
    let employeeId = dto.employeeId;

    if (actor.isPortalUser) {
      if (!actor.employeeId) {
        throw new BadRequestException('حسابك غير مرتبط بملف موظف');
      }
      employeeId = actor.employeeId;
    } else if (!employeeId) {
      if (!actor.employeeId) {
        throw new BadRequestException('employeeId is required');
      }
      employeeId = actor.employeeId;
    }

    const emp = await this.db.employee.findFirst({
      where: { id: employeeId, companyId },
      include: {
        manager: { select: { userId: true, name: true } },
        user: { select: { id: true, email: true } },
      },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    const isSelf = actor.employeeId === employeeId;
    if (!isOwner && !hasManage && !isSelf) {
      throw new ForbiddenException('You can only create requests for yourself');
    }

    if (dto.type === RequestType.OVERTIME) {
      if (!dto.date || dto.hours == null) {
        throw new BadRequestException('OVERTIME requires date and hours');
      }
    }
    if (dto.type === RequestType.GENERAL && !dto.title?.trim()) {
      throw new BadRequestException('GENERAL requires a title');
    }

    let otDate: Date | null = null;
    if (dto.date) {
      try {
        otDate = parseDateOnly(dto.date);
      } catch {
        throw new BadRequestException('date must be YYYY-MM-DD');
      }
    }

    const row = await this.db.employeeRequest.create({
      data: {
        companyId,
        employeeId,
        type: dto.type,
        title: dto.title?.trim() || null,
        reason: dto.reason?.trim() || null,
        date: otDate,
        hours:
          dto.hours != null ? new Prisma.Decimal(dto.hours) : null,
        status: RequestStatus.PENDING,
        approvalLevel: 1,
      },
      include: {
        employee: { select: { id: true, name: true, managerId: true } },
        steps: true,
      },
    });

    // Notify direct manager (or owners if no manager)
    await this.notifyManagersOnSubmit(companyId, emp, row.id, dto.type);

    return mapRequest(row);
  }

  async findAll(
    companyId: string,
    actor: AuthenticatedUser,
    query: QueryRequestsDto,
  ) {
    const mine =
      query.mine === '1' ||
      query.mine === 'true' ||
      actor.isPortalUser;

    const and: Prisma.EmployeeRequestWhereInput[] = [{ companyId }];

    if (mine) {
      if (!actor.employeeId) {
        return new PageDto(
          [],
          new PageMetaDto({
            pageOptionsDto: query,
            itemCount: 0,
          }),
        );
      }
      and.push({ employeeId: actor.employeeId });
    } else {
      and.push(...this.adminVisibility(actor));
    }

    if (query.status) and.push({ status: query.status });
    if (query.type) and.push({ type: query.type });
    if (query.employeeId) and.push({ employeeId: query.employeeId });

    const orderByField = SORTABLE.includes(query.orderBy)
      ? query.orderBy
      : 'createdAt';

    const where: Prisma.EmployeeRequestWhereInput = { AND: and };
    const [total, rows] = await Promise.all([
      this.db.employeeRequest.count({ where }),
      this.db.employeeRequest.findMany({
        where,
        orderBy: { [orderByField]: query.prismaOrder },
        skip: query.skip,
        take: query.limit,
        include: {
          employee: { select: { id: true, name: true, managerId: true } },
          steps: { orderBy: { createdAt: 'asc' } },
        },
      }),
    ]);

    return new PageDto(
      rows.map(mapRequest),
      new PageMetaDto({ pageOptionsDto: query, itemCount: total }),
    );
  }

  async findOne(companyId: string, actor: AuthenticatedUser, id: string) {
    const row = await this.db.employeeRequest.findFirst({
      where: { id, companyId },
      include: {
        employee: { select: { id: true, name: true, managerId: true } },
        steps: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!row) throw new NotFoundException('Request not found');
    this.assertCanView(actor, row.employeeId, row.employee?.managerId ?? null);
    return mapRequest(row);
  }

  async approve(companyId: string, actor: AuthenticatedUser, id: string) {
    const row = await this.loadPending(companyId, id);
    if (
      row.status !== RequestStatus.PENDING &&
      row.status !== RequestStatus.IN_REVIEW
    ) {
      throw new BadRequestException('Request is not awaiting approval');
    }
    if (actor.employeeId && actor.employeeId === row.employeeId) {
      throw new ForbiddenException('Cannot approve your own request');
    }

    const isOwner = actor.roleName === COMPANY_OWNER_ROLE;
    const level = row.approvalLevel;

    if (level === 1) {
      const isManager = await this.isDirectManager(actor, row.employeeId);
      if (!isOwner && !isManager) {
        throw new ForbiddenException(
          'Only the direct manager or Owner can approve at level 1',
        );
      }

      // Owner can skip to final approval
      if (isOwner) {
        return this.finalize(companyId, actor, row, true);
      }

      const updated = await this.db.employeeRequest.update({
        where: { id: row.id },
        data: {
          status: RequestStatus.IN_REVIEW,
          approvalLevel: 2,
          steps: {
            create: {
              level: 1,
              action: RequestApprovalAction.APPROVED,
              actorId: actor.userId,
            },
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              managerId: true,
              user: { select: { id: true, email: true } },
            },
          },
          steps: { orderBy: { createdAt: 'asc' } },
        },
      });

      await this.notifyHrOnLevel1(companyId, updated.id, updated.type);
      return mapRequest(updated);
    }

    // Level 2
    if (!isOwner && !this.hasPerm(actor, PERMISSIONS.APPROVE_REQUESTS)) {
      throw new ForbiddenException(
        'HR / Owner permission required for final approval',
      );
    }
    return this.finalize(companyId, actor, row, true);
  }

  async reject(
    companyId: string,
    actor: AuthenticatedUser,
    id: string,
    dto: RejectRequestDto,
  ) {
    const row = await this.loadPending(companyId, id);
    if (
      row.status !== RequestStatus.PENDING &&
      row.status !== RequestStatus.IN_REVIEW
    ) {
      throw new BadRequestException('Request is not awaiting approval');
    }
    if (actor.employeeId && actor.employeeId === row.employeeId) {
      throw new ForbiddenException('Cannot reject your own request');
    }

    const isOwner = actor.roleName === COMPANY_OWNER_ROLE;
    const level = row.approvalLevel;

    if (level === 1) {
      const isManager = await this.isDirectManager(actor, row.employeeId);
      if (!isOwner && !isManager) {
        throw new ForbiddenException(
          'Only the direct manager or Owner can reject at level 1',
        );
      }
    } else if (
      !isOwner &&
      !this.hasPerm(actor, PERMISSIONS.APPROVE_REQUESTS)
    ) {
      throw new ForbiddenException(
        'HR / Owner permission required to reject at level 2',
      );
    }

    return this.finalize(companyId, actor, row, false, dto.reviewNote);
  }

  async cancel(companyId: string, actor: AuthenticatedUser, id: string) {
    const row = await this.db.employeeRequest.findFirst({
      where: { id, companyId },
      include: {
        employee: { select: { id: true, name: true, managerId: true } },
      },
    });
    if (!row) throw new NotFoundException('Request not found');
    if (row.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only PENDING requests can be cancelled');
    }
    const isOwner = actor.roleName === COMPANY_OWNER_ROLE;
    const isSelf = actor.employeeId === row.employeeId;
    if (!isOwner && !isSelf && !this.hasPerm(actor, PERMISSIONS.MANAGE_REQUESTS)) {
      throw new ForbiddenException('Not allowed to cancel this request');
    }

    const updated = await this.db.employeeRequest.update({
      where: { id: row.id },
      data: { status: RequestStatus.CANCELLED },
      include: {
        employee: { select: { id: true, name: true, managerId: true } },
        steps: { orderBy: { createdAt: 'asc' } },
      },
    });
    return mapRequest(updated);
  }

  // ─── helpers ─────────────────────────────────────────────────────────────

  private async finalize(
    companyId: string,
    actor: AuthenticatedUser,
    row: {
      id: string;
      employeeId: string;
      type: RequestType;
      approvalLevel: number;
      status: RequestStatus;
    },
    approved: boolean,
    reviewNote?: string,
  ) {
    const status = approved ? RequestStatus.APPROVED : RequestStatus.REJECTED;
    const updated = await this.db.employeeRequest.update({
      where: { id: row.id },
      data: {
        status,
        reviewedById: actor.userId,
        reviewedAt: new Date(),
        reviewNote: reviewNote?.trim() || null,
        steps: {
          create: {
            level: row.approvalLevel,
            action: approved
              ? RequestApprovalAction.APPROVED
              : RequestApprovalAction.REJECTED,
            actorId: actor.userId,
            note: reviewNote?.trim() || null,
          },
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            managerId: true,
            user: { select: { id: true, email: true } },
          },
        },
        steps: { orderBy: { createdAt: 'asc' } },
      },
    });

    const empUser = updated.employee?.user;
    if (empUser) {
      const label = updated.type === RequestType.OVERTIME ? 'العمل الإضافي' : 'الطلب';
      await this.notifications.create({
        companyId,
        userId: empUser.id,
        title: approved ? `تمت الموافقة على ${label}` : `تم رفض ${label}`,
        body: approved
          ? `تمت الموافقة النهائية على طلبك.`
          : `تم رفض طلبك${reviewNote ? `: ${reviewNote}` : '.'}`,
        type: approved ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
        link: '/my-requests',
        emailTo: empUser.email,
      });
    }

    return mapRequest(updated);
  }

  private async loadPending(companyId: string, id: string) {
    const row = await this.db.employeeRequest.findFirst({
      where: { id, companyId },
      include: {
        employee: { select: { id: true, name: true, managerId: true } },
      },
    });
    if (!row) throw new NotFoundException('Request not found');
    return row;
  }

  private async isDirectManager(
    actor: AuthenticatedUser,
    employeeId: string,
  ): Promise<boolean> {
    if (!actor.employeeId) return false;
    const emp = await this.db.employee.findFirst({
      where: { id: employeeId },
      select: { managerId: true },
    });
    return emp?.managerId === actor.employeeId;
  }

  private hasPerm(actor: AuthenticatedUser, action: string) {
    if (actor.roleName === COMPANY_OWNER_ROLE) return true;
    return (actor.permissions ?? []).includes(action);
  }

  private adminVisibility(
    actor: AuthenticatedUser,
  ): Prisma.EmployeeRequestWhereInput[] {
    if (
      actor.roleName === COMPANY_OWNER_ROLE ||
      this.hasPerm(actor, PERMISSIONS.MANAGE_REQUESTS) ||
      this.hasPerm(actor, PERMISSIONS.APPROVE_REQUESTS)
    ) {
      // Managers with only APPROVE see team + items at their level; HR sees all
      if (
        !this.hasPerm(actor, PERMISSIONS.MANAGE_REQUESTS) &&
        actor.roleName !== COMPANY_OWNER_ROLE &&
        actor.employeeId
      ) {
        return [
          {
            OR: [
              { employee: { managerId: actor.employeeId } },
              {
                status: RequestStatus.IN_REVIEW,
                approvalLevel: 2,
              },
            ],
          },
        ];
      }
      return [];
    }
    if (actor.employeeId) {
      return [
        {
          OR: [
            { employeeId: actor.employeeId },
            { employee: { managerId: actor.employeeId } },
          ],
        },
      ];
    }
    throw new ForbiddenException('Insufficient permissions to list requests');
  }

  private assertCanView(
    actor: AuthenticatedUser,
    employeeId: string,
    managerId: string | null,
  ) {
    if (actor.roleName === COMPANY_OWNER_ROLE) return;
    if (this.hasPerm(actor, PERMISSIONS.MANAGE_REQUESTS)) return;
    if (this.hasPerm(actor, PERMISSIONS.APPROVE_REQUESTS)) return;
    if (actor.employeeId === employeeId) return;
    if (actor.employeeId && managerId === actor.employeeId) return;
    throw new ForbiddenException('Not allowed to view this request');
  }

  private async notifyManagersOnSubmit(
    companyId: string,
    emp: {
      name: string;
      manager: { userId: string | null; name: string } | null;
    },
    requestId: string,
    type: RequestType,
  ) {
    const label = type === RequestType.OVERTIME ? 'عمل إضافي' : 'طلب عام';
    const title = `طلب ${label} جديد`;
    const body = `${emp.name} قدّم طلب ${label} بانتظار موافقتك.`;

    if (emp.manager?.userId) {
      await this.notifications.create({
        companyId,
        userId: emp.manager.userId,
        title,
        body,
        type: 'REQUEST_SUBMITTED',
        link: '/requests',
      });
      return;
    }

    const owners = await this.db.user.findMany({
      where: {
        companyId,
        role: { name: COMPANY_OWNER_ROLE },
      },
      select: { id: true },
    });
    await this.notifications.createMany(
      owners.map((o) => ({
        companyId,
        userId: o.id,
        title,
        body,
        type: 'REQUEST_SUBMITTED',
        link: '/requests',
      })),
    );
  }

  private async notifyHrOnLevel1(
    companyId: string,
    requestId: string,
    type: RequestType,
  ) {
    const label = type === RequestType.OVERTIME ? 'عمل إضافي' : 'طلب عام';
    const users = await this.db.user.findMany({
      where: {
        companyId,
        OR: [
          { role: { name: COMPANY_OWNER_ROLE } },
          {
            role: {
              permissions: { some: { action: PERMISSIONS.APPROVE_REQUESTS } },
            },
          },
        ],
      },
      select: { id: true },
    });
    // Deduplicate
    const seen = new Set<string>();
    const inputs: NotifyInput[] = [];
    for (const u of users) {
      if (seen.has(u.id)) continue;
      seen.add(u.id);
      inputs.push({
        companyId,
        userId: u.id,
        title: `طلب ${label} بانتظار الموافقة النهائية`,
        body: 'تمت موافقة المدير المباشر — مطلوب اعتماد المستوى الثاني.',
        type: 'REQUEST_LEVEL2',
        link: '/requests',
      });
    }
    await this.notifications.createMany(inputs);
  }
}
