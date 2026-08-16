import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, LeaveStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { HashingService } from '../../core/hashing/hashing.service';
import { LimitsService } from '../platform/limits.service';
import { EMPLOYEE_ROLE, COMPANY_OWNER_ROLE } from '../../common/constants/roles.constant';
import { PageDto } from '../../common/pagination/page.dto';
import { PageMetaDto } from '../../common/pagination/page-meta.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { BenefitsSyncService } from '../company/benefits-sync.service';
import {
  formatYmd,
  inclusiveDayCount,
} from '../../common/utils/attendance-time.util';

/** Columns a client may sort by (guards against arbitrary orderBy). */
const SORTABLE = [
  'createdAt',
  'updatedAt',
  'name',
  'basicSalary',
  'department',
];

/** Stable display code from UUID (e.g. EMP-4821). */
function employeeCodeFromId(id: string): string {
  const hex = id.replace(/-/g, '').slice(-4);
  const n = (parseInt(hex, 16) % 9000) + 1000;
  return `EMP-${n}`;
}

@Injectable()
export class EmployeeService {
  constructor(
    private readonly db: DatabaseService,
    private readonly hashing: HashingService,
    private readonly limits: LimitsService,
    private readonly benefitsSync: BenefitsSyncService,
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

    // 3. Tenant-owned shift + manager + department (same company).
    if (dto.shiftId) {
      await this.assertShiftInCompany(companyId, dto.shiftId);
    }
    if (dto.managerId) {
      const manager = await this.db.employee.findFirst({
        where: { id: dto.managerId, companyId },
        select: { id: true },
      });
      if (!manager) {
        throw new BadRequestException('Manager not found in your company');
      }
    }
    const dept = await this.resolveDepartment(companyId, dto.departmentId, dto.department);

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
          phone: dto.phone ?? null,
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
          isGosiRegistered: dto.isGosiRegistered ?? false,
          gosiNumber: dto.gosiNumber,
          departmentId: dept?.id ?? null,
          department: dept?.name ?? null,
          position: dto.position,
          managerId: dto.managerId ?? null,
          jobRank: dto.jobRank,
          workLocation: dto.workLocation,
          contractDurationYears:
            dto.contractDurationYears != null
              ? new Prisma.Decimal(dto.contractDurationYears)
              : undefined,
          photoUrl: dto.photoUrl,
          nationalId: dto.nationalId,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          gender: dto.gender,
          maritalStatus: dto.maritalStatus,
          address: dto.address,
          emergencyContactName: dto.emergencyContactName,
          emergencyContactRelation: dto.emergencyContactRelation,
          emergencyContactPhone: dto.emergencyContactPhone,
          subDepartment: dto.subDepartment,
          hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
          probationDays: dto.probationDays,
          bankName: dto.bankName,
          iban: dto.iban,
          hasHealthInsurance: dto.hasHealthInsurance ?? false,
          hasTransportAllowance: dto.hasTransportAllowance ?? false,
          hasHousingAllowance: dto.hasHousingAllowance ?? false,
          hasMealAllowance: dto.hasMealAllowance ?? false,
        },
      });
    });

    // Apply company default allowances (housing / transport / annual tickets).
    await this.benefitsSync.syncEmployeeBenefits(companyId, [employee.id]);

    return {
      ...(await this.findOne(companyId, employee.id)),
      // Surfaced ONCE so the admin can hand it to the employee.
      portalCredentials: { email: dto.email, temporaryPassword },
    };
  }

  /**
   * Bulk-create employees from a CSV buffer.
   * Expected header: name,email,basicSalary[,employmentType,salaryBasis,isGosiRegistered,gosiNumber]
   */
  async importFromCsv(companyId: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('CSV file is required');
    }
    const text = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      throw new BadRequestException(
        'CSV must include a header and at least one row',
      );
    }

    const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
    const required = ['name', 'email', 'basicsalary'];
    for (const col of required) {
      if (!header.includes(col)) {
        throw new BadRequestException(
          `CSV header must include: name,email,basicSalary (missing "${col}")`,
        );
      }
    }

    const created: Array<{
      id: string;
      name: string;
      email: string;
      temporaryPassword?: string;
    }> = [];
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]!);
      const row: Record<string, string> = {};
      header.forEach((h, idx) => {
        row[h] = (cols[idx] ?? '').trim();
      });

      const name = row.name ?? '';
      const email = (row.email ?? '').toLowerCase();
      const basicSalary = Number(row.basicsalary);
      if (!name || !email || Number.isNaN(basicSalary)) {
        errors.push({
          row: i + 1,
          message: 'name, email and basicSalary are required',
        });
        continue;
      }

      try {
        const emp = await this.create(companyId, {
          name,
          email,
          basicSalary,
          employmentType: (row.employmenttype as any) || undefined,
          salaryBasis: (row.salarybasis as any) || undefined,
          isGosiRegistered:
            row.isgosiregistered === 'true' || row.isgosiregistered === '1',
          gosiNumber: row.gosinumber || undefined,
        });
        created.push({
          id: emp.id,
          name: emp.name,
          email,
          temporaryPassword: emp.portalCredentials.temporaryPassword,
        });
      } catch (e: any) {
        errors.push({
          row: i + 1,
          message: e?.message || 'Failed to create employee',
        });
      }
    }

    return {
      createdCount: created.length,
      errorCount: errors.length,
      created,
      errors,
    };
  }

  async findAll(companyId: string, query: QueryEmployeesDto) {
    const search = query.search?.trim();
    const today = new Date();
    const todayUtc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );

    const where: Prisma.EmployeeWhereInput = {
      companyId,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.department && !query.departmentId
        ? { department: query.department }
        : {}),
    };

    if (query.managersOnly) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { jobRank: { in: ['TEAM_LEAD', 'DEPARTMENT_MANAGER'] } },
            { user: { role: { name: COMPANY_OWNER_ROLE } } },
            { directReports: { some: {} } },
          ],
        },
      ];
    }

    if (query.accountStatus === 'INACTIVE') {
      where.isActive = false;
    } else if (query.accountStatus === 'ACTIVE') {
      where.isActive = true;
      where.leaveRequests = {
        none: {
          status: LeaveStatus.APPROVED,
          fromDate: { lte: todayUtc },
          toDate: { gte: todayUtc },
        },
      };
    } else if (query.accountStatus === 'ON_LEAVE') {
      where.isActive = true;
      where.leaveRequests = {
        some: {
          status: LeaveStatus.APPROVED,
          fromDate: { lte: todayUtc },
          toDate: { gte: todayUtc },
        },
      };
    } else if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const orderBy = SORTABLE.includes(query.orderBy)
      ? query.orderBy
      : 'createdAt';

    const [rows, itemCount] = await Promise.all([
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
          user: { select: { email: true } },
          leaveRequests: {
            where: {
              status: LeaveStatus.APPROVED,
              fromDate: { lte: todayUtc },
              toDate: { gte: todayUtc },
            },
            take: 1,
            select: { id: true },
          },
        },
      }),
      this.db.employee.count({ where }),
    ]);

    const data = rows.map((e) => {
      const onLeave = e.leaveRequests.length > 0;
      const accountStatus = !e.isActive
        ? ('INACTIVE' as const)
        : onLeave
          ? ('ON_LEAVE' as const)
          : ('ACTIVE' as const);
      const { leaveRequests: _lr, ...rest } = e;
      return {
        ...rest,
        employeeCode: employeeCodeFromId(e.id),
        email: e.user?.email ?? null,
        accountStatus,
        onLeave,
      };
    });

    return new PageDto(
      data,
      new PageMetaDto({ pageOptionsDto: query, itemCount }),
    );
  }

  /** Departments for UI filters — prefers Department table with employee counts. */
  async listDepartments(companyId: string) {
    const rows = await this.db.department.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { employees: true } },
      },
    });
    return rows.map((d) => ({
      id: d.id,
      department: d.name,
      count: d._count.employees,
    }));
  }

  async findOne(companyId: string, id: string) {
    const today = new Date();
    const todayUtc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );

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
        user: { select: { email: true, phone: true } },
        manager: { select: { id: true, name: true } },
        leaveRequests: {
          where: {
            status: LeaveStatus.APPROVED,
            fromDate: { lte: todayUtc },
            toDate: { gte: todayUtc },
          },
          take: 1,
          select: { id: true },
        },
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const onLeave = employee.leaveRequests.length > 0;
    const accountStatus = !employee.isActive
      ? ('INACTIVE' as const)
      : onLeave
        ? ('ON_LEAVE' as const)
        : ('ACTIVE' as const);

    return {
      id: employee.id,
      companyId: employee.companyId,
      userId: employee.userId,
      name: employee.name,
      employmentType: employee.employmentType,
      salaryBasis: employee.salaryBasis,
      basicSalary: employee.basicSalary,
      isGosiRegistered: employee.isGosiRegistered,
      gosiNumber: employee.gosiNumber,
      shiftId: employee.shiftId,
      isActive: employee.isActive,
      departmentId: employee.departmentId,
      department: employee.department,
      position: employee.position,
      jobRank: employee.jobRank,
      workLocation: employee.workLocation,
      photoUrl: employee.photoUrl,
      nationalId: employee.nationalId,
      dateOfBirth: employee.dateOfBirth?.toISOString() ?? null,
      gender: employee.gender,
      maritalStatus: employee.maritalStatus,
      address: employee.address,
      emergencyContactName: employee.emergencyContactName,
      emergencyContactRelation: employee.emergencyContactRelation,
      emergencyContactPhone: employee.emergencyContactPhone,
      subDepartment: employee.subDepartment,
      hireDate: employee.hireDate?.toISOString() ?? null,
      probationDays: employee.probationDays,
      bankName: employee.bankName,
      iban: employee.iban,
      hasHealthInsurance: employee.hasHealthInsurance,
      hasTransportAllowance: employee.hasTransportAllowance,
      hasHousingAllowance: employee.hasHousingAllowance,
      hasMealAllowance: employee.hasMealAllowance,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      shift: employee.shift,
      employeeCode: employeeCodeFromId(employee.id),
      email: employee.user?.email ?? null,
      phone: employee.user?.phone ?? null,
      managerId: employee.manager?.id ?? null,
      managerName: employee.manager?.name ?? null,
      contractDurationYears: employee.contractDurationYears?.toNumber() ?? null,
      accountStatus,
      onLeave,
    };
  }

  async remove(companyId: string, id: string) {
    await this.assertEmployeeInCompany(companyId, id);
    await this.db.employee.delete({ where: { id } });
    return { success: true as const };
  }

  async bulkRemove(companyId: string, ids: string[]) {
    const unique = [...new Set(ids)];
    const result = await this.db.employee.deleteMany({
      where: { companyId, id: { in: unique } },
    });
    return { deleted: result.count };
  }

  async listPayrollSlips(companyId: string, employeeId: string) {
    await this.assertEmployeeInCompany(companyId, employeeId);
    const slips = await this.db.payrollSlip.findMany({
      where: {
        employeeId,
        payrollCycle: { companyId },
      },
      include: {
        payrollCycle: {
          select: { id: true, month: true, year: true, status: true },
        },
      },
      orderBy: [
        { payrollCycle: { year: 'desc' } },
        { payrollCycle: { month: 'desc' } },
      ],
    });

    return slips.map((s) => {
      const basic = s.basicSalary.toNumber();
      const allowances = s.totalAllowances.toNumber();
      const overtime = s.overtimeBonus.toNumber();
      const deductions =
        s.totalDeductions.toNumber() + s.loanDeductions.toNumber();
      const gross = basic + allowances + overtime;
      return {
        id: s.id,
        month: s.payrollCycle.month,
        year: s.payrollCycle.year,
        cycleStatus: s.payrollCycle.status,
        basicSalary: basic,
        totalAllowances: allowances,
        overtimeBonus: overtime,
        totalDeductions: deductions,
        gross,
        netSalary: s.netSalary.toNumber(),
        paidAt: s.createdAt.toISOString(),
      };
    });
  }

  async listLeaves(companyId: string, employeeId: string) {
    await this.assertEmployeeInCompany(companyId, employeeId);
    const leaves = await this.db.leaveRequest.findMany({
      where: { employeeId, employee: { companyId } },
      orderBy: { fromDate: 'desc' },
    });

    return leaves.map((l) => ({
      id: l.id,
      type: l.reason?.trim() || 'إجازة',
      fromDate: formatYmd(l.fromDate),
      toDate: formatYmd(l.toDate),
      days: inclusiveDayCount(l.fromDate, l.toDate),
      status: l.status,
      reason: l.reason,
    }));
  }

  async listAttendance(
    companyId: string,
    employeeId: string,
    query: {
      page: number;
      limit: number;
      skip: number;
      from?: string;
      to?: string;
      prismaOrder: 'asc' | 'desc';
    },
  ) {
    await this.assertEmployeeInCompany(companyId, employeeId);

    const where: Prisma.AttendanceRecordWhereInput = {
      employeeId,
      employee: { companyId },
    };
    if (query.from || query.to) {
      where.date = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [rows, itemCount] = await Promise.all([
      this.db.attendanceRecord.findMany({
        where,
        orderBy: { date: query.prismaOrder },
        skip: query.skip,
        take: query.limit,
      }),
      this.db.attendanceRecord.count({ where }),
    ]);

    const data = rows.map((r) => {
      let workHours: string | null = null;
      if (r.checkIn && r.checkOut) {
        const mins = Math.max(
          0,
          Math.round((r.checkOut.getTime() - r.checkIn.getTime()) / 60000),
        );
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        workHours = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
      return {
        id: r.id,
        date: r.date.toISOString(),
        status: r.status,
        checkIn: r.checkIn?.toISOString() ?? null,
        checkOut: r.checkOut?.toISOString() ?? null,
        delayMinutes: r.delayMinutes,
        overtimeHours: r.overtimeHours.toNumber(),
        workHours,
        isLate: r.delayMinutes > 0,
      };
    });

    // Summary over the same date filter (not just current page).
    const allForSummary = await this.db.attendanceRecord.findMany({
      where,
      select: { status: true, delayMinutes: true },
    });
    const summary = {
      // On-time present only — late is a separate KPI card.
      present: allForSummary.filter(
        (a) => a.status === 'PRESENT' && a.delayMinutes === 0,
      ).length,
      late: allForSummary.filter(
        (a) => a.status === 'PRESENT' && a.delayMinutes > 0,
      ).length,
      absent: allForSummary.filter((a) => a.status === 'ABSENT').length,
      leave: allForSummary.filter((a) => a.status === 'LEAVE').length,
      remote: 0,
    };

    return {
      data,
      summary,
      meta: new PageMetaDto({
        pageOptionsDto: {
          page: query.page,
          limit: query.limit,
        } as any,
        itemCount,
      }),
    };
  }

  async update(companyId: string, id: string, dto: UpdateEmployeeDto) {
    const existing = await this.db.employee.findFirst({
      where: { id, companyId },
      select: { id: true, userId: true },
    });
    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    if (dto.shiftId) {
      await this.assertShiftInCompany(companyId, dto.shiftId);
    }

    if (dto.managerId !== undefined && dto.managerId !== null) {
      if (dto.managerId === id) {
        throw new BadRequestException('Employee cannot be their own manager');
      }
      const manager = await this.db.employee.findFirst({
        where: { id: dto.managerId, companyId },
        select: { id: true },
      });
      if (!manager) {
        throw new BadRequestException('Manager not found in your company');
      }
    }

    const {
      phone,
      managerId,
      contractDurationYears,
      departmentId,
      department,
      ...employeeFields
    } = dto;

    let deptPatch: { departmentId: string | null; department: string | null } | undefined;
    if (departmentId !== undefined || department !== undefined) {
      if (departmentId === null) {
        deptPatch = { departmentId: null, department: null };
      } else {
        const dept = await this.resolveDepartment(
          companyId,
          departmentId ?? undefined,
          department,
        );
        deptPatch = {
          departmentId: dept?.id ?? null,
          department: dept?.name ?? null,
        };
      }
    }

    await this.db.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: {
          ...employeeFields,
          ...(deptPatch ?? {}),
          ...(managerId !== undefined
            ? { managerId: managerId === null ? null : managerId }
            : {}),
          ...(contractDurationYears !== undefined
            ? {
                contractDurationYears:
                  contractDurationYears === null
                    ? null
                    : new Prisma.Decimal(contractDurationYears),
              }
            : {}),
        },
      });

      if (phone !== undefined && existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { phone: phone === null || phone === '' ? null : phone },
        });
      }
    });

    return this.findOne(companyId, id);
  }

  private async assertEmployeeInCompany(companyId: string, id: string) {
    const emp = await this.db.employee.findFirst({
      where: { id, companyId },
      select: { id: true },
    });
    if (!emp) {
      throw new NotFoundException('Employee not found');
    }
    return emp;
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

  /** Resolve department by id (preferred) or exact name within the tenant. */
  private async resolveDepartment(
    companyId: string,
    departmentId?: string,
    departmentName?: string,
  ): Promise<{ id: string; name: string } | null> {
    if (departmentId) {
      const row = await this.db.department.findFirst({
        where: { id: departmentId, companyId },
        select: { id: true, name: true },
      });
      if (!row) {
        throw new BadRequestException('Department not found in your company');
      }
      return row;
    }
    const name = departmentName?.trim();
    if (!name) return null;
    const row = await this.db.department.findFirst({
      where: { companyId, name },
      select: { id: true, name: true },
    });
    if (!row) {
      throw new BadRequestException(
        'Department not found — create it under الأقسام first',
      );
    }
    return row;
  }
}

/** URL-safe random ~12-char temporary password. */
function generateTempPassword(): string {
  return crypto.randomBytes(9).toString('base64url');
}

/** Minimal CSV line splitter that respects double-quoted fields. */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
