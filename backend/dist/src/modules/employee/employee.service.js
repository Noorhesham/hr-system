"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const database_service_1 = require("../../database/database.service");
const hashing_service_1 = require("../../core/hashing/hashing.service");
const limits_service_1 = require("../platform/limits.service");
const roles_constant_1 = require("../../common/constants/roles.constant");
const page_dto_1 = require("../../common/pagination/page.dto");
const page_meta_dto_1 = require("../../common/pagination/page-meta.dto");
const benefits_sync_service_1 = require("../company/benefits-sync.service");
const attendance_time_util_1 = require("../../common/utils/attendance-time.util");
const SORTABLE = [
    'createdAt',
    'updatedAt',
    'name',
    'basicSalary',
    'department',
];
function employeeCodeFromId(id) {
    const hex = id.replace(/-/g, '').slice(-4);
    const n = (parseInt(hex, 16) % 9000) + 1000;
    return `EMP-${n}`;
}
let EmployeeService = class EmployeeService {
    db;
    hashing;
    limits;
    benefitsSync;
    constructor(db, hashing, limits, benefitsSync) {
        this.db = db;
        this.hashing = hashing;
        this.limits = limits;
        this.benefitsSync = benefitsSync;
    }
    async create(companyId, dto) {
        await this.limits.assertCanAddEmployee(companyId);
        const existing = await this.db.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException('Email is already registered');
        }
        if (dto.shiftId) {
            await this.assertShiftInCompany(companyId, dto.shiftId);
        }
        if (dto.managerId) {
            const manager = await this.db.employee.findFirst({
                where: { id: dto.managerId, companyId },
                select: { id: true },
            });
            if (!manager) {
                throw new common_1.BadRequestException('Manager not found in your company');
            }
        }
        const dept = await this.resolveDepartment(companyId, dto.departmentId, dto.department);
        const temporaryPassword = generateTempPassword();
        const passwordHash = await this.hashing.hash(temporaryPassword);
        const employee = await this.db.$transaction(async (tx) => {
            const role = await tx.role.upsert({
                where: { companyId_name: { companyId, name: roles_constant_1.EMPLOYEE_ROLE } },
                create: { companyId, name: roles_constant_1.EMPLOYEE_ROLE },
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
                    contractDurationYears: dto.contractDurationYears != null
                        ? new client_1.Prisma.Decimal(dto.contractDurationYears)
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
        await this.benefitsSync.syncEmployeeBenefits(companyId, [employee.id]);
        return {
            ...(await this.findOne(companyId, employee.id)),
            portalCredentials: { email: dto.email, temporaryPassword },
        };
    }
    async importFromCsv(companyId, file) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('CSV file is required');
        }
        const text = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
        const lines = text
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
        if (lines.length < 2) {
            throw new common_1.BadRequestException('CSV must include a header and at least one row');
        }
        const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
        const required = ['name', 'email', 'basicsalary'];
        for (const col of required) {
            if (!header.includes(col)) {
                throw new common_1.BadRequestException(`CSV header must include: name,email,basicSalary (missing "${col}")`);
            }
        }
        const created = [];
        const errors = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = splitCsvLine(lines[i]);
            const row = {};
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
                    employmentType: row.employmenttype || undefined,
                    salaryBasis: row.salarybasis || undefined,
                    isGosiRegistered: row.isgosiregistered === 'true' || row.isgosiregistered === '1',
                    gosiNumber: row.gosinumber || undefined,
                });
                created.push({
                    id: emp.id,
                    name: emp.name,
                    email,
                    temporaryPassword: emp.portalCredentials.temporaryPassword,
                });
            }
            catch (e) {
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
    async findAll(companyId, query) {
        const search = query.search?.trim();
        const today = new Date();
        const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        const where = {
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
                        { user: { role: { name: roles_constant_1.COMPANY_OWNER_ROLE } } },
                        { directReports: { some: {} } },
                    ],
                },
            ];
        }
        if (query.accountStatus === 'INACTIVE') {
            where.isActive = false;
        }
        else if (query.accountStatus === 'ACTIVE') {
            where.isActive = true;
            where.leaveRequests = {
                none: {
                    status: client_1.LeaveStatus.APPROVED,
                    fromDate: { lte: todayUtc },
                    toDate: { gte: todayUtc },
                },
            };
        }
        else if (query.accountStatus === 'ON_LEAVE') {
            where.isActive = true;
            where.leaveRequests = {
                some: {
                    status: client_1.LeaveStatus.APPROVED,
                    fromDate: { lte: todayUtc },
                    toDate: { gte: todayUtc },
                },
            };
        }
        else if (query.isActive !== undefined) {
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
                            status: client_1.LeaveStatus.APPROVED,
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
                ? 'INACTIVE'
                : onLeave
                    ? 'ON_LEAVE'
                    : 'ACTIVE';
            const { leaveRequests: _lr, ...rest } = e;
            return {
                ...rest,
                employeeCode: employeeCodeFromId(e.id),
                email: e.user?.email ?? null,
                accountStatus,
                onLeave,
            };
        });
        return new page_dto_1.PageDto(data, new page_meta_dto_1.PageMetaDto({ pageOptionsDto: query, itemCount }));
    }
    async listDepartments(companyId) {
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
    async findOne(companyId, id) {
        const today = new Date();
        const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
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
                        status: client_1.LeaveStatus.APPROVED,
                        fromDate: { lte: todayUtc },
                        toDate: { gte: todayUtc },
                    },
                    take: 1,
                    select: { id: true },
                },
            },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
        const onLeave = employee.leaveRequests.length > 0;
        const accountStatus = !employee.isActive
            ? 'INACTIVE'
            : onLeave
                ? 'ON_LEAVE'
                : 'ACTIVE';
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
    async remove(companyId, id) {
        await this.assertEmployeeInCompany(companyId, id);
        await this.db.employee.delete({ where: { id } });
        return { success: true };
    }
    async bulkRemove(companyId, ids) {
        const unique = [...new Set(ids)];
        const result = await this.db.employee.deleteMany({
            where: { companyId, id: { in: unique } },
        });
        return { deleted: result.count };
    }
    async listPayrollSlips(companyId, employeeId) {
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
            const deductions = s.totalDeductions.toNumber() + s.loanDeductions.toNumber();
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
    async listLeaves(companyId, employeeId) {
        await this.assertEmployeeInCompany(companyId, employeeId);
        const leaves = await this.db.leaveRequest.findMany({
            where: { employeeId, employee: { companyId } },
            orderBy: { fromDate: 'desc' },
        });
        return leaves.map((l) => ({
            id: l.id,
            type: l.reason?.trim() || 'إجازة',
            fromDate: (0, attendance_time_util_1.formatYmd)(l.fromDate),
            toDate: (0, attendance_time_util_1.formatYmd)(l.toDate),
            days: (0, attendance_time_util_1.inclusiveDayCount)(l.fromDate, l.toDate),
            status: l.status,
            reason: l.reason,
        }));
    }
    async listAttendance(companyId, employeeId, query) {
        await this.assertEmployeeInCompany(companyId, employeeId);
        const where = {
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
            let workHours = null;
            if (r.checkIn && r.checkOut) {
                const mins = Math.max(0, Math.round((r.checkOut.getTime() - r.checkIn.getTime()) / 60000));
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
        const allForSummary = await this.db.attendanceRecord.findMany({
            where,
            select: { status: true, delayMinutes: true },
        });
        const summary = {
            present: allForSummary.filter((a) => a.status === 'PRESENT' && a.delayMinutes === 0).length,
            late: allForSummary.filter((a) => a.status === 'PRESENT' && a.delayMinutes > 0).length,
            absent: allForSummary.filter((a) => a.status === 'ABSENT').length,
            leave: allForSummary.filter((a) => a.status === 'LEAVE').length,
            remote: 0,
        };
        return {
            data,
            summary,
            meta: new page_meta_dto_1.PageMetaDto({
                pageOptionsDto: {
                    page: query.page,
                    limit: query.limit,
                },
                itemCount,
            }),
        };
    }
    async update(companyId, id, dto) {
        const existing = await this.db.employee.findFirst({
            where: { id, companyId },
            select: { id: true, userId: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Employee not found');
        }
        if (dto.shiftId) {
            await this.assertShiftInCompany(companyId, dto.shiftId);
        }
        if (dto.managerId !== undefined && dto.managerId !== null) {
            if (dto.managerId === id) {
                throw new common_1.BadRequestException('Employee cannot be their own manager');
            }
            const manager = await this.db.employee.findFirst({
                where: { id: dto.managerId, companyId },
                select: { id: true },
            });
            if (!manager) {
                throw new common_1.BadRequestException('Manager not found in your company');
            }
        }
        const { phone, managerId, contractDurationYears, departmentId, department, ...employeeFields } = dto;
        let deptPatch;
        if (departmentId !== undefined || department !== undefined) {
            if (departmentId === null) {
                deptPatch = { departmentId: null, department: null };
            }
            else {
                const dept = await this.resolveDepartment(companyId, departmentId ?? undefined, department);
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
                            contractDurationYears: contractDurationYears === null
                                ? null
                                : new client_1.Prisma.Decimal(contractDurationYears),
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
    async assertEmployeeInCompany(companyId, id) {
        const emp = await this.db.employee.findFirst({
            where: { id, companyId },
            select: { id: true },
        });
        if (!emp) {
            throw new common_1.NotFoundException('Employee not found');
        }
        return emp;
    }
    async assertShiftInCompany(companyId, shiftId) {
        const shift = await this.db.shift.findFirst({
            where: { id: shiftId, companyId },
            select: { id: true },
        });
        if (!shift) {
            throw new common_1.BadRequestException('Shift not found in your company');
        }
    }
    async resolveDepartment(companyId, departmentId, departmentName) {
        if (departmentId) {
            const row = await this.db.department.findFirst({
                where: { id: departmentId, companyId },
                select: { id: true, name: true },
            });
            if (!row) {
                throw new common_1.BadRequestException('Department not found in your company');
            }
            return row;
        }
        const name = departmentName?.trim();
        if (!name)
            return null;
        const row = await this.db.department.findFirst({
            where: { companyId, name },
            select: { id: true, name: true },
        });
        if (!row) {
            throw new common_1.BadRequestException('Department not found — create it under الأقسام first');
        }
        return row;
    }
};
exports.EmployeeService = EmployeeService;
exports.EmployeeService = EmployeeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        hashing_service_1.HashingService,
        limits_service_1.LimitsService,
        benefits_sync_service_1.BenefitsSyncService])
], EmployeeService);
function generateTempPassword() {
    return crypto.randomBytes(9).toString('base64url');
}
function splitCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        }
        else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}
//# sourceMappingURL=employee.service.js.map