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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NAJAZ_DEMO = void 0;
exports.seedNajazDemo = seedNajazDemo;
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const OWNER_ROLE = 'Company Owner';
const EMPLOYEE_ROLE = 'Employee';
exports.NAJAZ_DEMO = {
    companyId: 'seed-najaz-demo',
    email: 'noordragon20014@gmail.com',
    password: 'Owner@1234',
    name: 'نجاز',
    fullName: 'مهاب محمد',
    jobTitle: 'UI/UX Designer',
    establishmentNumber: '1-7002026',
};
const DEPT_NAMES = [
    'الهندسة',
    'المبيعات',
    'العمليات',
    'التصميم',
    'الموارد البشرية',
    'المالية',
    'المحاسبة',
    'التسويق',
    'خدمة العملاء',
    'تقنية المعلومات',
    'الأمن السيبراني',
    'الدعم الفني',
    'الجودة',
    'المشتريات',
    'اللوجستيات',
    'المستودعات',
    'الإنتاج',
    'الصيانة',
    'الشؤون القانونية',
    'الامتثال',
    'العلاقات العامة',
    'التطوير المؤسسي',
    'التدريب',
    'التوظيف',
    'الرواتب والمزايا',
    'الإدارة التنفيذية',
    'إدارة المشاريع',
    'البحث والتطوير',
    'الابتكار',
    'البيانات والتحليلات',
    'الذكاء الاصطناعي',
    'تجربة العملاء',
    'نجاح العملاء',
    'المبيعات الداخلية',
    'المبيعات الميدانية',
    'الشراكات',
    'التوسع',
    'التخطيط الاستراتيجي',
    'إدارة المخاطر',
    'التأمين',
    'المرافق',
    'الأسطول',
    'البيئة والسلامة',
    'الصحة المهنية',
    'الاتصال الداخلي',
    'الإعلام',
    'المحتوى',
    'المنتج',
    'نجاح الشركاء',
    'الخدمات المشتركة',
];
const FIRST = [
    'أحمد',
    'محمد',
    'خالد',
    'سعد',
    'فهد',
    'عبدالله',
    'يوسف',
    'عمر',
    'علي',
    'نواف',
    'سلمان',
    'تركي',
    'فاطمة',
    'نورة',
    'سارة',
    'لينا',
    'ريم',
    'هدى',
    'منى',
    'أمل',
];
const LAST = [
    'الحربي',
    'القحطاني',
    'الزهراني',
    'المطيري',
    'الشمري',
    'العتيبي',
    'الدوسري',
    'الغامدي',
    'الشهري',
    'السهلي',
];
const POSITIONS_POOL = [
    'مهندس برمجيات',
    'مهندس نظم',
    'مطور واجهات',
    'مهندس DevOps',
    'مندوب مبيعات',
    'مدير حسابات',
    'أخصائي مبيعات',
    'مشرف عمليات',
    'منسق تشغيل',
    'أخصائي لوجستيات',
    'UI/UX Designer',
    'مصمم جرافيك',
    'مصمم منتجات',
    'أخصائي موارد بشرية',
    'محاسب',
    'أخصائي تسويق',
];
function hash(pw) {
    return bcrypt.hash(pw, 10);
}
function utcDate(y, m0, d) {
    return new Date(Date.UTC(y, m0, d));
}
function isWeekendUtc(d) {
    const day = d.getUTCDay();
    return day === 5 || day === 6;
}
function checkTime(date, hours, minutes) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes, 0));
}
const SYSTEM_ROLE_PERMISSIONS = {
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
async function ensureOwnerRole(prisma, companyId) {
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
            .filter((id) => Boolean(id));
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
async function ensureEmployeeRole(prisma, companyId) {
    return prisma.role.upsert({
        where: { companyId_name: { companyId, name: EMPLOYEE_ROLE } },
        update: {},
        create: { companyId, name: EMPLOYEE_ROLE },
    });
}
async function seedNajazDemo(prisma, planId) {
    console.log('\n▶ Seeding نجاز dashboard demo (noordragon)…');
    const passwordHash = await hash(exports.NAJAZ_DEMO.password);
    const company = await prisma.company.upsert({
        where: { id: exports.NAJAZ_DEMO.companyId },
        update: {
            name: exports.NAJAZ_DEMO.name,
            establishmentNumber: exports.NAJAZ_DEMO.establishmentNumber,
            planId,
            subscriptionStatus: client_1.SubscriptionStatus.ACTIVE,
            billingCycle: 'MONTHLY',
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        create: {
            id: exports.NAJAZ_DEMO.companyId,
            name: exports.NAJAZ_DEMO.name,
            establishmentNumber: exports.NAJAZ_DEMO.establishmentNumber,
            planId,
            subscriptionStatus: client_1.SubscriptionStatus.ACTIVE,
            billingCycle: 'MONTHLY',
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });
    const ownerRole = await ensureOwnerRole(prisma, company.id);
    await ensureEmployeeRole(prisma, company.id);
    await prisma.companyPolicy.upsert({
        where: { companyId: company.id },
        update: {
            gosiNumber: 'GOSI-NAJAZ-2026',
            delayDeductionType: 'PER_MINUTE',
            defaultWeekendDays: ['FRIDAY', 'SATURDAY'],
            gosiEmployeePercentage: new client_1.Prisma.Decimal('9.75'),
            gosiCompanyPercentage: new client_1.Prisma.Decimal('11.75'),
        },
        create: {
            companyId: company.id,
            gosiNumber: 'GOSI-NAJAZ-2026',
            absenceMultiplierExcused: new client_1.Prisma.Decimal('0.50'),
        },
    });
    const existingUser = await prisma.user.findUnique({
        where: { email: exports.NAJAZ_DEMO.email },
    });
    if (existingUser && existingUser.companyId !== company.id) {
        console.log(`  ℹ️  Moving existing user from company ${existingUser.companyId} → ${company.id}`);
    }
    const owner = await prisma.user.upsert({
        where: { email: exports.NAJAZ_DEMO.email },
        update: {
            password: passwordHash,
            fullName: exports.NAJAZ_DEMO.fullName,
            jobTitle: exports.NAJAZ_DEMO.jobTitle,
            phone: '+966500000014',
            companyId: company.id,
            roleId: ownerRole.id,
            isPortalUser: false,
            isPlatformAdmin: false,
            onboardingStep: client_1.OnboardingStep.COMPLETE,
            onboardingCompletedAt: new Date(),
        },
        create: {
            email: exports.NAJAZ_DEMO.email,
            password: passwordHash,
            fullName: exports.NAJAZ_DEMO.fullName,
            jobTitle: exports.NAJAZ_DEMO.jobTitle,
            phone: '+966500000014',
            companyId: company.id,
            roleId: ownerRole.id,
            isPortalUser: false,
            isPlatformAdmin: false,
            onboardingStep: client_1.OnboardingStep.COMPLETE,
            onboardingCompletedAt: new Date(),
        },
    });
    await prisma.payrollCycle.deleteMany({ where: { companyId: company.id } });
    await prisma.employee.deleteMany({ where: { companyId: company.id } });
    await prisma.department.deleteMany({ where: { companyId: company.id } });
    await prisma.shift.deleteMany({ where: { companyId: company.id } });
    const morning = await prisma.shift.create({
        data: {
            companyId: company.id,
            name: 'الوردية الصباحية',
            startTime: '08:00',
            endTime: '17:00',
            gracePeriodMinutes: 15,
        },
    });
    await prisma.shift.create({
        data: {
            companyId: company.id,
            name: 'الوردية المسائية',
            startTime: '16:00',
            endTime: '00:00',
            gracePeriodMinutes: 10,
        },
    });
    const departments = await prisma.$transaction(DEPT_NAMES.map((name) => prisma.department.create({
        data: { companyId: company.id, name },
        select: { id: true, name: true },
    })));
    console.log(`  ✓ ${departments.length} departments`);
    const TOTAL_EMPLOYEES = 248;
    const roster = [];
    for (let idx = 0; idx < TOTAL_EMPLOYEES; idx++) {
        const dept = departments[idx % departments.length];
        const first = FIRST[idx % FIRST.length];
        const last = LAST[Math.floor(idx / FIRST.length) % LAST.length];
        const basicSalary = 1400 + (idx % 17) * 35 + (idx % 5) * 20;
        roster.push({
            name: `${first} ${last}`,
            departmentId: dept.id,
            department: dept.name,
            position: POSITIONS_POOL[idx % POSITIONS_POOL.length],
            basicSalary,
        });
    }
    const designDept = departments.find((d) => d.name === 'التصميم');
    if (designDept) {
        const slot = roster.find((r) => r.departmentId === designDept.id);
        if (slot) {
            slot.name = 'مهاب محمد';
            slot.position = 'UI/UX Designer';
        }
    }
    const createdIds = [];
    const BATCH = 50;
    for (let i = 0; i < roster.length; i += BATCH) {
        const chunk = roster.slice(i, i + BATCH);
        const rows = await prisma.$transaction(chunk.map((e, j) => prisma.employee.create({
            data: {
                companyId: company.id,
                name: e.name,
                departmentId: e.departmentId,
                department: e.department,
                position: e.position,
                basicSalary: new client_1.Prisma.Decimal(e.basicSalary),
                employmentType: client_1.EmploymentType.PERMANENT,
                salaryBasis: client_1.SalaryBasis.MONTHLY,
                isGosiRegistered: (i + j) % 3 !== 0,
                shiftId: morning.id,
                isActive: true,
                contractDurationYears: new client_1.Prisma.Decimal(1),
            },
            select: { id: true },
        })));
        createdIds.push(...rows.map((r) => r.id));
    }
    const employees = await prisma.employee.findMany({
        where: { companyId: company.id },
        select: {
            id: true,
            name: true,
            basicSalary: true,
            department: true,
            position: true,
        },
    });
    const rankEligible = employees.filter((e) => e.name !== 'مهاب محمد');
    const rankOrder = [...rankEligible].sort((a, b) => a.id.localeCompare(b.id));
    const teamLeadCount = Math.max(1, Math.floor(rankOrder.length * 0.15));
    const deptMgrCount = Math.max(1, Math.floor(rankOrder.length * 0.1));
    const teamLeadIds = rankOrder.slice(0, teamLeadCount).map((e) => e.id);
    const deptMgrIds = rankOrder
        .slice(teamLeadCount, teamLeadCount + deptMgrCount)
        .map((e) => e.id);
    if (teamLeadIds.length) {
        await prisma.employee.updateMany({
            where: { id: { in: teamLeadIds } },
            data: { jobRank: client_1.JobRank.TEAM_LEAD },
        });
    }
    if (deptMgrIds.length) {
        await prisma.employee.updateMany({
            where: { id: { in: deptMgrIds } },
            data: { jobRank: client_1.JobRank.DEPARTMENT_MANAGER },
        });
    }
    const mohabForManager = employees.find((e) => e.name === 'مهاب محمد');
    const managerCandidate = employees.find((e) => deptMgrIds.includes(e.id)) ??
        employees.find((e) => teamLeadIds.includes(e.id)) ??
        employees.find((e) => e.name.includes('عبدالرحمن')) ??
        employees.find((e) => e.id !== mohabForManager?.id);
    if (mohabForManager && managerCandidate) {
        await prisma.employee.update({
            where: { id: mohabForManager.id },
            data: { managerId: managerCandidate.id },
        });
    }
    const now = new Date();
    const y = now.getUTCFullYear();
    const m0 = now.getUTCMonth();
    const d = now.getUTCDate();
    const today = utcDate(y, m0, d);
    const shuffled = [...employees].sort((a, b) => a.id.localeCompare(b.id));
    const lateCount = 7;
    const absentCount = 3;
    const presentCount = 238;
    const leaveTodayCount = Math.max(0, shuffled.length - presentCount - absentCount);
    const todayRows = [];
    let cursor = 0;
    for (let i = 0; i < presentCount - lateCount && cursor < shuffled.length; i++) {
        const emp = shuffled[cursor++];
        todayRows.push({
            employeeId: emp.id,
            shiftId: morning.id,
            date: today,
            status: client_1.AttendanceStatus.PRESENT,
            checkIn: checkTime(today, 8, 2),
            checkOut: checkTime(today, 17, 5),
            delayMinutes: 0,
            overtimeHours: new client_1.Prisma.Decimal(0),
        });
    }
    for (let i = 0; i < lateCount && cursor < shuffled.length; i++) {
        const emp = shuffled[cursor++];
        todayRows.push({
            employeeId: emp.id,
            shiftId: morning.id,
            date: today,
            status: client_1.AttendanceStatus.PRESENT,
            checkIn: checkTime(today, 8, 35),
            checkOut: checkTime(today, 17, 5),
            delayMinutes: 20 + i,
            overtimeHours: new client_1.Prisma.Decimal(0),
        });
    }
    for (let i = 0; i < absentCount && cursor < shuffled.length; i++) {
        const emp = shuffled[cursor++];
        todayRows.push({
            employeeId: emp.id,
            shiftId: morning.id,
            date: today,
            status: client_1.AttendanceStatus.ABSENT,
            delayMinutes: 0,
            overtimeHours: new client_1.Prisma.Decimal(0),
        });
    }
    for (let i = 0; i < leaveTodayCount && cursor < shuffled.length; i++) {
        const emp = shuffled[cursor++];
        todayRows.push({
            employeeId: emp.id,
            shiftId: morning.id,
            date: today,
            status: client_1.AttendanceStatus.LEAVE,
            delayMinutes: 0,
            overtimeHours: new client_1.Prisma.Decimal(0),
        });
    }
    const historyRows = [];
    const monthsToSeed = [
        { year: y, month0: m0, maxDay: d },
    ];
    {
        const prev = new Date(Date.UTC(y, m0 - 1, 1));
        const prevLast = new Date(Date.UTC(y, m0, 0)).getUTCDate();
        monthsToSeed.push({
            year: prev.getUTCFullYear(),
            month0: prev.getUTCMonth(),
            maxDay: prevLast + 1,
        });
    }
    for (const block of monthsToSeed) {
        for (let day = 1; day < block.maxDay; day++) {
            const date = utcDate(block.year, block.month0, day);
            if (isWeekendUtc(date))
                continue;
            for (let i = 0; i < shuffled.length; i++) {
                const emp = shuffled[i];
                const roll = (day * 17 + i * 3 + block.month0 * 7) % 100;
                let status = client_1.AttendanceStatus.PRESENT;
                let delayMinutes = 0;
                if (roll < 3)
                    status = client_1.AttendanceStatus.ABSENT;
                else if (roll < 6)
                    status = client_1.AttendanceStatus.LEAVE;
                else if (roll < 12)
                    delayMinutes = 10 + (roll % 20);
                historyRows.push({
                    employeeId: emp.id,
                    shiftId: morning.id,
                    date,
                    status,
                    checkIn: status === client_1.AttendanceStatus.PRESENT
                        ? checkTime(date, 8, delayMinutes ? 25 : 5)
                        : undefined,
                    checkOut: status === client_1.AttendanceStatus.PRESENT
                        ? checkTime(date, 17, 0)
                        : undefined,
                    delayMinutes,
                    overtimeHours: new client_1.Prisma.Decimal(roll > 90 ? 1 : 0),
                });
            }
        }
    }
    const allAtt = [...historyRows, ...todayRows];
    for (let i = 0; i < allAtt.length; i += 500) {
        await prisma.attendanceRecord.createMany({
            data: allAtt.slice(i, i + 500),
            skipDuplicates: true,
        });
    }
    const mohab = employees.find((e) => e.name === 'مهاب محمد') ?? employees[0];
    const leaveSeed = [
        {
            employeeId: mohab.id,
            status: client_1.LeaveStatus.APPROVED,
            fromOffset: -1,
            days: 3,
        },
        {
            employeeId: mohab.id,
            status: client_1.LeaveStatus.PENDING,
            fromOffset: 3,
            days: 1,
        },
        {
            employeeId: mohab.id,
            status: client_1.LeaveStatus.REJECTED,
            fromOffset: -20,
            days: 1,
        },
        {
            employeeId: mohab.id,
            status: client_1.LeaveStatus.PENDING,
            fromOffset: 7,
            days: 3,
        },
    ];
    for (let i = 0; i < 12; i++) {
        const emp = shuffled[(i * 11 + 5) % shuffled.length];
        const statuses = [
            client_1.LeaveStatus.PENDING,
            client_1.LeaveStatus.APPROVED,
            client_1.LeaveStatus.REJECTED,
        ];
        const coversToday = i % 4 === 1;
        leaveSeed.push({
            employeeId: emp.id,
            status: statuses[i % 3],
            fromOffset: coversToday && statuses[i % 3] === client_1.LeaveStatus.APPROVED ? -1 : -i * 2,
            days: coversToday && statuses[i % 3] === client_1.LeaveStatus.APPROVED
                ? 3
                : 1 + (i % 3),
        });
    }
    await prisma.leaveRequest.createMany({
        data: leaveSeed.map((l) => {
            const from = utcDate(y, m0, Math.max(1, d + l.fromOffset));
            const to = utcDate(y, m0, Math.max(1, d + l.fromOffset + l.days - 1));
            return {
                employeeId: l.employeeId,
                fromDate: from,
                toDate: to,
                reason: 'إجازة شخصية',
                status: l.status,
            };
        }),
    });
    const TARGET_NET = 412850;
    const totalBasic = employees.reduce((s, e) => s + e.basicSalary.toNumber(), 0);
    const scale = TARGET_NET / (totalBasic * 1.03);
    for (let back = 5; back >= 0; back--) {
        let cy = y;
        let cm = m0 + 1 - back;
        while (cm <= 0) {
            cm += 12;
            cy -= 1;
        }
        const trend = 0.94 + (5 - back) * 0.012;
        const cycle = await prisma.payrollCycle.create({
            data: {
                companyId: company.id,
                month: cm,
                year: cy,
                status: client_1.PayrollCycleStatus.CLOSED,
            },
        });
        const slipData = employees.map((e) => {
            const basic = +(e.basicSalary.toNumber() * scale * trend).toFixed(2);
            const allowances = +(basic * 0.08).toFixed(2);
            const deductions = +(basic * 0.05).toFixed(2);
            const net = +(basic + allowances - deductions).toFixed(2);
            return {
                payrollCycleId: cycle.id,
                employeeId: e.id,
                basicSalary: new client_1.Prisma.Decimal(basic),
                totalAllowances: new client_1.Prisma.Decimal(allowances),
                totalDeductions: new client_1.Prisma.Decimal(deductions),
                loanDeductions: new client_1.Prisma.Decimal(0),
                overtimeBonus: new client_1.Prisma.Decimal(0),
                netSalary: new client_1.Prisma.Decimal(net),
            };
        });
        for (let i = 0; i < slipData.length; i += 200) {
            await prisma.payrollSlip.createMany({
                data: slipData.slice(i, i + 200),
            });
        }
    }
    console.log(`✓ نجاز demo: ${employees.length} employees, attendance, leaves, 6 payroll cycles`);
    console.log(`  Login: ${exports.NAJAZ_DEMO.email} / ${exports.NAJAZ_DEMO.password} (owner ${owner.id})`);
    const toDeactivate = shuffled.slice(-3).map((e) => e.id);
    if (toDeactivate.length) {
        await prisma.employee.updateMany({
            where: { id: { in: toDeactivate } },
            data: { isActive: false },
        });
    }
}
//# sourceMappingURL=seed-najaz-demo.js.map