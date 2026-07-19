import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PayrollCycleStatus, Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import { PageOptionsDto } from '../../common/pagination/page-options.dto';

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
