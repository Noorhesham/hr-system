import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import {
  LeaveStatus,
  LoanStatus,
  PayrollCycleStatus,
  Prisma,
  RequestStatus,
} from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import { PageOptionsDto } from '../../common/pagination/page-options.dto';
import { getDefaultTz } from '../../common/constants/time.constant';
import {
  formatYmd,
  parseDateOnly,
} from '../../common/utils/attendance-time.util';

/**
 * Employee Self-Service — portal users only (`isPortalUser` + linked employeeId).
 */
@Injectable()
export class EssService {
  constructor(private readonly db: DatabaseService) {}

  async me(actor: AuthenticatedUser) {
    const employeeId = this.requireEmployeeId(actor);
    const employee = await this.db.employee.findFirst({
      where: { id: employeeId, companyId: actor.companyId },
      include: {
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            gracePeriodMinutes: true,
          },
        },
        company: { select: { id: true, name: true } },
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }
    return {
      user: {
        userId: actor.userId,
        email: actor.email,
        roleName: actor.roleName,
        isPortalUser: actor.isPortalUser,
      },
      employee,
    };
  }

  /** Employee homepage: today punch, month stats, latest payslip, recent items. */
  async home(actor: AuthenticatedUser) {
    const employeeId = this.requireEmployeeId(actor);
    const tz = getDefaultTz();
    const now = DateTime.now().setZone(tz);
    const todayYmd = now.toFormat('yyyy-MM-dd');
    const todayDate = parseDateOnly(todayYmd);
    const monthStart = parseDateOnly(now.startOf('month').toFormat('yyyy-MM-dd'));
    const monthEnd = parseDateOnly(now.endOf('month').toFormat('yyyy-MM-dd'));

    const [
      employee,
      today,
      monthRows,
      latestPayslip,
      pendingLeaves,
      pendingRequests,
      recentLeaves,
      recentRequests,
    ] = await Promise.all([
      this.db.employee.findFirst({
        where: { id: employeeId, companyId: actor.companyId },
        select: {
          id: true,
          name: true,
          department: true,
          position: true,
          photoUrl: true,
          shift: {
            select: { id: true, name: true, startTime: true, endTime: true },
          },
        },
      }),
      this.db.attendanceRecord.findFirst({
        where: { employeeId, date: todayDate },
        select: {
          status: true,
          checkIn: true,
          checkOut: true,
          delayMinutes: true,
        },
      }),
      this.db.attendanceRecord.findMany({
        where: {
          employeeId,
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { status: true, delayMinutes: true },
      }),
      this.db.payrollSlip.findFirst({
        where: {
          employeeId,
          payrollCycle: {
            status: {
              in: [PayrollCycleStatus.APPROVED, PayrollCycleStatus.CLOSED],
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          netSalary: true,
          basicSalary: true,
          payrollCycle: {
            select: { month: true, year: true, status: true },
          },
        },
      }),
      this.db.leaveRequest.count({
        where: { employeeId, status: LeaveStatus.PENDING },
      }),
      this.db.employeeRequest.count({
        where: {
          employeeId,
          status: { in: [RequestStatus.PENDING, RequestStatus.IN_REVIEW] },
        },
      }),
      this.db.leaveRequest.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          fromDate: true,
          toDate: true,
          status: true,
          reason: true,
        },
      }),
      this.db.employeeRequest.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          title: true,
          status: true,
          date: true,
        },
      }),
    ]);

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const month = {
      present: 0,
      late: 0,
      absent: 0,
      leave: 0,
    };
    for (const row of monthRows) {
      if (row.status === 'LEAVE') month.leave += 1;
      else if (row.status === 'ABSENT') month.absent += 1;
      else if (row.status === 'PRESENT' && row.delayMinutes > 0) month.late += 1;
      else if (row.status === 'PRESENT') month.present += 1;
    }

    return {
      employee,
      today: {
        date: todayYmd,
        status: today?.status ?? null,
        checkIn: today?.checkIn?.toISOString() ?? null,
        checkOut: today?.checkOut?.toISOString() ?? null,
        delayMinutes: today?.delayMinutes ?? 0,
      },
      month,
      latestPayslip: latestPayslip
        ? {
            id: latestPayslip.id,
            netSalary: latestPayslip.netSalary,
            basicSalary: latestPayslip.basicSalary,
            month: latestPayslip.payrollCycle.month,
            year: latestPayslip.payrollCycle.year,
          }
        : null,
      pendingLeaves,
      pendingRequests,
      recentLeaves: recentLeaves.map((l) => ({
        id: l.id,
        fromDate: formatYmd(l.fromDate),
        toDate: formatYmd(l.toDate),
        status: l.status,
        reason: l.reason,
      })),
      recentRequests: recentRequests.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        status: r.status,
        date: r.date ? formatYmd(r.date) : null,
      })),
    };
  }

  async mySalaryComponents(actor: AuthenticatedUser) {
    const employeeId = this.requireEmployeeId(actor);
    return this.db.salaryComponent.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myDocuments(actor: AuthenticatedUser) {
    const employeeId = this.requireEmployeeId(actor);
    return this.db.document.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myAttendance(actor: AuthenticatedUser, query: PageOptionsDto) {
    const employeeId = this.requireEmployeeId(actor);
    const where: Prisma.AttendanceRecordWhereInput = { employeeId };
    const [data, itemCount] = await Promise.all([
      this.db.attendanceRecord.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.db.attendanceRecord.count({ where }),
    ]);
    return new PageDto(
      data,
      new PageMetaDto({ pageOptionsDto: query, itemCount }),
    );
  }

  async myLoans(actor: AuthenticatedUser) {
    const employeeId = this.requireEmployeeId(actor);
    return this.db.loan.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      include: { installments: { orderBy: { dueDate: 'asc' } } },
    });
  }

  async requestLoan(actor: AuthenticatedUser, totalAmount: number) {
    const employeeId = this.requireEmployeeId(actor);
    const pending = await this.db.loan.findFirst({
      where: { employeeId, status: LoanStatus.PENDING },
      select: { id: true },
    });
    if (pending) {
      throw new ConflictException('You already have a pending loan request');
    }
    return this.db.loan.create({
      data: {
        employeeId,
        totalAmount: new Prisma.Decimal(totalAmount),
        status: LoanStatus.PENDING,
      },
      include: { installments: { orderBy: { dueDate: 'asc' } } },
    });
  }

  async myPayslips(actor: AuthenticatedUser, query: PageOptionsDto) {
    const employeeId = this.requireEmployeeId(actor);
    // Employees only see slips from APPROVED/CLOSED cycles (not drafts).
    const where: Prisma.PayrollSlipWhereInput = {
      employeeId,
      payrollCycle: {
        status: {
          in: [PayrollCycleStatus.APPROVED, PayrollCycleStatus.CLOSED],
        },
      },
    };
    const [data, itemCount] = await Promise.all([
      this.db.payrollSlip.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: {
          payrollCycle: {
            select: { id: true, month: true, year: true, status: true },
          },
        },
      }),
      this.db.payrollSlip.count({ where }),
    ]);
    return new PageDto(
      data,
      new PageMetaDto({ pageOptionsDto: query, itemCount }),
    );
  }

  async myPayslip(actor: AuthenticatedUser, slipId: string) {
    const employeeId = this.requireEmployeeId(actor);
    const slip = await this.db.payrollSlip.findFirst({
      where: {
        id: slipId,
        employeeId,
        payrollCycle: {
          status: {
            in: [PayrollCycleStatus.APPROVED, PayrollCycleStatus.CLOSED],
          },
        },
      },
      include: {
        payrollCycle: {
          select: { id: true, month: true, year: true, status: true },
        },
        employee: { select: { id: true, name: true } },
      },
    });
    if (!slip) {
      throw new NotFoundException('Payslip not found');
    }
    return slip;
  }

  private requireEmployeeId(actor: AuthenticatedUser): string {
    if (!actor.isPortalUser || !actor.employeeId) {
      throw new ForbiddenException(
        'ESS endpoints are for employee portal accounts only',
      );
    }
    return actor.employeeId;
  }
}
