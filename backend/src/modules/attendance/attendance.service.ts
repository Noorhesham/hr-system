import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import { getDefaultTz } from '../../common/constants/time.constant';
import {
  checkInOutsideShiftReason,
  computeAttendanceMetrics,
  formatYmd,
  normalizeToTenantDay,
  ShiftTimes,
} from '../../common/utils/attendance-time.util';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'date', 'checkIn'];

/** Per-row error inside bulk import (carries a machine code). */
class RowError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

@Injectable()
export class AttendanceService {
  constructor(private readonly db: DatabaseService) {}

  // ─── Check-in ──────────────────────────────────────────────────────────────
  async checkIn(actor: AuthenticatedUser, companyId: string, dto: CheckInDto) {
    const employeeId = this.resolvePunchTarget(actor, dto.employeeId);
    const emp = await this.assertEmployeeInCompany(companyId, employeeId);
    if (!emp.isActive) {
      throw new UnprocessableEntityException('Employee is not active');
    }
    const tz = getDefaultTz();
    const at = dto.at ? new Date(dto.at) : new Date();
    const day = normalizeToTenantDay(at, tz);
    const shiftId = await this.requireShiftId(companyId, dto.shiftId, emp.shiftId);
    const shift = await this.loadShift(companyId, shiftId);
    const outside = checkInOutsideShiftReason(at, day, shift, tz);
    if (outside) {
      throw new BadRequestException(outside);
    }

    return this.db.$transaction(async (tx) => {
      const existing = await tx.attendanceRecord.findUnique({
        where: { employeeId_date: { employeeId, date: day } },
      });
      if (existing?.checkIn) {
        throw new ConflictException('Already checked in for this day');
      }
      if (
        existing &&
        (existing.status === AttendanceStatus.ABSENT ||
          existing.status === AttendanceStatus.LEAVE)
      ) {
        throw new ConflictException(
          `Day is marked ${existing.status}; clear it before check-in`,
        );
      }
      const metrics = computeAttendanceMetrics(
        { date: day, checkIn: at, checkOut: existing?.checkOut ?? null },
        shift,
        tz,
      );
      const rec = await tx.attendanceRecord.upsert({
        where: { employeeId_date: { employeeId, date: day } },
        create: {
          employeeId,
          date: day,
          shiftId,
          checkIn: at,
          status: AttendanceStatus.PRESENT,
          delayMinutes: metrics.delayMinutes,
          overtimeHours: metrics.overtimeHours,
        },
        update: {
          checkIn: at,
          status: AttendanceStatus.PRESENT,
          shiftId,
          delayMinutes: metrics.delayMinutes,
          overtimeHours: metrics.overtimeHours,
        },
      });
      return this.serialize(rec);
    });
  }

  // ─── Check-out ─────────────────────────────────────────────────────────────
  // Finds the most recent OPEN record (checkIn set, checkOut null) — robust for
  // overnight shifts whose check-out lands on the next calendar day.
  async checkOut(actor: AuthenticatedUser, companyId: string, dto: CheckOutDto) {
    const employeeId = this.resolvePunchTarget(actor, dto.employeeId);
    await this.assertEmployeeInCompany(companyId, employeeId);
    const tz = getDefaultTz();
    const at = dto.at ? new Date(dto.at) : new Date();

    return this.db.$transaction(async (tx) => {
      const open = await tx.attendanceRecord.findFirst({
        where: { employeeId, checkIn: { not: null }, checkOut: null },
        orderBy: { checkIn: 'desc' },
      });
      if (!open || !open.checkIn) {
        throw new ConflictException('No open check-in to check out from');
      }
      if (at.getTime() < open.checkIn.getTime()) {
        throw new BadRequestException('checkOut cannot precede checkIn');
      }
      const shift = open.shiftId ? await this.loadShift(companyId, open.shiftId) : null;
      const metrics = computeAttendanceMetrics(
        { date: open.date, checkIn: open.checkIn, checkOut: at },
        shift,
        tz,
      );
      const rec = await tx.attendanceRecord.update({
        where: { id: open.id },
        data: {
          checkOut: at,
          status: AttendanceStatus.PRESENT,
          delayMinutes: metrics.delayMinutes,
          overtimeHours: metrics.overtimeHours,
        },
      });
      return this.serialize(rec);
    });
  }

  // ─── Manual upsert (admin) ───────────────────────────────────────────────────
  async upsert(companyId: string, dto: UpsertAttendanceDto) {
    const emp = await this.assertEmployeeInCompany(companyId, dto.employeeId);
    const tz = getDefaultTz();
    const day = normalizeToTenantDay(new Date(dto.date), tz);
    this.assertStatusConsistency(dto.status, dto.checkIn, dto.checkOut);

    const status = dto.status ?? AttendanceStatus.PRESENT;
    const needsShift =
      status === AttendanceStatus.PRESENT && (!!dto.checkIn || !!dto.checkOut);
    const shiftId = needsShift
      ? await this.requireShiftId(companyId, dto.shiftId, emp.shiftId)
      : await this.resolveShiftId(companyId, dto.shiftId, emp.shiftId);
    const shift = shiftId ? await this.loadShift(companyId, shiftId) : null;
    const checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
    const checkOut = dto.checkOut ? new Date(dto.checkOut) : null;
    if (checkIn && checkOut && checkOut.getTime() < checkIn.getTime()) {
      throw new BadRequestException('checkOut cannot precede checkIn');
    }

    const { delayMinutes, overtimeHours } = this.resolveMetrics(dto, day, checkIn, checkOut, shift, tz);

    const rec = await this.db.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: dto.employeeId, date: day } },
      create: {
        employeeId: dto.employeeId,
        date: day,
        shiftId,
        checkIn,
        checkOut,
        status,
        delayMinutes,
        overtimeHours,
      },
      update: { shiftId, checkIn, checkOut, status, delayMinutes, overtimeHours },
    });
    return this.serialize(rec);
  }

  // ─── PATCH ───────────────────────────────────────────────────────────────────
  async update(companyId: string, id: string, dto: UpdateAttendanceDto) {
    const existing = await this.getOwnedOrThrow(companyId, id);
    const tz = getDefaultTz();

    const checkIn = dto.checkIn !== undefined ? new Date(dto.checkIn) : existing.checkIn;
    const checkOut =
      dto.checkOut !== undefined ? new Date(dto.checkOut) : existing.checkOut;
    const shiftId = dto.shiftId !== undefined ? dto.shiftId : existing.shiftId;
    const status = dto.status ?? existing.status;

    this.assertStatusConsistency(status, checkIn, checkOut);
    if (checkIn && checkOut && checkOut.getTime() < checkIn.getTime()) {
      throw new BadRequestException('checkOut cannot precede checkIn');
    }
    const shift = shiftId ? await this.loadShift(companyId, shiftId) : null;
    const { delayMinutes, overtimeHours } = this.resolveMetrics(
      dto,
      existing.date,
      checkIn,
      checkOut,
      shift,
      tz,
    );

    const rec = await this.db.attendanceRecord.update({
      where: { id },
      data: { shiftId, checkIn, checkOut, status, delayMinutes, overtimeHours },
    });
    return this.serialize(rec);
  }

  // ─── Reads ───────────────────────────────────────────────────────────────────
  async findAll(
    actor: AuthenticatedUser,
    companyId: string,
    query: QueryAttendanceDto,
  ) {
    const tz = getDefaultTz();
    // Portal users may only see their own attendance history.
    const scopedEmployeeId = actor.isPortalUser
      ? actor.employeeId
      : query.employeeId;
    if (actor.isPortalUser && !scopedEmployeeId) {
      throw new ForbiddenException('Portal account is not linked to an employee');
    }

    const where: Prisma.AttendanceRecordWhereInput = {
      employee: { companyId },
      ...(scopedEmployeeId ? { employeeId: scopedEmployeeId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            date: {
              ...(query.dateFrom
                ? { gte: normalizeToTenantDay(new Date(query.dateFrom), tz) }
                : {}),
              ...(query.dateTo
                ? { lte: normalizeToTenantDay(new Date(query.dateTo), tz) }
                : {}),
            },
          }
        : {}),
    };
    const orderBy = SORTABLE.includes(query.orderBy) ? query.orderBy : 'date';

    const [data, itemCount] = await Promise.all([
      this.db.attendanceRecord.findMany({
        where,
        orderBy: { [orderBy]: query.prismaOrder },
        skip: query.skip,
        take: query.limit,
        include: { employee: { select: { id: true, name: true } } },
      }),
      this.db.attendanceRecord.count({ where }),
    ]);

    return new PageDto(
      data.map((r) => this.serialize(r)),
      new PageMetaDto({ pageOptionsDto: query, itemCount }),
    );
  }

  async findOne(actor: AuthenticatedUser, companyId: string, id: string) {
    const rec = await this.db.attendanceRecord.findFirst({
      where: {
        id,
        employee: { companyId },
        ...(actor.isPortalUser && actor.employeeId
          ? { employeeId: actor.employeeId }
          : {}),
      },
      include: { employee: { select: { id: true, name: true } } },
    });
    if (!rec) {
      throw new NotFoundException('Attendance record not found');
    }
    return this.serialize(rec);
  }

  // ─── Bulk import (per-row isolation, aggregate report) ────────────────────────
  async bulkUpsert(companyId: string, dto: BulkAttendanceDto) {
    const tz = getDefaultTz();
    const empIds = [...new Set(dto.records.map((r) => r.employeeId))];
    const shiftIds = [
      ...new Set(dto.records.filter((r) => r.shiftId).map((r) => r.shiftId!)),
    ];

    const emps = await this.db.employee.findMany({
      where: { id: { in: empIds }, companyId },
      select: { id: true, shiftId: true, isActive: true },
    });
    const empMap = new Map(emps.map((e) => [e.id, e]));
    const shifts = await this.db.shift.findMany({
      where: { id: { in: shiftIds }, companyId },
      select: { id: true, startTime: true, endTime: true, gracePeriodMinutes: true },
    });
    const shiftMap = new Map(shifts.map((s) => [s.id, s]));

    const seen = new Set<string>();
    const results: Array<{
      index: number;
      employeeId: string;
      date?: string;
      status: 'OK' | 'ERROR';
      code?: string;
      message?: string;
    }> = [];

    for (let i = 0; i < dto.records.length; i++) {
      const r = dto.records[i];
      try {
        const emp = empMap.get(r.employeeId);
        if (!emp) throw new RowError('EMPLOYEE_NOT_FOUND', 'Employee not found');
        const day = normalizeToTenantDay(new Date(r.date), tz);
        const key = `${r.employeeId}|${day.toISOString()}`;
        if (seen.has(key)) {
          throw new RowError('DUPLICATE_IN_BATCH', 'Duplicate (employee,date) in batch');
        }
        seen.add(key);
        if (r.shiftId && !shiftMap.has(r.shiftId)) {
          throw new RowError('SHIFT_NOT_FOUND', 'Shift not found in your company');
        }
        this.assertStatusConsistency(r.status, r.checkIn, r.checkOut);

        const shiftId = r.shiftId ?? emp.shiftId ?? null;
        const shift: ShiftTimes | null = shiftId
          ? shiftMap.get(shiftId) ?? null
          : null;
        const checkIn = r.checkIn ? new Date(r.checkIn) : null;
        const checkOut = r.checkOut ? new Date(r.checkOut) : null;
        const { delayMinutes, overtimeHours } = this.resolveMetrics(
          r,
          day,
          checkIn,
          checkOut,
          shift,
          tz,
        );
        const status = r.status ?? AttendanceStatus.PRESENT;

        await this.db.attendanceRecord.upsert({
          where: { employeeId_date: { employeeId: r.employeeId, date: day } },
          create: {
            employeeId: r.employeeId,
            date: day,
            shiftId,
            checkIn,
            checkOut,
            status,
            delayMinutes,
            overtimeHours,
          },
          update: { shiftId, checkIn, checkOut, status, delayMinutes, overtimeHours },
        });
        results.push({ index: i, employeeId: r.employeeId, date: formatYmd(day), status: 'OK' });
      } catch (e) {
        results.push({
          index: i,
          employeeId: r.employeeId,
          status: 'ERROR',
          code: e instanceof RowError ? e.code : 'ERROR',
          message: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    const succeeded = results.filter((r) => r.status === 'OK').length;
    const failed = results.length - succeeded;
    const report = { total: results.length, succeeded, failed, results };
    if (succeeded === 0) {
      // Whole batch failed → signal wrong file/company/mapping.
      throw new UnprocessableEntityException(report);
    }
    return report;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  private resolveMetrics(
    src: { delayMinutes?: number; overtimeHours?: number },
    date: Date,
    checkIn: Date | null,
    checkOut: Date | null,
    shift: ShiftTimes | null,
    tz: string,
  ): { delayMinutes: number; overtimeHours: Prisma.Decimal } {
    const derived = computeAttendanceMetrics({ date, checkIn, checkOut }, shift, tz);
    return {
      delayMinutes: src.delayMinutes ?? derived.delayMinutes,
      overtimeHours:
        src.overtimeHours !== undefined
          ? new Prisma.Decimal(src.overtimeHours)
          : derived.overtimeHours,
    };
  }

  private assertStatusConsistency(
    status: AttendanceStatus | undefined,
    checkIn: unknown,
    checkOut: unknown,
  ) {
    if (
      (status === AttendanceStatus.ABSENT || status === AttendanceStatus.LEAVE) &&
      (checkIn || checkOut)
    ) {
      throw new UnprocessableEntityException(
        'ABSENT/LEAVE records cannot have check-in/check-out times',
      );
    }
  }

  private async assertEmployeeInCompany(companyId: string, employeeId: string) {
    const emp = await this.db.employee.findFirst({
      where: { id: employeeId, companyId },
      select: { id: true, isActive: true, shiftId: true },
    });
    if (!emp) {
      throw new NotFoundException('Employee not found');
    }
    return emp;
  }

  private async loadShift(companyId: string, shiftId: string): Promise<ShiftTimes> {
    const shift = await this.db.shift.findFirst({
      where: { id: shiftId, companyId },
      select: { startTime: true, endTime: true, gracePeriodMinutes: true },
    });
    if (!shift) {
      throw new BadRequestException('Shift not found in your company');
    }
    return shift;
  }

  /**
   * Who is being punched?
   * - Portal employee → always self (body employeeId must match or be omitted).
   * - Company Owner → must pass employeeId explicitly.
   */
  private resolvePunchTarget(
    actor: AuthenticatedUser,
    requestedEmployeeId?: string,
  ): string {
    if (actor.isPortalUser) {
      if (!actor.employeeId) {
        throw new ForbiddenException(
          'Portal account is not linked to an employee',
        );
      }
      if (
        requestedEmployeeId &&
        requestedEmployeeId !== actor.employeeId
      ) {
        throw new ForbiddenException(
          'Employees can only check in/out for themselves',
        );
      }
      return actor.employeeId;
    }
    if (!requestedEmployeeId) {
      throw new BadRequestException(
        'employeeId is required when punching as Company Owner',
      );
    }
    return requestedEmployeeId;
  }

  /** Live punch always needs a shift (employee default or per-request override). */
  private async requireShiftId(
    companyId: string,
    dtoShiftId: string | undefined,
    employeeShiftId: string | null,
  ): Promise<string> {
    const shiftId = await this.resolveShiftId(
      companyId,
      dtoShiftId,
      employeeShiftId,
    );
    if (!shiftId) {
      throw new BadRequestException(
        'Employee has no shift assigned. Create a shift (POST /shifts), then assign it with PATCH /employees/:id { "shiftId": "..." } before check-in.',
      );
    }
    return shiftId;
  }

  /** undefined → employee default; a string → validated tenant shift. */
  private async resolveShiftId(
    companyId: string,
    dtoShiftId: string | undefined,
    employeeShiftId: string | null,
  ): Promise<string | null> {
    if (dtoShiftId === undefined) {
      return employeeShiftId ?? null;
    }
    await this.loadShift(companyId, dtoShiftId);
    return dtoShiftId;
  }

  private async getOwnedOrThrow(companyId: string, id: string) {
    const rec = await this.db.attendanceRecord.findFirst({
      where: { id, employee: { companyId } },
    });
    if (!rec) {
      throw new NotFoundException('Attendance record not found');
    }
    return rec;
  }

  /** Serialize `date` (@db.Date) as a tz-stable "YYYY-MM-DD" string for clients. */
  private serialize<T extends { date: Date }>(rec: T): T & { date: string } {
    return { ...rec, date: formatYmd(rec.date) };
  }
}
