/**
 * Rich demo seed for local / APIDog testing.
 *
 * Idempotent — safe to re-run (`npx prisma db seed`).
 *
 * Creates:
 *  - Global permissions + subscription plans + platform settings
 *  - Platform admin (SaaS operator)
 *  - Demo tenant "Najd Trading Co." with owner, shifts, 6 employees,
 *    documents, salary components, attendance (current month), approved loan
 *  - Second tenant "Red Sea Logistics" (isolation testing)
 *
 * Neon note: free-tier DBs sleep; the seed retries connect for ~45s.
 */
import {
  AttendanceStatus,
  DocumentType,
  EmploymentType,
  LeaveStatus,
  LoanInstallmentStatus,
  LoanStatus,
  OnboardingStep,
  PayrollCycleStatus,
  Prisma,
  PrismaClient,
  SalaryBasis,
  SalaryComponentType,
  SubscriptionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedNajazDemo, NAJAZ_DEMO } from './seed-najaz-demo';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

const OWNER_ROLE = 'Company Owner';
const EMPLOYEE_ROLE = 'Employee';

const PLATFORM = {
  companyId: 'platform-hq',
  email: 'platform@admin.com',
  password: 'Platform@123',
};

const NAJD = {
  companyId: 'seed-najd-trading',
  email: 'owner@najd.sa',
  password: 'Owner@1234',
  name: 'Najd Trading Co.',
  establishmentNumber: '1-7001234',
};

const RED_SEA = {
  companyId: 'seed-red-sea',
  email: 'owner@redsea.sa',
  password: 'Owner@1234',
  name: 'Red Sea Logistics',
  establishmentNumber: '1-7009999',
};

const PERMISSIONS = [
  'CREATE_EMPLOYEE',
  'UPDATE_EMPLOYEE',
  'VIEW_EMPLOYEE',
  'MANAGE_ATTENDANCE',
  'MANAGE_PAYROLL',
  'MANAGE_LOANS',
  'MANAGE_SHIFTS',
  'MANAGE_DOCUMENTS',
  'VIEW_REPORTS',
  'MANAGE_COMPANY_POLICY',
  'MANAGE_LEAVES',
  'APPROVE_LEAVES',
  'MANAGE_REQUESTS',
  'APPROVE_REQUESTS',
  'MANAGE_ROLES',
  'VIEW_ROLES',
  'MANAGE_DEPARTMENTS',
];

const SYSTEM_ROLE_PERMISSIONS: Record<string, string[]> = {
  HR: [
    'CREATE_EMPLOYEE',
    'UPDATE_EMPLOYEE',
    'VIEW_EMPLOYEE',
    'MANAGE_ATTENDANCE',
    'MANAGE_LOANS',
    'MANAGE_SHIFTS',
    'MANAGE_DOCUMENTS',
    'MANAGE_LEAVES',
    'APPROVE_LEAVES',
    'MANAGE_REQUESTS',
    'APPROVE_REQUESTS',
    'MANAGE_DEPARTMENTS',
    'VIEW_REPORTS',
    'VIEW_ROLES',
  ],
  Manager: [
    'VIEW_EMPLOYEE',
    'APPROVE_LEAVES',
    'APPROVE_REQUESTS',
    'MANAGE_ATTENDANCE',
  ],
  Payroll: [
    'VIEW_EMPLOYEE',
    'MANAGE_PAYROLL',
    'VIEW_REPORTS',
    'MANAGE_LOANS',
  ],
};

async function waitForDb(retries = 15, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✓ Database connected');
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`⏳ DB not ready (attempt ${i}/${retries}): ${msg.slice(0, 120)}`);
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

function utcDate(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d));
}

function monthBounds(ref = new Date()) {
  const y = ref.getUTCFullYear();
  const m = ref.getUTCMonth() + 1;
  return { year: y, month: m, from: utcDate(y, m, 1), to: utcDate(y, m + 1, 0) };
}

async function seedPermissions() {
  for (const action of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action },
      update: {},
      create: { action },
    });
  }
  console.log(`✓ ${PERMISSIONS.length} permissions`);
}

async function seedPlans() {
  const plans = [
    { name: 'Basic', maxEmployees: 25, monthlyPrice: new Prisma.Decimal('399.00') },
    { name: 'Pro', maxEmployees: 300, monthlyPrice: new Prisma.Decimal('899.00') },
    // 999999 = "unlimited" sentinel rendered as such in the UI.
    { name: 'Enterprise', maxEmployees: 999999, monthlyPrice: new Prisma.Decimal('2499.00') },
  ];
  const out: Record<string, string> = {};
  for (const p of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({ where: { name: p.name } });
    const row =
      existing ??
      (await prisma.subscriptionPlan.create({
        data: p,
      }));
    // Keep prices/caps fresh on re-seed
    await prisma.subscriptionPlan.update({
      where: { id: row.id },
      data: { maxEmployees: p.maxEmployees, monthlyPrice: p.monthlyPrice },
    });
    out[p.name] = row.id;
  }
  console.log('✓ Subscription plans: Basic / Pro / Enterprise');
  return out;
}

async function seedPlatformSettings() {
  await prisma.platformSetting.upsert({
    where: { id: 'global' },
    update: { defaultTrialMaxEmployees: 15, trialDays: 14 },
    create: {
      id: 'global',
      defaultTrialMaxEmployees: 15,
      trialDays: 14,
    },
  });
  console.log('✓ Platform settings');
}

async function seedPlatformAdmin() {
  const company = await prisma.company.upsert({
    where: { id: PLATFORM.companyId },
    update: { name: 'Platform HQ' },
    create: { id: PLATFORM.companyId, name: 'Platform HQ' },
  });

  await prisma.companyPolicy.upsert({
    where: { companyId: company.id },
    update: {},
    create: { companyId: company.id },
  });

  const role = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: OWNER_ROLE } },
    update: {},
    create: { companyId: company.id, name: OWNER_ROLE },
  });

  const password = await hash(PLATFORM.password);
  const admin = await prisma.user.upsert({
    where: { email: PLATFORM.email },
    update: { isPlatformAdmin: true, companyId: company.id, roleId: role.id },
    create: {
      email: PLATFORM.email,
      password,
      companyId: company.id,
      roleId: role.id,
      isPlatformAdmin: true,
      isPortalUser: false,
    },
  });

  console.log(`✓ Platform admin  ${PLATFORM.email} / ${PLATFORM.password}`);
  return admin;
}

async function ensureOwnerRole(companyId: string) {
  const permissions = await prisma.permission.findMany({
    select: { id: true, action: true },
  });
  const byAction = new Map(permissions.map((p) => [p.action, p.id]));

  const role = await prisma.role.upsert({
    where: { companyId_name: { companyId, name: OWNER_ROLE } },
    update: {},
    create: {
      companyId,
      name: OWNER_ROLE,
      permissions: { connect: permissions.map((p) => ({ id: p.id })) },
    },
  });
  await prisma.role.update({
    where: { id: role.id },
    data: { permissions: { set: permissions.map((p) => ({ id: p.id })) } },
  });

  await prisma.role.upsert({
    where: { companyId_name: { companyId, name: EMPLOYEE_ROLE } },
    update: {},
    create: { companyId, name: EMPLOYEE_ROLE },
  });

  for (const [name, actions] of Object.entries(SYSTEM_ROLE_PERMISSIONS)) {
    const ids = actions
      .map((a) => byAction.get(a))
      .filter((id): id is string => Boolean(id));
    const r = await prisma.role.upsert({
      where: { companyId_name: { companyId, name } },
      update: {},
      create: {
        companyId,
        name,
        permissions: { connect: ids.map((id) => ({ id })) },
      },
    });
    await prisma.role.update({
      where: { id: r.id },
      data: { permissions: { set: ids.map((id) => ({ id })) } },
    });
  }

  return role;
}

async function ensureEmployeeRole(companyId: string) {
  return prisma.role.upsert({
    where: { companyId_name: { companyId, name: EMPLOYEE_ROLE } },
    update: {},
    create: { companyId, name: EMPLOYEE_ROLE },
  });
}

type EmpSeed = {
  key: string;
  name: string;
  email: string;
  password: string;
  basicSalary: number;
  salaryBasis?: SalaryBasis;
  employmentType: EmploymentType;
  isGosiRegistered: boolean;
  gosiNumber?: string;
  shift: 'morning' | 'evening';
  allowances: Array<{ name: string; amount: number; isPercentage?: boolean }>;
  deductions?: Array<{ name: string; amount: number }>;
};

const NAJD_EMPLOYEES: EmpSeed[] = [
  {
    key: 'ahmed',
    name: 'Ahmed Al-Harbi',
    email: 'ahmed.harbi@najd.sa',
    password: 'Emp@12345',
    basicSalary: 8000,
    employmentType: EmploymentType.PERMANENT,
    isGosiRegistered: true,
    gosiNumber: '1002003001',
    shift: 'morning',
    allowances: [
      { name: 'Housing', amount: 2000 },
      { name: 'Transport', amount: 10, isPercentage: true },
    ],
    deductions: [{ name: 'Gym', amount: 50 }],
  },
  {
    key: 'fatima',
    name: 'Fatima Al-Qahtani',
    email: 'fatima.qahtani@najd.sa',
    password: 'Emp@12345',
    basicSalary: 9500,
    employmentType: EmploymentType.PERMANENT,
    isGosiRegistered: true,
    gosiNumber: '1002003002',
    shift: 'morning',
    allowances: [
      { name: 'Housing', amount: 2500 },
      { name: 'Transport', amount: 500 },
    ],
  },
  {
    key: 'omar',
    name: 'Omar Al-Zahrani',
    email: 'omar.zahrani@najd.sa',
    password: 'Emp@12345',
    basicSalary: 5500,
    employmentType: EmploymentType.CONTRACT,
    isGosiRegistered: true,
    gosiNumber: '1002003003',
    shift: 'evening',
    allowances: [{ name: 'Transport', amount: 400 }],
  },
  {
    key: 'sara',
    name: 'Sara Al-Mutairi',
    email: 'sara.mutairi@najd.sa',
    password: 'Emp@12345',
    basicSalary: 7000,
    employmentType: EmploymentType.PROBATION,
    isGosiRegistered: false,
    shift: 'morning',
    allowances: [{ name: 'Housing', amount: 1500 }],
  },
  {
    key: 'khaled',
    name: 'Khaled Al-Otaibi',
    email: 'khaled.otaibi@najd.sa',
    password: 'Emp@12345',
    basicSalary: 12000,
    employmentType: EmploymentType.PERMANENT,
    isGosiRegistered: true,
    gosiNumber: '1002003005',
    shift: 'morning',
    allowances: [
      { name: 'Housing', amount: 3000 },
      { name: 'Transport', amount: 800 },
      { name: 'Phone', amount: 200 },
    ],
  },
  {
    key: 'noura',
    name: 'Noura Al-Dosari',
    email: 'noura.dosari@najd.sa',
    password: 'Emp@12345',
    basicSalary: 4800,
    employmentType: EmploymentType.TEMPORARY,
    isGosiRegistered: false,
    shift: 'evening',
    allowances: [{ name: 'Transport', amount: 300 }],
  },
  {
    key: 'yousef',
    name: 'Yousef Al-Daily',
    email: 'yousef.daily@najd.sa',
    password: 'Emp@12345',
    basicSalary: 200, // SAR per PRESENT day
    salaryBasis: SalaryBasis.DAILY,
    employmentType: EmploymentType.TEMPORARY,
    isGosiRegistered: false,
    shift: 'morning',
    allowances: [{ name: 'Meal', amount: 15 }],
  },
  {
    key: 'maha',
    name: 'Maha Al-Hourly',
    email: 'maha.hourly@najd.sa',
    password: 'Emp@12345',
    basicSalary: 25, // SAR per regular hour
    salaryBasis: SalaryBasis.HOURLY,
    employmentType: EmploymentType.CONTRACT,
    isGosiRegistered: false,
    shift: 'evening',
    allowances: [],
  },
];

async function seedTenant(opts: {
  companyId: string;
  name: string;
  email: string;
  password: string;
  establishmentNumber: string;
  planId: string | null;
  subscriptionStatus: SubscriptionStatus;
}) {
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const company = await prisma.company.upsert({
    where: { id: opts.companyId },
    update: {
      name: opts.name,
      establishmentNumber: opts.establishmentNumber,
      planId: opts.planId,
      subscriptionStatus: opts.subscriptionStatus,
    },
    create: {
      id: opts.companyId,
      name: opts.name,
      establishmentNumber: opts.establishmentNumber,
      planId: opts.planId ?? undefined,
      subscriptionStatus: opts.subscriptionStatus,
      trialEndsAt:
        opts.subscriptionStatus === SubscriptionStatus.TRIAL
          ? trialEndsAt
          : undefined,
    },
  });

  await prisma.companyPolicy.upsert({
    where: { companyId: company.id },
    update: {
      gosiNumber: opts.companyId === NAJD.companyId ? 'GOSI-NAJD-7788' : 'GOSI-RS-1122',
      delayDeductionType: 'PER_MINUTE',
      absenceMultiplierUnexcused: new Prisma.Decimal('1.00'),
      absenceMultiplierExcused: new Prisma.Decimal('0.50'),
      overtimeMultiplierNormal: new Prisma.Decimal('1.50'),
      overtimeMultiplierHoliday: new Prisma.Decimal('2.00'),
      gosiEmployeePercentage: new Prisma.Decimal('9.75'),
      gosiCompanyPercentage: new Prisma.Decimal('11.75'),
      defaultWeekendDays: ['FRIDAY', 'SATURDAY'],
    },
    create: {
      companyId: company.id,
      gosiNumber: opts.companyId === NAJD.companyId ? 'GOSI-NAJD-7788' : 'GOSI-RS-1122',
      absenceMultiplierExcused: new Prisma.Decimal('0.50'),
    },
  });

  const ownerRole = await ensureOwnerRole(company.id);
  await ensureEmployeeRole(company.id);

  const passwordHash = await hash(opts.password);
  const owner = await prisma.user.upsert({
    where: { email: opts.email },
    update: {
      companyId: company.id,
      roleId: ownerRole.id,
      isPortalUser: false,
      isPlatformAdmin: false,
    },
    create: {
      email: opts.email,
      password: passwordHash,
      companyId: company.id,
      roleId: ownerRole.id,
      isPortalUser: false,
      isPlatformAdmin: false,
    },
  });

  return { company, owner, ownerRole };
}

async function seedShifts(companyId: string) {
  const morningExisting = await prisma.shift.findFirst({
    where: { companyId, name: 'Morning Shift' },
  });
  const morning =
    morningExisting ??
    (await prisma.shift.create({
      data: {
        companyId,
        name: 'Morning Shift',
        startTime: '08:00',
        endTime: '17:00',
        gracePeriodMinutes: 15,
      },
    }));

  const eveningExisting = await prisma.shift.findFirst({
    where: { companyId, name: 'Evening Shift' },
  });
  const evening =
    eveningExisting ??
    (await prisma.shift.create({
      data: {
        companyId,
        name: 'Evening Shift',
        startTime: '16:00',
        endTime: '00:00',
        gracePeriodMinutes: 10,
      },
    }));

  return { morning, evening };
}

async function seedEmployees(
  companyId: string,
  shifts: { morning: { id: string }; evening: { id: string } },
  list: EmpSeed[],
) {
  const empRole = await ensureEmployeeRole(companyId);
  const created: Record<string, { id: string; email: string; password: string }> =
    {};

  for (const e of list) {
    const passwordHash = await hash(e.password);
    const user = await prisma.user.upsert({
      where: { email: e.email },
      update: {
        companyId,
        roleId: empRole.id,
        isPortalUser: true,
        isPlatformAdmin: false,
      },
      create: {
        email: e.email,
        password: passwordHash,
        companyId,
        roleId: empRole.id,
        isPortalUser: true,
        isPlatformAdmin: false,
      },
    });

    const shiftId =
      e.shift === 'morning' ? shifts.morning.id : shifts.evening.id;

    let employee = await prisma.employee.findFirst({
      where: { userId: user.id },
    });
    if (employee) {
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          name: e.name,
          basicSalary: e.basicSalary,
          employmentType: e.employmentType,
          salaryBasis: e.salaryBasis ?? SalaryBasis.MONTHLY,
          isGosiRegistered: e.isGosiRegistered,
          gosiNumber: e.gosiNumber ?? null,
          shiftId,
          isActive: true,
          companyId,
        },
      });
    } else {
      employee = await prisma.employee.create({
        data: {
          companyId,
          userId: user.id,
          name: e.name,
          basicSalary: e.basicSalary,
          employmentType: e.employmentType,
          salaryBasis: e.salaryBasis ?? SalaryBasis.MONTHLY,
          isGosiRegistered: e.isGosiRegistered,
          gosiNumber: e.gosiNumber ?? null,
          shiftId,
          isActive: true,
        },
      });
    }

    // Replace salary components for clean re-seed
    await prisma.salaryComponent.deleteMany({ where: { employeeId: employee.id } });
    for (const a of e.allowances) {
      await prisma.salaryComponent.create({
        data: {
          employeeId: employee.id,
          type: SalaryComponentType.ALLOWANCE,
          name: a.name,
          amount: a.amount,
          isPercentage: a.isPercentage ?? false,
        },
      });
    }
    for (const d of e.deductions ?? []) {
      await prisma.salaryComponent.create({
        data: {
          employeeId: employee.id,
          type: SalaryComponentType.DEDUCTION,
          name: d.name,
          amount: d.amount,
          isPercentage: false,
        },
      });
    }

    created[e.key] = { id: employee.id, email: e.email, password: e.password };
  }

  console.log(`✓ ${list.length} employees + portal logins + salary components`);
  return created;
}

async function seedDocuments(emps: Record<string, { id: string }>) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;

  const specs: Array<{
    key: string;
    type: DocumentType;
    expiry: Date;
    number: string;
  }> = [
    {
      key: 'ahmed',
      type: DocumentType.NATIONAL_ID,
      expiry: utcDate(y, m + 1, 15),
      number: '1122334455',
    },
    {
      key: 'ahmed',
      type: DocumentType.CONTRACT,
      expiry: utcDate(y + 1, 6, 1),
      number: 'CTR-AHMED-2025',
    },
    {
      key: 'fatima',
      type: DocumentType.RESIDENCY,
      expiry: utcDate(y, m, 25),
      number: 'IQAMA-998877',
    },
    {
      key: 'omar',
      type: DocumentType.PASSPORT,
      expiry: utcDate(y + 2, 3, 10),
      number: 'A12345678',
    },
    {
      key: 'khaled',
      type: DocumentType.NATIONAL_ID,
      expiry: utcDate(y, m + 2, 5),
      number: '1099887766',
    },
  ];

  for (const s of specs) {
    const emp = emps[s.key];
    if (!emp) continue;
    const exists = await prisma.document.findFirst({
      where: { employeeId: emp.id, type: s.type, documentNumber: s.number },
    });
    if (!exists) {
      await prisma.document.create({
        data: {
          employeeId: emp.id,
          type: s.type,
          expiryDate: s.expiry,
          documentNumber: s.number,
          fileUrl: `https://files.example.com/${s.key}-${s.type.toLowerCase()}.pdf`,
        },
      });
    }
  }
  console.log('✓ Employee documents (some expiring soon)');
}

async function seedAttendance(
  companyId: string,
  emps: Record<string, { id: string }>,
  shifts: { morning: { id: string }; evening: { id: string } },
) {
  const { year, month, from, to } = monthBounds();
  // Clear this month's demo attendance for these employees then recreate
  const empIds = Object.values(emps).map((e) => e.id);
  await prisma.attendanceRecord.deleteMany({
    where: {
      employeeId: { in: empIds },
      date: { gte: from, lte: to },
    },
  });

  const workDays: Date[] = [];
  for (let d = 1; d <= Math.min(to.getUTCDate(), 12); d++) {
    const day = utcDate(year, month, d);
    const wd = day.getUTCDay(); // 0 Sun … 5 Fri 6 Sat
    if (wd !== 5 && wd !== 6) workDays.push(day);
  }

  const patterns: Record<
    string,
    Array<'present' | 'late' | 'absent' | 'leave' | 'ot'>
  > = {
    ahmed: ['present', 'late', 'present', 'ot', 'present', 'present', 'late', 'present'],
    fatima: ['present', 'present', 'leave', 'present', 'present', 'present', 'present', 'present'],
    omar: ['present', 'absent', 'present', 'late', 'present', 'ot', 'present', 'present'],
    sara: ['present', 'present', 'present', 'late', 'present', 'present', 'absent', 'present'],
    khaled: ['present', 'ot', 'present', 'present', 'late', 'present', 'present', 'ot'],
    noura: ['present', 'present', 'late', 'present', 'leave', 'present', 'present', 'present'],
  };

  let count = 0;
  for (const [key, emp] of Object.entries(emps)) {
    const shift =
      NAJD_EMPLOYEES.find((e) => e.key === key)?.shift === 'evening'
        ? shifts.evening
        : shifts.morning;
    const pattern = patterns[key] ?? ['present'];

    for (let i = 0; i < workDays.length; i++) {
      const date = workDays[i];
      const kind = pattern[i % pattern.length];
      const y = date.getUTCFullYear();
      const m = date.getUTCMonth();
      const d = date.getUTCDate();

      if (kind === 'absent') {
        await prisma.attendanceRecord.create({
          data: {
            employeeId: emp.id,
            shiftId: shift.id,
            date,
            status: AttendanceStatus.ABSENT,
            delayMinutes: 0,
            overtimeHours: 0,
          },
        });
      } else if (kind === 'leave') {
        await prisma.attendanceRecord.create({
          data: {
            employeeId: emp.id,
            shiftId: shift.id,
            date,
            status: AttendanceStatus.LEAVE,
            delayMinutes: 0,
            overtimeHours: 0,
          },
        });
      } else {
        const isEvening =
          NAJD_EMPLOYEES.find((e) => e.key === key)?.shift === 'evening';
        const lateMin = kind === 'late' ? 25 : 0;
        const otHours = kind === 'ot' ? 1.5 : 0;
        const ymd = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        let checkInIso: string;
        let checkOutIso: string;
        if (isEvening) {
          checkInIso = `${ymd}T16:${String(lateMin).padStart(2, '0')}:00+03:00`;
          // Base end midnight; add OT hours into next calendar day
          const outHour = Math.floor(otHours); // 0 or 1
          const outMin = otHours % 1 ? 30 : 0;
          const next = utcDate(y, m + 1, d + 1);
          const nymd = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
          checkOutIso = `${nymd}T${String(outHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')}:00+03:00`;
        } else {
          checkInIso = `${ymd}T08:${String(lateMin).padStart(2, '0')}:00+03:00`;
          const outHour = 17 + Math.floor(otHours);
          const outMin = otHours % 1 ? 30 : 0;
          checkOutIso = `${ymd}T${String(outHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')}:00+03:00`;
        }

        await prisma.attendanceRecord.create({
          data: {
            employeeId: emp.id,
            shiftId: shift.id,
            date,
            checkIn: new Date(checkInIso),
            checkOut: new Date(checkOutIso),
            status: AttendanceStatus.PRESENT,
            delayMinutes: lateMin,
            overtimeHours: otHours,
          },
        });
      }
      count += 1;
    }
  }

  console.log(`✓ ${count} attendance records for ${year}-${String(month).padStart(2, '0')}`);
  return { year, month };
}

async function seedLoan(ahmedId: string, year: number, month: number) {
  // Remove prior demo loans for Ahmed then recreate one approved schedule
  const old = await prisma.loan.findMany({ where: { employeeId: ahmedId } });
  for (const l of old) {
    await prisma.loanInstallment.deleteMany({ where: { loanId: l.id } });
    await prisma.loan.delete({ where: { id: l.id } });
  }

  const loan = await prisma.loan.create({
    data: {
      employeeId: ahmedId,
      totalAmount: new Prisma.Decimal('6000.00'),
      status: LoanStatus.APPROVED,
    },
  });

  // 3 monthly installments of 2000 starting this month
  for (let i = 0; i < 3; i++) {
    const dueMonth = month + i;
    const dueYear = dueMonth > 12 ? year + 1 : year;
    const m = ((dueMonth - 1) % 12) + 1;
    await prisma.loanInstallment.create({
      data: {
        loanId: loan.id,
        amount: new Prisma.Decimal('2000.00'),
        dueDate: utcDate(dueYear, m, 1),
        status: LoanInstallmentStatus.PENDING,
      },
    });
  }

  console.log('✓ Approved loan for Ahmed (3 × 2000 SAR, first due this month)');
}

async function seedRedSeaMinimal(planId: string) {
  const { company } = await seedTenant({
    companyId: RED_SEA.companyId,
    name: RED_SEA.name,
    email: RED_SEA.email,
    password: RED_SEA.password,
    establishmentNumber: RED_SEA.establishmentNumber,
    planId,
    subscriptionStatus: SubscriptionStatus.TRIAL,
  });

  const shifts = await seedShifts(company.id);
  const empRole = await ensureEmployeeRole(company.id);
  const passwordHash = await hash('Emp@12345');

  const user = await prisma.user.upsert({
    where: { email: 'yousef@redsea.sa' },
    update: { companyId: company.id, roleId: empRole.id, isPortalUser: true },
    create: {
      email: 'yousef@redsea.sa',
      password: passwordHash,
      companyId: company.id,
      roleId: empRole.id,
      isPortalUser: true,
    },
  });

  let emp = await prisma.employee.findFirst({ where: { userId: user.id } });
  if (!emp) {
    emp = await prisma.employee.create({
      data: {
        companyId: company.id,
        userId: user.id,
        name: 'Yousef Al-Ghamdi',
        basicSalary: 6000,
        shiftId: shifts.morning.id,
        isGosiRegistered: false,
        isActive: true,
      },
    });
  }

  console.log(`✓ Second tenant "${RED_SEA.name}" (isolation tests)`);
}

async function main() {
  console.log('\n🌱 Seeding HR System demo data…\n');
  await waitForDb();

  await seedPermissions();
  const plans = await seedPlans();
  await seedPlatformSettings();
  await seedPlatformAdmin();

  const najd = await seedTenant({
    companyId: NAJD.companyId,
    name: NAJD.name,
    email: NAJD.email,
    password: NAJD.password,
    establishmentNumber: NAJD.establishmentNumber,
    planId: plans.Pro,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
  });

  const shifts = await seedShifts(najd.company.id);
  const emps = await seedEmployees(najd.company.id, shifts, NAJD_EMPLOYEES);
  await seedDocuments(emps);
  const attendancePeriod = await seedAttendance(
    najd.company.id,
    emps,
    shifts,
  );
  await seedLoan(
    emps.ahmed.id,
    attendancePeriod.year,
    attendancePeriod.month,
  );

  await seedRedSeaMinimal(plans.Basic);

  await seedNajazDemo(prisma, plans.Pro);

  console.log('\n══════════════════════════════════════════════════');
  console.log('  LOGIN CREDENTIALS');
  console.log('══════════════════════════════════════════════════');
  console.log('  نجاز demo dashboard (rich data)');
  console.log(`    ${NAJAZ_DEMO.email} / ${NAJAZ_DEMO.password}`);
  console.log('  Platform admin');
  console.log(`    ${PLATFORM.email} / ${PLATFORM.password}`);
  console.log('  Najd Trading — Company Owner');
  console.log(`    ${NAJD.email} / ${NAJD.password}`);
  console.log('  Najd Trading — Employees (all same password Emp@12345)');
  for (const e of NAJD_EMPLOYEES) {
    console.log(`    ${e.email}`);
  }
  console.log('  Red Sea Logistics — Owner (tenant B)');
  console.log(`    ${RED_SEA.email} / ${RED_SEA.password}`);
  console.log('  Red Sea — Employee');
  console.log('    yousef@redsea.sa / Emp@12345');
  console.log('══════════════════════════════════════════════════');
  console.log('  Suggested next API calls:');
  console.log(`    POST /auth/login  → ${NAJAZ_DEMO.email}`);
  console.log('    GET  /reports/dashboard');
  console.log('══════════════════════════════════════════════════\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('\n❌ Seed failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
